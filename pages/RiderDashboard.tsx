
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, Ride, RideStatus, UserRole, PaymentMethod, PaymentSettings, VehicleType, PricingRule } from '../types';
import RealMap from '../components/RealMap';
import ChatWidget from '../components/ChatWidget';
import { getRideInsight } from '../services/geminiService';

interface RiderDashboardProps {
  rider: UserProfile;
  rides: Ride[];
  onRequestRide: (ride: Omit<Ride, 'id' | 'status' | 'timestamp'>) => void;
  onUpdateStatus: (rideId: string, status: RideStatus) => void;
  availableDrivers: UserProfile[];
  allUsers: UserProfile[];
  onRateRide: (rideId: string, rating: number, role: UserRole) => void;
  onSendMessage: (rideId: string, text: string) => void;
  onUpdateBalance: (userId: string, amount: number) => void;
  paymentSettings: PaymentSettings;
  externalActiveTab?: string;
  onTabChange?: (tab: string) => void;
}

const RiderDashboard: React.FC<RiderDashboardProps> = ({ 
  rider, rides, onRequestRide, onUpdateStatus, availableDrivers, allUsers, onRateRide, onSendMessage, onUpdateBalance, paymentSettings,
  externalActiveTab, onTabChange
}) => {
  const [internalView, setInternalView] = useState<'home' | 'history' | 'wallet'>('home');
  const [destination, setDestination] = useState('');
  const [origin] = useState('Minha Localização');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(VehicleType.CAR);
  const [selectedService, setSelectedService] = useState<'UberX' | 'UberComfort' | 'UberBlack'>('UberX');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isDriverTyping, setIsDriverTyping] = useState(false);
  const [selectedRideForReceipt, setSelectedRideForReceipt] = useState<Ride | null>(null);
  
  const [userPos, setUserPos] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const [driverPos, setDriverPos] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const watchIdRef = useRef<number | null>(null);

  // Verifica se a API de pagamento está configurada pelo Admin
  const isPaymentConfigured = !!paymentSettings.apiKey;

  // Sincronizar visão interna com tab externa
  const currentView = (externalActiveTab === 'history' || externalActiveTab === 'wallet' || externalActiveTab === 'home') 
    ? externalActiveTab 
    : internalView;

  const setView = (v: 'home' | 'history' | 'wallet') => {
    if (onTabChange) onTabChange(v);
    else setInternalView(v);
  };

  const activeRide = rides.find(r => 
    r.riderId === rider.id && 
    r.status !== RideStatus.COMPLETED && 
    r.status !== RideStatus.CANCELLED
  );

  const completedRides = rides.filter(r => r.riderId === rider.id && r.status === RideStatus.COMPLETED);
  
  useEffect(() => {
    if (activeRide?.status === RideStatus.ACCEPTED) {
      const timeout = setTimeout(() => setIsDriverTyping(true), 3000);
      const stopTimeout = setTimeout(() => setIsDriverTyping(false), 8000);
      return () => { clearTimeout(timeout); clearTimeout(stopTimeout); };
    }
    setIsDriverTyping(false);
  }, [activeRide?.status]);

  const pricingData = useMemo(() => {
    const rules = paymentSettings.pricingRules;
    const destLower = destination.toLowerCase();
    
    // Procura por regra baseada no bairro digitado ou usa a default
    let activeRule = rules.find(r => destLower.includes(r.regionName.toLowerCase())) || rules.find(r => r.id === 'default');
    if (!activeRule) activeRule = { id: 'fallback', regionName: 'Padrão', basePrice: 5, pricePerKm: 2, active: true };

    const estimatedDistKm = 4.8;
    const calculateForService = (service: 'UberX' | 'UberComfort' | 'UberBlack') => {
      const multipliers = { UberX: 1.0, UberComfort: 1.3, UberBlack: 1.8 };
      const vehicleMult = selectedVehicle === VehicleType.MOTORCYCLE ? 0.65 : 1.0;
      return (activeRule!.basePrice + (activeRule!.pricePerKm * estimatedDistKm)) * multipliers[service] * vehicleMult;
    };

    return {
      ruleName: activeRule.regionName,
      prices: { UberX: calculateForService('UberX'), UberComfort: calculateForService('UberComfort'), UberBlack: calculateForService('UberBlack') }
    };
  }, [destination, selectedVehicle, paymentSettings.pricingRules]);

  const currentPrice = pricingData.prices[selectedService];

  useEffect(() => {
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => setUserPos({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error("Error getting location", error),
        { enableHighAccuracy: true }
      );
    }
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  useEffect(() => {
    if (activeRide && activeRide.status !== RideStatus.REQUESTED && userPos) {
      const interval = setInterval(() => {
        setDriverPos(prev => {
          const isEnRoute = activeRide.status === RideStatus.IN_PROGRESS;
          const target = isEnRoute ? activeRide.destination : { lat: userPos.lat, lng: userPos.lng };
          if (!prev) return { lat: target.lat + 0.005, lng: target.lng + 0.005 };
          const step = 0.00015;
          const dLat = target.lat - prev.lat;
          const dLng = target.lng - prev.lng;
          if (Math.abs(dLat) < step && Math.abs(dLng) < step) return prev;
          return { lat: prev.lat + (dLat > 0 ? step : -step), lng: prev.lng + (dLat > 0 ? step : -step) };
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDriverPos(undefined);
    }
  }, [activeRide?.status, activeRide?.destination, userPos]);

  const handleConfirmRide = () => {
    if (!destination || !userPos) return;
    if (selectedPayment === PaymentMethod.PREPAID && (rider.walletBalance || 0) < currentPrice) {
      alert("Saldo insuficiente na carteira Duarte Pay.");
      setView('wallet');
      return;
    }
    onRequestRide({
      riderId: rider.id,
      origin: { lat: userPos.lat, lng: userPos.lng, address: origin },
      destination: { lat: userPos.lat + 0.015, lng: userPos.lng + 0.015, address: destination },
      price: currentPrice,
      paymentMethod: selectedPayment,
      vehicleTypeRequested: selectedVehicle,
      distance: '4.8 km'
    });
    setDestination('');
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    if (!isPaymentConfigured) {
      alert("Recargas indisponíveis no momento.");
      return;
    }

    setIsProcessingDeposit(true);
    setTimeout(() => {
      onUpdateBalance(rider.id, amount);
      setIsProcessingDeposit(false);
      setIsAddingFunds(false);
      setTopUpAmount('');
      alert(`Recarga de R$ ${amount.toFixed(2)} concluída!`);
    }, 2000);
  };

  const handleCancelRide = () => {
    if (activeRide) {
      onUpdateStatus(activeRide.id, RideStatus.CANCELLED);
      setShowCancelConfirmation(false);
    }
  };

  const findDriverInfo = (driverId?: string) => {
    return allUsers.find(d => d.id === driverId) || availableDrivers.find(d => d.id === driverId) || {
      name: 'Motorista',
      licensePlate: 'ABC-1234',
      avatar: 'https://picsum.photos/seed/driver/200'
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Recibo Modal */}
      {selectedRideForReceipt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-scale-up">
            <h3 className="text-xl font-black text-center mb-6 uppercase">Recibo Duarte</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Total</span><span className="font-black">R$ {selectedRideForReceipt.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Data</span><span className="font-bold">{new Date(selectedRideForReceipt.timestamp).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Motorista</span><span className="font-bold">{findDriverInfo(selectedRideForReceipt.driverId).name}</span></div>
            </div>
            <button onClick={() => setSelectedRideForReceipt(null)} className="w-full bg-indigo-950 text-white py-4 rounded-xl font-black">FECHAR</button>
          </div>
        </div>
      )}

      {/* Recarga Modal */}
      {isAddingFunds && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 animate-scale-up">
             <h3 className="text-xl font-black mb-6 uppercase">Adicionar Saldo</h3>
             <form onSubmit={handleDeposit} className="space-y-4">
               <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                 <input required type="number" step="0.01" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="0,00" className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl font-black text-2xl focus:border-indigo-600 outline-none border-2 border-transparent transition-all" />
               </div>
               <button type="submit" disabled={isProcessingDeposit} className="w-full py-5 bg-indigo-950 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-900 transition-all">
                 {isProcessingDeposit ? <i className="fas fa-circle-notch animate-spin"></i> : 'CONFIRMAR RECARGA'}
               </button>
               <button type="button" onClick={() => setIsAddingFunds(false)} className="w-full text-slate-400 font-bold text-[10px] uppercase">CANCELAR</button>
             </form>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {activeRide && activeRide.status !== RideStatus.REQUESTED && (
        <ChatWidget 
          rideId={activeRide.id} messages={activeRide.messages || []} currentUserId={rider.id}
          onSendMessage={onSendMessage} otherPartyName={findDriverInfo(activeRide.driverId).name}
          isOpen={isChatOpen} onToggle={setIsChatOpen} isOtherTyping={isDriverTyping}
        />
      )}
      
      {/* Navegação Interna */}
      {!activeRide && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            <button onClick={() => setView('home')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentView === 'home' ? 'bg-indigo-950 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Pedir</button>
            <button onClick={() => setView('history')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentView === 'history' ? 'bg-indigo-950 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Histórico</button>
            <button onClick={() => setView('wallet')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentView === 'wallet' ? 'bg-indigo-950 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Carteira</button>
          </div>
        </div>
      )}

      {/* View de Corrida Ativa */}
      {activeRide ? (
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 relative animate-slide-up">
           <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <div><h3 className="text-2xl font-black text-indigo-950">Viagem em Curso</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeRide.status}</p></div>
              <div className="text-right"><span className="block text-[9px] font-black text-slate-400 uppercase">Tarifa</span><span className="text-2xl font-black text-indigo-950">R$ {activeRide.price.toFixed(2)}</span></div>
           </div>
           <div className="h-[500px] w-full p-2 bg-slate-50 relative">
              <RealMap 
                className="h-full w-full" 
                riderLocation={userPos} 
                driverLocation={driverPos} 
                destinationLocation={activeRide.destination} 
                rideStatus={activeRide.status}
                driverInfo={{ name: findDriverInfo(activeRide.driverId).name, plate: findDriverInfo(activeRide.driverId).licensePlate }}
                riderInfo={{ name: rider.name }}
              />
              <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-3 pointer-events-none">
                <div className="bg-white/95 backdrop-blur shadow-2xl rounded-[2rem] p-5 border border-slate-200 pointer-events-auto max-w-[220px]">
                  <div className="flex items-center space-x-3 mb-4">
                    <img src={findDriverInfo(activeRide.driverId).avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-100" />
                    <div>
                      <p className="text-[10px] font-black text-indigo-950 truncate">{findDriverInfo(activeRide.driverId).name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{findDriverInfo(activeRide.driverId).licensePlate}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(true)} className="w-full bg-indigo-950 text-white py-3 rounded-xl text-[9px] font-black uppercase mb-2 flex items-center justify-center hover:bg-indigo-900 transition-colors">
                    <i className="fas fa-comments mr-2"></i> FALAR COM MOTORISTA
                  </button>
                  {activeRide.status !== RideStatus.IN_PROGRESS && (
                    <button onClick={() => setShowCancelConfirmation(true)} className="w-full bg-white text-red-500 border border-red-100 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-red-50 transition-colors">CANCELAR</button>
                  )}
                </div>
              </div>
           </div>
        </div>
      ) : currentView === 'home' ? (
        <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 pointer-events-none opacity-50"></div>
          <h2 className="text-4xl font-black mb-10 text-indigo-950 tracking-tighter relative z-10">Onde você vai hoje?</h2>
          <div className="grid md:grid-cols-2 gap-10 relative z-10">
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full group-focus-within:scale-125 transition-transform"></div>
                <input disabled value={userPos ? "Sua Localização GPS" : "Obtendo GPS..."} className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-400 font-bold text-sm" />
              </div>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full group-focus-within:scale-125 transition-transform"></div>
                <input autoFocus placeholder="Informe o destino (Bairro ou Endereço)" value={destination} onChange={e => setDestination(e.target.value)} className="w-full pl-12 pr-4 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-indigo-600 outline-none shadow-sm transition-all" />
              </div>
              
              {destination && (
                <div className="space-y-4 pt-4 animate-slide-up">
                  <div className="flex items-center space-x-2 px-1 mb-2">
                     <i className="fas fa-tags text-[10px] text-indigo-400"></i>
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tarifa baseada em: {pricingData.ruleName}</span>
                  </div>
                  <div className="grid gap-3">
                    {(['UberX', 'UberComfort'] as const).map(service => (
                      <button key={service} onClick={() => setSelectedService(service as any)} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${selectedService === service ? 'border-indigo-950 bg-indigo-50/50 shadow-md' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-950"><i className={`fas ${service === 'UberX' ? 'fa-car' : 'fa-car-side'}`}></i></div>
                           <span className="font-black text-indigo-950">{service}</span>
                        </div>
                        <span className="font-black text-xl text-indigo-950">R$ {pricingData.prices[service].toFixed(2)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between mt-6">
                     <div className="flex items-center space-x-3">
                        <i className={`fas ${selectedPayment === PaymentMethod.PREPAID ? 'fa-wallet text-indigo-600' : 'fa-credit-card text-blue-600'}`}></i>
                        <select value={selectedPayment} onChange={e => setSelectedPayment(e.target.value as any)} className="bg-transparent border-none outline-none font-black text-xs uppercase text-slate-600 cursor-pointer">
                           <option value={PaymentMethod.CARD}>Cartão de Crédito</option>
                           {isPaymentConfigured && <option value={PaymentMethod.PREPAID}>Duarte Pay (Saldo)</option>}
                           <option value={PaymentMethod.CASH}>Dinheiro (Presencial)</option>
                        </select>
                     </div>
                     <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
                  </div>

                  <button onClick={handleConfirmRide} className="w-full bg-indigo-950 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl mt-4 hover:bg-indigo-900 transition-all active:scale-95">CONFIRMAR VIAGEM</button>
                </div>
              )}
            </div>
            <div className="hidden md:block h-full min-h-[450px]"><RealMap className="h-full w-full" riderLocation={userPos} /></div>
          </div>
        </div>
      ) : currentView === 'history' ? (
        <div className="space-y-4 animate-slide-up">
           <div className="flex items-center justify-between px-2">
            <h2 className="text-3xl font-black text-indigo-950 tracking-tighter">Suas Viagens</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{completedRides.length} registros</span>
          </div>
          <div className="grid gap-4">
            {completedRides.length === 0 ? (
              <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                <i className="fas fa-route text-slate-100 text-6xl mb-6"></i>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma corrida no seu histórico.</p>
              </div>
            ) : (
              completedRides.map(ride => (
                <div key={ride.id} onClick={() => setSelectedRideForReceipt(ride)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center cursor-pointer hover:border-indigo-600 hover:shadow-xl transition-all group active:scale-[0.98]">
                  <div className="flex items-center space-x-5 w-full md:w-auto">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-950 group-hover:bg-indigo-950 group-hover:text-white transition-colors">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-indigo-950">{ride.destination.address}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ride.timestamp).toLocaleDateString('pt-BR')} às {new Date(ride.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto mt-6 md:mt-0 space-x-8">
                    <div className="text-right">
                      <p className="text-2xl font-black text-indigo-950">R$ {ride.price.toFixed(2)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ride.paymentMethod}</p>
                    </div>
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                      <i className="fas fa-chevron-right text-xs"></i>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
           {!isPaymentConfigured ? (
             <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-amber-100 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                   <i className="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 className="text-xl font-black text-indigo-950 uppercase">Pagamentos em Manutenção</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">A carteira digital Duarte Pay está sendo configurada pelo administrador. Por favor, utilize dinheiro ou cartões físicos nas suas viagens.</p>
             </div>
           ) : (
             <>
               <div className="bg-indigo-950 p-12 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-1 mb-8 md:mb-0">
                  <p className="text-indigo-300 font-black uppercase text-[10px] tracking-widest">Duarte Pay • Saldo Disponível</p>
                  <h2 className="text-7xl font-black tracking-tighter">R$ {rider.walletBalance?.toFixed(2) || '0,00'}</h2>
                </div>
                <button onClick={() => setIsAddingFunds(true)} className="bg-white text-indigo-950 px-12 py-6 rounded-[2rem] font-black uppercase shadow-xl hover:scale-105 transition-all active:scale-95 z-10 tracking-widest text-sm">RECARREGAR SALDO</button>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
              </div>
              
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                <h4 className="font-black text-indigo-950 text-xs uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Gestão de Pagamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 rounded-3xl border border-slate-100 flex items-center space-x-6 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><i className="fas fa-credit-card text-xl"></i></div>
                    <div>
                      <p className="font-black text-sm text-indigo-950">Cartão de Crédito</p>
                      <p className="text-[10px] font-bold text-slate-400">Padrão: Final 4432 • Exp 12/28</p>
                    </div>
                  </div>
                  <div className="p-8 rounded-3xl border-2 border-indigo-600 bg-indigo-50 flex items-center space-x-6 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-950 rounded-2xl flex items-center justify-center text-white"><i className="fas fa-wallet text-xl"></i></div>
                    <div>
                      <p className="font-black text-sm text-indigo-950">Duarte Pay Digital</p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase font-black">Ativado e Seguro</p>
                    </div>
                  </div>
                </div>
              </div>
             </>
           )}
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
