
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Ride, RideStatus, UserRole, VehicleType, PaymentMethod } from '../types';
import RealMap from '../components/RealMap';
import ChatWidget from '../components/ChatWidget';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DriverDashboardProps {
  driver: UserProfile;
  rides: Ride[];
  allUsers: UserProfile[];
  platformCommission: number;
  onUpdateStatus: (rideId: string, status: RideStatus, driverId: string) => void;
  onRateRide: (rideId: string, rating: number, role: UserRole) => void;
  onSendMessage: (rideId: string, text: string) => void;
  externalActiveTab?: string;
  onTabChange?: (tab: string) => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ 
  driver, rides, allUsers, platformCommission, onUpdateStatus, onRateRide, onSendMessage,
  externalActiveTab, onTabChange
}) => {
  const [isOnline, setIsOnline] = useState(driver.isOnline || false);
  const [rideToAccept, setRideToAccept] = useState<Ride | null>(null);
  const [internalTab, setInternalTab] = useState<'status' | 'earnings' | 'reviews' | 'profile'>('status');
  
  const activeTab = useMemo(() => {
    if (!externalActiveTab) return internalTab;
    if (externalActiveTab === 'home') return 'status';
    return externalActiveTab as any;
  }, [externalActiveTab, internalTab]);

  const [gpsModal, setGpsModal] = useState<{ isOpen: boolean; title: string; lat: number; lng: number; address: string } | null>(null);

  const openGPS = (lat: number, lng: number, app: 'waze' | 'google') => {
    if (app === 'waze') {
      window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
    }
    setGpsModal(null);
  };
  
  // Simulação de posição do motorista (para o mapa)
  const [driverPos, setDriverPos] = useState<{ lat: number, lng: number }>({ lat: -23.5505, lng: -46.6333 });
  
  const pendingRides = rides.filter(r => 
    r.status === RideStatus.REQUESTED && 
    r.vehicleTypeRequested === driver.vehicleType
  );
  
  const myActiveRide = rides.find(r => r.driverId === driver.id && r.status !== RideStatus.COMPLETED && r.status !== RideStatus.CANCELLED);
  
  const riderInfo = useMemo(() => {
    if (!myActiveRide) return { name: 'Passageiro' };
    return allUsers.find(u => u.id === myActiveRide.riderId) || { name: 'Passageiro' };
  }, [myActiveRide, allUsers]);

  const completedRides = useMemo(() => rides.filter(r => r.driverId === driver.id && r.status === RideStatus.COMPLETED), [rides, driver.id]);

  useEffect(() => {
    if (myActiveRide && isOnline) {
      const interval = setInterval(() => {
        setDriverPos(prev => {
          const isEnRoute = myActiveRide.status === RideStatus.IN_PROGRESS;
          const target = isEnRoute ? myActiveRide.destination : myActiveRide.origin;
          const step = 0.0001;
          const dLat = target.lat - prev.lat;
          const dLng = target.lng - prev.lng;
          if (Math.abs(dLat) < step && Math.abs(dLng) < step) return prev;
          return { lat: prev.lat + (dLat > 0 ? step : -step), lng: prev.lng + (dLng > 0 ? step : -step) };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [myActiveRide?.status, isOnline]);

  const calculateGain = (total: number) => total * (1 - (platformCommission / 100));

  const chartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = days.map(day => ({ name: day, bruto: 0, liquido: 0 }));
    completedRides.forEach(ride => {
      const date = new Date(ride.timestamp);
      data[date.getDay()].bruto += ride.price;
      data[date.getDay()].liquido += calculateGain(ride.price);
    });
    return data;
  }, [completedRides, platformCommission]);

  const stats = useMemo(() => {
    const totalBruto = completedRides.reduce((acc, r) => acc + r.price, 0);
    const totalLiquido = completedRides.reduce((acc, r) => acc + calculateGain(r.price), 0);
    
    // Cálculos de datas
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Início da semana (Domingo)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    // Início do mês
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const ridesToday = completedRides.filter(r => new Date(r.timestamp).toDateString() === todayStr).length;
    const ridesWeek = completedRides.filter(r => new Date(r.timestamp) >= weekStart).length;
    const ridesMonth = completedRides.filter(r => new Date(r.timestamp) >= monthStart).length;

    return { 
      totalBruto, 
      totalLiquido, 
      totalComissao: totalBruto - totalLiquido,
      ridesToday,
      ridesWeek,
      ridesMonth
    };
  }, [completedRides, platformCommission]);

  const handleConfirmAccept = () => {
    if (rideToAccept) {
      onUpdateStatus(rideToAccept.id, RideStatus.ACCEPTED, driver.id);
      setRideToAccept(null);
    }
  };

  const handleFinishRide = () => {
    if (myActiveRide) {
      onUpdateStatus(myActiveRide.id, RideStatus.COMPLETED, driver.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
      {/* Modal Escolha de GPS (Waze / Google Maps) */}
      {gpsModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6 text-center animate-scale-up">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-2xl">
              <i className="fas fa-location-arrow"></i>
            </div>
            <div>
              <h4 className="text-xl font-black text-indigo-950">{gpsModal.title}</h4>
              <p className="text-xs font-bold text-slate-500 mt-1 line-clamp-2">{gpsModal.address}</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => openGPS(gpsModal.lat, gpsModal.lng, 'waze')}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all"
              >
                <i className="fab fa-waze text-lg"></i>
                <span>Navegar pelo WAZE</span>
              </button>

              <button
                onClick={() => openGPS(gpsModal.lat, gpsModal.lng, 'google')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all"
              >
                <i className="fab fa-google text-lg"></i>
                <span>Navegar pelo GOOGLE MAPS</span>
              </button>

              <button
                onClick={() => setGpsModal(null)}
                className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold uppercase text-xs hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {myActiveRide && (
        <ChatWidget 
          rideId={myActiveRide.id}
          messages={myActiveRide.messages || []}
          currentUserId={driver.id}
          onSendMessage={onSendMessage}
          otherPartyName={riderInfo.name}
          isOpen={isChatOpen}
          onToggle={setIsChatOpen}
        />
      )}

      {rideToAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 text-center bg-indigo-50 border-b border-indigo-100">
              <h4 className="text-xl font-black text-indigo-950">Confirmar Chamada?</h4>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">Ganhos: R$ {calculateGain(rideToAccept.price).toFixed(2)}</p>
            </div>
            <div className="p-8 space-y-3">
              <button onClick={handleConfirmAccept} className="w-full bg-indigo-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">ACEITAR</button>
              <button onClick={() => setRideToAccept(null)} className="w-full bg-white text-slate-400 py-4 rounded-2xl font-black uppercase">IGNORAR</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
             <i className={`fas ${driver.vehicleType === VehicleType.MOTORCYCLE ? 'fa-motorcycle' : 'fa-car'} text-2xl`}></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Meus Ganhos</p>
            <h3 className="text-4xl font-black text-indigo-950">R$ {driver.earnings?.toFixed(2)}</h3>
          </div>
        </div>
        <button onClick={() => setIsOnline(!isOnline)} className={`px-10 py-5 rounded-2xl font-black text-sm uppercase shadow-xl ${isOnline ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isOnline ? 'Ficar Offline' : 'Ficar Online'}
        </button>
      </div>

      {activeTab === 'status' && (
        <>
          {!isOnline ? (
            <div className="py-24 text-center text-slate-300">
               <i className="fas fa-moon text-6xl mb-4 opacity-20"></i>
               <p className="font-black uppercase tracking-widest">Você está offline</p>
            </div>
          ) : myActiveRide ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 animate-slide-up space-y-0">
               <div className="p-8 bg-indigo-950 text-white flex justify-between items-center">
                  <div>
                     <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                       Entrega em Andamento
                     </span>
                     <h4 className="text-xl font-black mt-2">{myActiveRide.productName || 'Entrega de Mercadoria'}</h4>
                     <p className="text-xs text-indigo-200 font-medium">Lojista: {myActiveRide.merchantName || riderInfo.name}</p>
                  </div>
                  <button onClick={() => setIsChatOpen(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl relative transition-all active:scale-95">
                    <i className="fas fa-comment-dots mr-2"></i>
                    <span className="text-[10px] font-black uppercase">Chat</span>
                    {(myActiveRide.messages?.length || 0) > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-indigo-950 flex items-center justify-center text-[8px] font-black">{myActiveRide.messages?.length}</span>}
                  </button>
               </div>

               <div className="p-8 space-y-6">
                  {/* GPS Navigation Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setGpsModal({
                        isOpen: true,
                        title: 'Navegar até o Local de Coleta',
                        lat: myActiveRide.origin.lat,
                        lng: myActiveRide.origin.lng,
                        address: myActiveRide.origin.address
                      })}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-2 border-indigo-200 p-4 rounded-2xl flex items-center justify-between font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-base">
                          <i className="fas fa-store"></i>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-indigo-600">PASSO 1 • COLETA</p>
                          <p className="font-extrabold text-indigo-950">Abrir Local de Coleta</p>
                        </div>
                      </div>
                      <i className="fas fa-external-link-alt text-indigo-400"></i>
                    </button>

                    <button
                      onClick={() => setGpsModal({
                        isOpen: true,
                        title: 'Navegar até o Local de Entrega',
                        lat: myActiveRide.destination.lat,
                        lng: myActiveRide.destination.lng,
                        address: myActiveRide.destination.address
                      })}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-200 p-4 rounded-2xl flex items-center justify-between font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-base">
                          <i className="fas fa-flag-checkered"></i>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-emerald-600">PASSO 2 • ENTREGA</p>
                          <p className="font-extrabold text-emerald-950">Abrir Local de Entrega</p>
                        </div>
                      </div>
                      <i className="fas fa-external-link-alt text-emerald-400"></i>
                    </button>
                  </div>

                  <div className="h-80 relative rounded-2xl overflow-hidden border border-slate-200">
                    <RealMap 
                      className="h-full" 
                      driverLocation={driverPos}
                      riderLocation={myActiveRide.status === RideStatus.IN_PROGRESS ? undefined : myActiveRide.origin}
                      destinationLocation={myActiveRide.destination}
                      rideStatus={myActiveRide.status}
                      driverInfo={{ name: driver.name, plate: driver.licensePlate }}
                      riderInfo={{ name: riderInfo.name }}
                    />
                  </div>

                  {/* Step-by-Step Status Transition Controls */}
                  <div className="space-y-3 pt-2">
                    {myActiveRide.status === RideStatus.ACCEPTED && (
                      <button
                        onClick={() => onUpdateStatus(myActiveRide.id, RideStatus.ARRIVED_AT_PICKUP, driver.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all tracking-wider flex items-center justify-center space-x-2"
                      >
                        <i className="fas fa-map-marker-alt text-amber-400"></i>
                        <span>CHEGUEI AO LOCAL DE COLETA</span>
                      </button>
                    )}

                    {(myActiveRide.status === RideStatus.ARRIVED_AT_PICKUP || myActiveRide.status === RideStatus.PICKUP) && (
                      <button
                        onClick={() => onUpdateStatus(myActiveRide.id, RideStatus.IN_PROGRESS, driver.id)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-indigo-950 py-5 rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all tracking-wider flex items-center justify-center space-x-2"
                      >
                        <i className="fas fa-box-check text-indigo-950"></i>
                        <span>PRODUTO COLETADO (A CAMINHO DA ENTREGA)</span>
                      </button>
                    )}

                    {myActiveRide.status === RideStatus.IN_PROGRESS && (
                      <button
                        onClick={() => onUpdateStatus(myActiveRide.id, RideStatus.ARRIVED_AT_DESTINATION, driver.id)}
                        className="w-full bg-indigo-900 hover:bg-indigo-950 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all tracking-wider flex items-center justify-center space-x-2"
                      >
                        <i className="fas fa-street-view text-amber-400"></i>
                        <span>CHEGUEI AO LOCAL DE ENTREGA</span>
                      </button>
                    )}

                    {myActiveRide.status === RideStatus.ARRIVED_AT_DESTINATION && (
                      <button
                        onClick={() => onUpdateStatus(myActiveRide.id, RideStatus.COMPLETED, driver.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all tracking-wider flex items-center justify-center space-x-2"
                      >
                        <i className="fas fa-check-circle text-white"></i>
                        <span>FINALIZAR ENTREGA</span>
                      </button>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <div>
                  <h4 className="font-black text-xl text-indigo-950">Corridas Disponíveis (Radar Real-Time)</h4>
                  <p className="text-xs text-slate-400 font-medium">Aceite solicitações de entregas enviadas por lojistas em tempo real.</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center space-x-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>{pendingRides.length} disponíveis</span>
                </span>
              </div>

              {pendingRides.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-[2.5rem] border border-slate-200 space-y-3">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto">
                    <i className="fas fa-radar"></i>
                  </div>
                  <p className="text-indigo-950 font-black text-base">Aguardando novas entregas de lojistas...</p>
                  <p className="text-slate-400 font-medium text-xs max-w-sm mx-auto">
                    Mantenha o aplicativo aberto. Você receberá um som e uma notificação push quando um lojista chamar um motorista.
                  </p>
                </div>
              ) : (
                pendingRides.map(ride => {
                  const driverGain = ride.driverEarnings || calculateGain(ride.price);
                  return (
                    <div key={ride.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-600 shadow-sm transition-all space-y-4">
                      {/* Delivery Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-black text-lg">
                            <i className="fas fa-box"></i>
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              Lojista: {ride.merchantName || 'Estabelecimento'}
                            </span>
                            <h3 className="text-lg font-black text-indigo-950">{ride.productName || 'Entrega de Mercadoria'}</h3>
                          </div>
                        </div>

                        {/* Transparência de Valores */}
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Cobrado do Lojista</p>
                            <p className="text-xs font-bold text-slate-600 line-through">R$ {ride.price.toFixed(2)}</p>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-right">
                            <p className="text-[9px] font-black text-emerald-800 uppercase">Seu Ganho Líquido</p>
                            <p className="text-2xl font-black text-emerald-600">R$ {driverGain.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Distance & Trajectory Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-indigo-600 uppercase mb-0.5">
                            <i className="fas fa-store mr-1"></i> Coleta (Coleta em ~{ride.pickupDistanceKm || 1.2} km de você)
                          </p>
                          <p className="font-bold text-slate-800">{ride.origin.address}</p>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-0.5">
                            <i className="fas fa-flag-checkered mr-1"></i> Destino da Entrega (Percurso: {ride.distance})
                          </p>
                          <p className="font-bold text-slate-800">{ride.destination.address}</p>
                        </div>
                      </div>

                      {ride.notes && (
                        <p className="text-xs italic text-slate-500 bg-amber-50/50 p-3 rounded-xl border border-amber-100/60">
                          <strong>Obs do Lojista:</strong> {ride.notes}
                        </p>
                      )}

                      {/* Accept Action */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                          <i className="fas fa-motorcycle mr-1"></i> Requer Motocicleta
                        </span>

                        <button
                          onClick={() => setRideToAccept(ride)}
                          className="bg-indigo-950 hover:bg-indigo-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl active:scale-95 transition-all flex items-center space-x-2"
                        >
                          <i className="fas fa-check-circle text-amber-400 text-sm"></i>
                          <span>ACEITAR ESTA CORRIDA</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6 animate-slide-up">
          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Bruto</p>
              <h4 className="text-2xl font-black">R$ {stats.totalBruto.toFixed(2)}</h4>
            </div>
            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Taxa Sistema</p>
              <h4 className="text-2xl font-black text-indigo-600">- R$ {stats.totalComissao.toFixed(2)}</h4>
            </div>
            <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Líquido</p>
              <h4 className="text-2xl font-black text-green-600">R$ {stats.totalLiquido.toFixed(2)}</h4>
            </div>
          </div>

          {/* Resumo de Atividade (Nova seção solicitada) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
            <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest mb-6">Frequência de Viagens</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Hoje</span>
                <span className="text-4xl font-black text-indigo-950">{stats.ridesToday}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">viagens</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Esta Semana</span>
                <span className="text-4xl font-black text-indigo-950">{stats.ridesWeek}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">viagens</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Este Mês</span>
                <span className="text-4xl font-black text-indigo-950">{stats.ridesMonth}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">viagens</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full bg-white p-8 rounded-[2.5rem] border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="liquido" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm animate-slide-up space-y-6">
          <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest border-b border-slate-100 pb-4">Minhas Avaliações</h4>
          <div className="flex items-center space-x-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/40">
            <div className="text-4xl font-black text-indigo-950">{(driver.rating || 4.8).toFixed(1)}</div>
            <div className="flex flex-col">
              <div className="flex text-amber-400 text-sm">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star ${i < Math.round(driver.rating || 4.8) ? '' : 'opacity-30'}`}></i>
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pontuação média atual</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            {completedRides.map(r => r.ratingToDriver && (
              <div key={r.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-700">{allUsers.find(u => u.id === r.riderId)?.name || 'Cliente'}</p>
                  <p className="text-xs text-slate-400 font-medium">Viagem {r.distance} • {r.destination.address}</p>
                </div>
                <div className="flex text-amber-400 text-xs items-center space-x-1 font-bold">
                  <span>{r.ratingToDriver}</span>
                  <i className="fas fa-star"></i>
                </div>
              </div>
            ))}
            {completedRides.filter(r => r.ratingToDriver).length === 0 && (
              <p className="text-center text-slate-400 py-8 italic font-bold">Você ainda não recebeu avaliações nas corridas.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm animate-slide-up space-y-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 border-b border-slate-100 pb-8">
            <img src={driver.avatar} className="w-24 h-24 rounded-full border-4 border-indigo-100 shadow-sm" alt="" />
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-2xl font-black text-indigo-950">{driver.name}</h3>
              <p className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">{driver.role}</p>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">{driver.phone || '(11) 98888-7777'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo do Veículo</p>
              <input readOnly value={driver.vehicleModel || 'Corola Toyota'} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold cursor-not-allowed outline-none text-slate-600" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa do Veículo</p>
              <input readOnly value={driver.licensePlate || 'ABC-1234'} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold cursor-not-allowed outline-none text-slate-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
