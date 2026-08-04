
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, Ride, RideStatus, UserRole, PaymentMethod, PaymentSettings, VehicleType, RechargeCode, PushNotificationLog } from '../types';
import RealMap from '../components/RealMap';
import ChatWidget from '../components/ChatWidget';
import LojistaDispatchModal from '../components/LojistaDispatchModal';
import { processExternalPayment } from '../services/paymentService';

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
  rechargeCodes?: RechargeCode[];
  onRedeemRechargeCode?: (codeStr: string, userId: string) => { success: boolean; message: string; amount?: number };
  onAddPushLog?: (log: PushNotificationLog) => void;
  externalActiveTab?: string;
  onTabChange?: (tab: string) => void;
}

const RiderDashboard: React.FC<RiderDashboardProps> = ({ 
  rider, rides, onRequestRide, onUpdateStatus, availableDrivers, allUsers, onRateRide, onSendMessage, onUpdateBalance, paymentSettings,
  rechargeCodes = [], onRedeemRechargeCode, onAddPushLog,
  externalActiveTab, onTabChange
}) => {
  const [internalView, setInternalView] = useState<'home' | 'history' | 'wallet'>('home');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [rechargeCodeInput, setRechargeCodeInput] = useState('');
  const [rechargeMsg, setRechargeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [userPos, setUserPos] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const watchIdRef = useRef<number | null>(null);

  const currentView = (externalActiveTab === 'history' || externalActiveTab === 'wallet' || externalActiveTab === 'home' || externalActiveTab === 'discounts') 
    ? externalActiveTab 
    : internalView;

  const setView = (v: 'home' | 'history' | 'wallet' | 'discounts') => {
    if (onTabChange) onTabChange(v);
    else setInternalView(v as any);
  };

  const activeRide = rides.find(r => 
    r.riderId === rider.id && 
    r.status !== RideStatus.COMPLETED && 
    r.status !== RideStatus.CANCELLED
  );

  const activeRidesCount = rides.filter(r => 
    r.riderId === rider.id && 
    r.status !== RideStatus.COMPLETED && 
    r.status !== RideStatus.CANCELLED
  ).length;

  const completedRides = rides.filter(r => r.riderId === rider.id && r.status === RideStatus.COMPLETED);

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

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeCodeInput.trim()) return;

    if (onRedeemRechargeCode) {
      const result = onRedeemRechargeCode(rechargeCodeInput, rider.id);
      if (result.success) {
        setRechargeMsg({ type: 'success', text: result.message });
        setRechargeCodeInput('');
      } else {
        setRechargeMsg({ type: 'error', text: result.message });
      }
    } else {
      setRechargeMsg({ type: 'error', text: 'Serviço de recarga indisponível.' });
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    setCheckoutStatus('processing');
    setErrorMessage('');

    const response = await processExternalPayment(amount, paymentSettings);

    if (response.success) {
      setCheckoutStatus('success');
      setTimeout(() => {
        onUpdateBalance(rider.id, amount);
        setIsAddingFunds(false);
        setCheckoutStatus('idle');
        setTopUpAmount('');
      }, 2000);
    } else {
      setCheckoutStatus('error');
      setErrorMessage(response.errorMessage || 'Falha ao processar pagamento.');
    }
  };

  const findDriverInfo = (driverId?: string) => {
    return allUsers.find(d => d.id === driverId) || { name: 'Motorista Duarte', phone: '(11) 99999-0000', avatar: 'https://picsum.photos/seed/driver/200' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Modal Chamar Motorista / Lojista Dispatch */}
      <LojistaDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        rider={rider}
        paymentSettings={paymentSettings}
        availableDrivers={availableDrivers}
        onRequestRide={onRequestRide}
        onAddPushLog={onAddPushLog}
        onUpdateBalance={onUpdateBalance}
      />

      {/* Recarga Modal com Gateway */}
      {isAddingFunds && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 animate-scale-up shadow-[0_0_100px_rgba(79,70,229,0.2)]">
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl mx-auto flex items-center justify-center text-indigo-600 mb-4">
                   <i className="fas fa-credit-card text-2xl"></i>
                </div>
                <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight">Checkout On-line</h3>
                <p className="text-slate-400 text-xs font-bold uppercase mt-1">Duarte Pay Digital</p>
             </div>

             {checkoutStatus === 'idle' && (
               <form onSubmit={handleDeposit} className="space-y-6">
                 <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                   <input required type="number" step="0.01" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="0,00" className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl font-black text-2xl focus:border-indigo-600 outline-none border-2 border-transparent transition-all" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-indigo-950 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-900 transition-all flex items-center justify-center space-x-3">
                   <span>PAGAR AGORA</span>
                   <i className="fas fa-arrow-right text-xs opacity-50"></i>
                 </button>
                 <button type="button" onClick={() => setIsAddingFunds(false)} className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest">CANCELAR</button>
               </form>
             )}

             {checkoutStatus === 'processing' && (
               <div className="py-10 text-center space-y-6 animate-pulse">
                 <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                 </div>
                 <div>
                    <p className="text-sm font-black text-indigo-950 uppercase">Processando Transação</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Conectando ao gateway...</p>
                 </div>
               </div>
             )}

             {checkoutStatus === 'success' && (
               <div className="py-10 text-center space-y-6 animate-scale-up">
                 <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center text-3xl">
                    <i className="fas fa-check"></i>
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-indigo-950">Pagamento Aprovado!</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Seu saldo foi atualizado com sucesso.</p>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Conteúdo Principal do Lojista */}

      {currentView === 'home' && (
        <div className="space-y-6">
          {/* Banner Hero Chamar Motorista */}
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-3 z-10 max-w-xl">
              <span className="bg-amber-400 text-indigo-950 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                Painel do Lojista • Duarte Delivery
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Precisa despachar uma entrega agora?</h2>
              <p className="text-indigo-200 text-sm">Pesquise o endereço diretamente por rua e número. Notificação em tempo real para motoboys na região.</p>
              
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black uppercase text-xs tracking-wider px-8 py-4 rounded-2xl shadow-xl shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
                >
                  <i className="fas fa-paper-plane text-base"></i>
                  <span>Chamar Motorista Agora</span>
                </button>

                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300 bg-white/10 px-4 py-3 rounded-2xl">
                  <i className="fas fa-wallet text-amber-400"></i>
                  <span>Saldo: R$ {(rider.walletBalance || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="z-10 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center w-full md:w-auto shrink-0 space-y-2">
              <p className="text-3xl font-black text-amber-400">{availableDrivers.length}</p>
              <p className="text-[10px] font-black uppercase text-indigo-200 tracking-wider">Motoristas Online na Cidade</p>
              <p className="text-[9px] text-indigo-300 font-semibold">Alerta instantâneo via Push + Áudio</p>
            </div>
          </div>

          {/* Se houver entrega ativa */}
          {activeRide && (
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-600 shadow-xl space-y-6 animate-scale-up">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    <i className="fas fa-box"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-indigo-950">{activeRide.productName || 'Entrega em Andamento'}</h4>
                    <p className="text-xs text-slate-400 font-medium">Status: <strong className="text-indigo-600 uppercase">{activeRide.status}</strong></p>
                  </div>
                </div>

                <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-4 py-2 rounded-xl">
                  R$ {activeRide.price.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Coleta em:</p>
                  <p className="font-bold text-slate-800">{activeRide.origin.address}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Entrega para:</p>
                  <p className="font-bold text-slate-800">{activeRide.destination.address}</p>
                </div>
              </div>

              {activeRide.driverId && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={findDriverInfo(activeRide.driverId).avatar} className="w-12 h-12 rounded-full border-2 border-indigo-200" />
                    <div>
                      <p className="font-black text-indigo-950 text-sm">{findDriverInfo(activeRide.driverId).name}</p>
                      <p className="text-xs text-indigo-600 font-bold">{findDriverInfo(activeRide.driverId).phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <i className="fas fa-check-circle mr-1"></i> Motorista a caminho
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentView === 'wallet' && (
        <div className="space-y-6 animate-slide-up">
           <div className="bg-indigo-950 p-10 md:p-12 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-1 mb-8 md:mb-0">
              <p className="text-indigo-300 font-black uppercase text-[10px] tracking-widest">Duarte Pay • Saldo do Lojista</p>
              <h2 className="text-6xl md:text-7xl font-black tracking-tighter">R$ {(rider.walletBalance || 0).toFixed(2)}</h2>
              <div className="flex items-center space-x-2 mt-4 text-[10px] font-bold text-indigo-300">
                 <i className="fas fa-shield-alt"></i>
                 <span className="uppercase tracking-widest">Utilizado no pagamento automático de corridas</span>
              </div>
            </div>

            <button onClick={() => setIsAddingFunds(true)} className="bg-white text-indigo-950 px-10 py-5 rounded-[2rem] font-black uppercase shadow-xl hover:scale-105 transition-all active:scale-95 z-10 tracking-widest text-xs">
              Recarregar On-line
            </button>
          </div>

          {/* Resgate de Código de Recarga */}
          <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center text-xl font-black">
                <i className="fas fa-ticket-alt"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-indigo-950">Resgatar Código de Recarga / Voucher</h3>
                <p className="text-xs text-slate-400 font-medium">Digite o código impresso ou fornecido pela administração para adicionar créditos.</p>
              </div>
            </div>

            <form onSubmit={handleRedeemCode} className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Ex: DUARTE-9X2K-4M1P"
                value={rechargeCodeInput}
                onChange={(e) => setRechargeCodeInput(e.target.value.toUpperCase())}
                className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono font-black text-lg text-slate-800 outline-none focus:border-indigo-600 uppercase tracking-wider"
              />
              <button
                type="submit"
                className="bg-indigo-950 hover:bg-indigo-900 text-white font-black uppercase text-xs tracking-wider px-8 py-4 rounded-2xl shadow-lg transition-all"
              >
                Resgatar Créditos
              </button>
            </form>

            {rechargeMsg && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
                rechargeMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <i className={`fas ${rechargeMsg.type === 'success' ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-circle text-red-600'} text-base`}></i>
                <span>{rechargeMsg.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === 'history' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm animate-slide-up space-y-6">
          <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest border-b border-slate-100 pb-4">Histórico de Entregas & Despachos</h4>
          <div className="divide-y divide-slate-100 text-sm">
            {completedRides.map(r => (
              <div key={r.id} className="py-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="font-bold text-slate-800 text-base">{r.productName || 'Entrega'}</p>
                  <p className="text-xs text-slate-600">De: {r.origin.address}</p>
                  <p className="text-xs text-indigo-950">Para: {r.destination.address}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Distância: {r.distance} • Status: {r.status}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-indigo-600 text-lg">R$ {r.price.toFixed(2)}</p>
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block mt-1">
                    Concluída
                  </span>
                </div>
              </div>
            ))}
            {completedRides.length === 0 && (
              <p className="text-center text-slate-400 py-12 italic font-bold">Você ainda não tem entregas salvas no seu histórico.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;

