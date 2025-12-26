
import React, { useState, useCallback, useMemo } from 'react';
import { UserRole, UserProfile, Ride, RideStatus, PaymentMethod, PaymentSettings, ChatMessage, PricingRule, VehicleType } from './types';
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAdminPortal, setIsAdminPortal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('home'); // 'home', 'history', 'wallet', 'settings'
  const [users, setUsers] = useState<UserProfile[]>(() => {
    // Fixed: Added missing required 'phone' property to initial rider data
    return [...MOCK_DRIVERS, { id: 'r1', name: 'João Paulo', email: 'joao@user.com', phone: '(11) 99999-8888', role: UserRole.RIDER, avatar: 'https://picsum.photos/seed/r1/200', walletBalance: 150.00 }];
  });
  const [rides, setRides] = useState<Ride[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    apiKey: '', 
    provider: 'Stripe',
    platformCommission: 15,
    pricingRules: DEFAULT_PRICING
  });

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
          onUpdateSettings={setPaymentSettings}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
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
          externalActiveTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </Layout>
  );
};

export default App;
