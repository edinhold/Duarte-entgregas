
import React, { useState, useCallback, useMemo } from 'react';
import { UserRole, UserProfile, Ride, RideStatus, PaymentMethod, PaymentSettings, ChatMessage, PricingRule, VehicleType, RechargeCode, PushNotificationLog } from './types';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import RiderDashboard from './pages/RiderDashboard';
import Layout from './components/Layout';

// Fixed: Added missing required 'phone' property
const MOCK_DRIVERS: UserProfile[] = [
  { id: 'd1', name: 'Carlos Silva', email: 'carlos@uber.com', phone: '(11) 98888-7777', role: UserRole.DRIVER, avatar: 'https://picsum.photos/seed/d1/200', licensePlate: 'ABC-1234', vehicleModel: 'Toyota Corolla', earnings: 1250.80, rating: 4.8, isOnline: true, vehicleType: VehicleType.CAR },
];

const DEFAULT_PRICING: PricingRule[] = [
  { id: 'default', regionName: 'Geral (Padrão)', basePrice: 5.00, pricePerKm: 2.50, active: true },
  { id: 'center', regionName: 'Centro Histórico', basePrice: 8.00, pricePerKm: 3.50, active: true },
];

const INITIAL_RECHARGES: RechargeCode[] = [
  {
    id: 'rc-1001',
    code: 'DUARTE-50RS-BONUS',
    value: 50.00,
    maxUses: 1,
    timesUsed: 0,
    expiresAt: '2026-12-31',
    status: 'active',
    createdAt: new Date().toISOString(),
    notes: 'Voucher promocional para novos lojistas'
  },
  {
    id: 'rc-1002',
    code: 'DUARTE-100RS-ADMIN',
    value: 100.00,
    maxUses: 5,
    timesUsed: 1,
    expiresAt: '2026-12-31',
    status: 'active',
    createdAt: new Date().toISOString(),
    notes: 'Crédito cortesia rede de restaurantes'
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAdminPortal, setIsAdminPortal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('home'); // 'home', 'history', 'wallet', 'settings'
  const [users, setUsers] = useState<UserProfile[]>(() => {
    return [...MOCK_DRIVERS, { id: 'r1', name: 'João Paulo (Lojista)', email: 'joao@user.com', phone: '(11) 99999-8888', role: UserRole.RIDER, avatar: 'https://picsum.photos/seed/r1/200', walletBalance: 150.00 }];
  });
  const [rides, setRides] = useState<Ride[]>([]);
  const [rechargeCodes, setRechargeCodes] = useState<RechargeCode[]>(INITIAL_RECHARGES);
  const [pushLogs, setPushLogs] = useState<PushNotificationLog[]>([]);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    apiKey: '', 
    provider: 'Stripe',
    platformCommission: 15,
    pricingRules: DEFAULT_PRICING
  });

  const handleSaveRechargeCode = useCallback((newCode: RechargeCode) => {
    setRechargeCodes(prev => [newCode, ...prev]);
  }, []);

  const handleCancelRechargeCode = useCallback((codeId: string) => {
    setRechargeCodes(prev => prev.map(rc => rc.id === codeId ? { ...rc, status: 'cancelled' } : rc));
  }, []);

  const handleRedeemRechargeCode = useCallback((codeStr: string, userId: string) => {
    const cleanCode = codeStr.trim().toUpperCase();
    const found = rechargeCodes.find(rc => rc.code.toUpperCase() === cleanCode);

    if (!found) {
      return { success: false, message: 'Código de recarga inválido ou não encontrado.' };
    }

    if (found.status === 'cancelled') {
      return { success: false, message: 'Este código de recarga foi cancelado pela administração.' };
    }

    if (found.status === 'used' || found.timesUsed >= found.maxUses) {
      return { success: false, message: 'Este código de recarga já atingiu o limite de utilizações.' };
    }

    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      return { success: false, message: 'Este código de recarga está expirado.' };
    }

    // Process redemption
    const creditAmount = found.value;

    // Credit user
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, walletBalance: (u.walletBalance || 0) + creditAmount } : u));

    // Update code times used
    setRechargeCodes(prev => prev.map(rc => {
      if (rc.id === found.id) {
        const updatedTimes = rc.timesUsed + 1;
        const isNowUsed = updatedTimes >= rc.maxUses;
        return {
          ...rc,
          timesUsed: updatedTimes,
          status: isNowUsed ? 'used' : 'active'
        };
      }
      return rc;
    }));

    return {
      success: true,
      message: `Sucesso! R$ ${creditAmount.toFixed(2)} foram adicionados ao seu saldo.`,
      amount: creditAmount
    };
  }, [rechargeCodes]);

  const handleAddPushLog = useCallback((log: PushNotificationLog) => {
    setPushLogs(prev => [log, ...prev]);
  }, []);

  const handleRequestRide = useCallback((rideData: Omit<Ride, 'id' | 'status' | 'timestamp'>) => {
    const newRide: Ride = {
      ...rideData,
      id: `ride-${Date.now()}`,
      status: RideStatus.REQUESTED,
      timestamp: new Date().toISOString(),
      messages: []
    };
    setRides(prev => [newRide, ...prev]);
  }, []);

  const handleSendMessage = useCallback((rideId: string, text: string) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString()
    };
    setRides(prev => prev.map(ride => 
      ride.id === rideId ? { ...ride, messages: [...(ride.messages || []), newMessage] } : ride
    ));
  }, [currentUser]);

  const handleUpdateRideStatus = useCallback((rideId: string, newStatus: RideStatus, driverId?: string) => {
    setRides(prevRides => {
      const rideIndex = prevRides.findIndex(r => r.id === rideId);
      if (rideIndex === -1) return prevRides;

      const updatedRides = [...prevRides];
      const targetRide = { 
        ...updatedRides[rideIndex], 
        status: newStatus, 
        driverId: driverId || updatedRides[rideIndex].driverId 
      };
      updatedRides[rideIndex] = targetRide;

      // LÓGICA DE FINALIZAÇÃO E DÉBITO AUTOMÁTICO
      if (newStatus === RideStatus.COMPLETED) {
        const commission = paymentSettings.platformCommission / 100;
        const totalAmount = targetRide.price;
        const driverShare = totalAmount * (1 - commission);

        setUsers(prevUsers => prevUsers.map(user => {
          // Crédito para o Motorista
          if (user.id === targetRide.driverId) {
            return { ...user, earnings: (user.earnings || 0) + driverShare };
          }
          // Débito automático do Passageiro (se for Pre-pago/Duarte Pay)
          if (user.id === targetRide.riderId && targetRide.paymentMethod === PaymentMethod.PREPAID) {
            const currentBalance = user.walletBalance || 0;
            return { ...user, walletBalance: currentBalance - totalAmount };
          }
          return user;
        }));
      }

      return updatedRides;
    });
  }, [paymentSettings.platformCommission]);

  const handleRateRide = useCallback((rideId: string, rating: number, role: UserRole) => {
    setRides(prev => prev.map(ride => {
      if (ride.id === rideId) {
        return role === UserRole.RIDER 
          ? { ...ride, ratingToDriver: rating } 
          : { ...ride, ratingToRider: rating };
      }
      return ride;
    }));
  }, []);

  const handleUpdateBalance = useCallback((userId: string, amount: number) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, walletBalance: (u.walletBalance || 0) + amount } : u
    ));
  }, []);

  const handleUpdateUser = useCallback((userId: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, []);

  const handleDeleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const handleRegister = useCallback((userData: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: userData.name || 'Novo Usuário',
      email: userData.email || '',
      phone: userData.phone || '', // Ensure phone is captured
      role: userData.role || UserRole.RIDER,
      avatar: `https://picsum.photos/seed/${Date.now()}/200`,
      walletBalance: 0,
      ...userData
    } as UserProfile;
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminPortal(false);
    setActiveTab('home');
  };

  const driverRides = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.DRIVER) return [];
    return rides.filter(r => r.status === RideStatus.REQUESTED || r.driverId === currentUser.id);
  }, [rides, currentUser]);

  const riderRides = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.RIDER) return [];
    return rides.filter(r => r.riderId === currentUser.id);
  }, [rides, currentUser]);

  const availableDrivers = useMemo(() => 
    users.filter(u => u.role === UserRole.DRIVER && u.isOnline), 
    [users]
  );

  const currentUserWithLatestData = useMemo(() => {
    if (!currentUser) return null;
    return users.find(u => u.id === currentUser.id) || currentUser;
  }, [users, currentUser]);

  if (!currentUserWithLatestData) {
    if (isAdminPortal) {
      return <AdminLogin onLogin={setCurrentUser} onBackToPublic={() => setIsAdminPortal(false)} />;
    }
    return <Login onLogin={setCurrentUser} onRegister={handleRegister} onGoToAdmin={() => setIsAdminPortal(true)} />;
  }

  return (
    <Layout user={currentUserWithLatestData} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {currentUserWithLatestData.role === UserRole.ADMIN && (
        <AdminDashboard 
          users={users} 
          rides={rides} 
          paymentSettings={paymentSettings}
          rechargeCodes={rechargeCodes}
          onSaveRechargeCode={handleSaveRechargeCode}
          onCancelRechargeCode={handleCancelRechargeCode}
          pushLogs={pushLogs}
          onAddPushLog={handleAddPushLog}
          onUpdateSettings={setPaymentSettings}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          externalActiveTab={activeTab}
          onViewChange={setActiveTab}
        />
      )}
      
      {currentUserWithLatestData.role === UserRole.DRIVER && (
        <DriverDashboard 
          driver={currentUserWithLatestData} 
          rides={driverRides} 
          allUsers={users}
          platformCommission={paymentSettings.platformCommission}
          onUpdateStatus={handleUpdateRideStatus}
          onRateRide={handleRateRide}
          onSendMessage={handleSendMessage}
          externalActiveTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
      
      {currentUserWithLatestData.role === UserRole.RIDER && (
        <RiderDashboard 
          rider={currentUserWithLatestData} 
          rides={riderRides} 
          onRequestRide={handleRequestRide}
          onUpdateStatus={handleUpdateRideStatus}
          availableDrivers={availableDrivers}
          allUsers={users}
          onRateRide={handleRateRide}
          onSendMessage={handleSendMessage}
          onUpdateBalance={handleUpdateBalance}
          paymentSettings={paymentSettings}
          rechargeCodes={rechargeCodes}
          onRedeemRechargeCode={handleRedeemRechargeCode}
          onAddPushLog={handleAddPushLog}
          externalActiveTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </Layout>
  );
};

export default App;
