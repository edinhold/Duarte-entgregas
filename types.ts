
export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  RIDER = 'RIDER'
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE'
}

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  PICKUP = 'PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  PIX = 'PIX',
  CASH = 'CASH',
  PREPAID = 'PREPAID'
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string; // Novo campo obrigatório
  role: UserRole;
  avatar: string;
  walletBalance?: number;
  // Driver specific
  licensePlate?: string;
  vehicleModel?: string;
  vehicleType?: VehicleType;
  rating?: number;
  earnings?: number;
  isOnline?: boolean;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  origin: Location;
  destination: Location;
  status: RideStatus;
  price: number;
  paymentMethod: PaymentMethod;
  vehicleTypeRequested: VehicleType;
  timestamp: string;
  distance: string;
  ratingToDriver?: number;
  ratingToRider?: number;
  messages?: ChatMessage[];
}

export interface PricingRule {
  id: string;
  regionName: string; // Ex: "Centro", "Bairro X"
  basePrice: number;  // Valor da bandeirada
  pricePerKm: number; // Valor por KM rodado
  active: boolean;
}

export interface PaymentSettings {
  apiKey: string;
  provider: 'Stripe' | 'MercadoPago' | 'PayPal';
  platformCommission: number; // Porcentagem
  pricingRules: PricingRule[];
}

export interface AppState {
  currentUser: UserProfile | null;
  rides: Ride[];
  users: UserProfile[];
  paymentSettings: PaymentSettings;
}
