
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
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ driver, rides, allUsers, platformCommission, onUpdateStatus, onRateRide, onSendMessage }) => {
  const [isOnline, setIsOnline] = useState(driver.isOnline || false);
  const [rideToAccept, setRideToAccept] = useState<Ride | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'earnings'>('status');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('status')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'status' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-400'}`}>Status</button>
          <button onClick={() => setActiveTab('earnings')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'earnings' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-400'}`}>Finanças</button>
        </div>
        <button onClick={() => setIsOnline(!isOnline)} className={`px-10 py-5 rounded-2xl font-black text-sm uppercase shadow-xl ${isOnline ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isOnline ? 'Ficar Offline' : 'Ficar Online'}
        </button>
      </div>

      {activeTab === 'status' ? (
        <>
          {!isOnline ? (
            <div className="py-24 text-center text-slate-300">
               <i className="fas fa-moon text-6xl mb-4 opacity-20"></i>
               <p className="font-black uppercase tracking-widest">Você está offline</p>
            </div>
          ) : myActiveRide ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 animate-slide-up">
               <div className="p-8 bg-indigo-950 text-white flex justify-between items-center">
                  <div>
                     <p className="text-[10px] font-black uppercase opacity-60">Viagem Atual</p>
                     <h4 className="text-xl font-black">Em curso com {riderInfo.name}</h4>
                  </div>
                  <button onClick={() => setIsChatOpen(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl relative transition-all active:scale-95">
                    <i className="fas fa-comment-dots mr-2"></i>
                    <span className="text-[10px] font-black uppercase">Chat</span>
                    {(myActiveRide.messages?.length || 0) > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-indigo-950 flex items-center justify-center text-[8px] font-black">{myActiveRide.messages?.length}</span>}
                  </button>
               </div>
               <div className="p-8 space-y-6">
                  <div className="h-96 relative">
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
                  <div className="flex space-x-4">
                    {myActiveRide.status === RideStatus.ACCEPTED && (
                      <button onClick={() => onUpdateStatus(myActiveRide.id, RideStatus.IN_PROGRESS, driver.id)} className="flex-1 bg-indigo-600 text-white py-6 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all uppercase tracking-widest">INICIAR VIAGEM</button>
                    )}
                    {myActiveRide.status === RideStatus.IN_PROGRESS && (
                      <button onClick={handleFinishRide} className="flex-1 bg-green-600 text-white py-6 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all uppercase tracking-widest">FINALIZAR VIAGEM</button>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-black text-xl text-indigo-950 px-2">Radar de Corridas</h4>
              {pendingRides.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-[2.5rem] border border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-xs">Aguardando corridas...</p>
                </div>
              ) : (
                pendingRides.map(ride => (
                  <div key={ride.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex items-center justify-between hover:border-indigo-600 transition-all">
                    <div>
                       <h3 className="text-2xl font-black text-indigo-600">R$ {calculateGain(ride.price).toFixed(2)}</h3>
                       <p className="text-xs font-bold text-slate-500">{ride.distance} • {ride.destination.address}</p>
                    </div>
                    <button onClick={() => setRideToAccept(ride)} className="bg-indigo-950 text-white px-8 py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Aceitar</button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
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
    </div>
  );
};

export default DriverDashboard;
