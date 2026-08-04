
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
  ARRIVED_AT_PICKUP = 'ARRIVED_AT_PICKUP',
  PICKUP = 'PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  ARRIVED_AT_DESTINATION = 'ARRIVED_AT_DESTINATION',
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
  phone: string;
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
  currentLat?: number;
  currentLng?: number;
  // OneSignal Identification
  oneSignalExternalId?: string;
  oneSignalSubscriptionId?: string;
  devicePlatform?: string;
  lastSubscriptionDate?: string;
  isPushEnabled?: boolean;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  neighborhood?: string;
  city?: string;
}

export type DeliveryPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Ride {
  id: string;
  riderId: string; // Lojista / Cliente
  driverId?: string;
  origin: Location;
  destination: Location;
  status: RideStatus;
  price: number; // Valor pago pelo lojista
  driverEarnings?: number; // Valor líquido que o motorista receberá
  paymentMethod: PaymentMethod;
  vehicleTypeRequested: VehicleType;
  timestamp: string;
  distance: string;
  estimatedTimeMinutes?: number;
  pickupDistanceKm?: number;
  // Campos de despacho de entregas
  productName?: string;
  productDescription?: string;
  priority?: DeliveryPriority;
  notes?: string;
  merchantName?: string;
  pickupNeighborhood?: string;
  deliveryNeighborhood?: string;
  ratingToDriver?: number;
  ratingToRider?: number;
  messages?: ChatMessage[];
}

export interface PricingRule {
  id: string;
  regionName: string;
  basePrice: number;
  pricePerKm: number;
  active: boolean;
}

export interface PaymentSettings {
  apiKey: string;
  provider: 'Stripe' | 'MercadoPago' | 'PayPal';
  minimumRideFee: number; // Valor mínimo da corrida
  platformCommission: number; // Porcentagem
  fixedBaseFee: number; // Taxa fixa por entrega
  pricePerKm: number; // Valor por KM
  pricePerMinute: number; // Valor por minuto
  bonusPerRide: number; // Bônus promocional
  driverRadiusKm: number; // Raio em km para notar motoristas
  pricingRules: PricingRule[];
}

export interface RechargeUsageLog {
  date: string;
  userId: string;
  userName: string;
  amount: number;
}

export interface RechargeCode {
  id: string;
  code: string;
  amount: number;
  usageType: 'SINGLE' | 'MULTIPLE';
  maxUses: number;
  usedCount: number;
  expirationDate: string;
  targetMerchantId?: string;
  note?: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  usageLogs: RechargeUsageLog[];
}

export interface PushNotificationRecipient {
  driverId: string;
  driverName: string;
  status: 'DELIVERED' | 'FAILED';
}

export interface PushNotificationLog {
  id: string;
  rideId?: string;
  title: string;
  message: string;
  amount?: number;
  distance?: string;
  city?: string;
  sentAt: string;
  targetDriverCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'SENT' | 'FAILED' | 'TEST';
  recipients: PushNotificationRecipient[];
  oneSignalNotificationId?: string;
  httpStatus?: number;
  responseSnippet?: string;
}

export interface BrandingSettings {
  systemName: string;
  presentationText: string;
  mainLogo: string;
  lightBgLogo: string;
  darkBgLogo: string;
  reducedIcon: string;
  favicon: string;
  pwaIcon: string;
  loginBgImage: string;
  primaryColor: string;
  secondaryColor: string;
  buttonColor: string;
  sidebarColor: string;
  headerColor: string;
  themeMode: 'light' | 'dark' | 'system';
  altText: string;
  updatedAt?: string;
}

export interface OneSignalConfig {
  appId: string;
  restApiKey: string;
  androidChannelId: string;
  enabled: boolean;
}

export interface OneSignalDiagnosticLog {
  id: string;
  rideId?: string;
  targetDriverCount: number;
  targetDeviceCount: number;
  oneSignalNotificationId?: string;
  httpStatus: number;
  responseBodySnippet?: string;
  status: 'SUCCESS' | 'FAILED' | 'TEST';
  errorMessage?: string;
  sentAt: string;
  responseTimeMs?: number;
  retryCount?: number;
}

export interface AppState {
  currentUser: UserProfile | null;
  rides: Ride[];
  users: UserProfile[];
  paymentSettings: PaymentSettings;
  rechargeCodes: RechargeCode[];
  pushLogs: PushNotificationLog[];
}

