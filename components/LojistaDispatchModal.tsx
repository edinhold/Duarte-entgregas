import React, { useState, useEffect, useRef } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import { Location, PaymentMethod, PaymentSettings, Ride, RideStatus, UserProfile, VehicleType, DeliveryPriority } from '../types';
import { calculateDistanceKm, estimateTravelTimeMinutes, extractAddressMeta } from '../services/geocoding';
import { dispatchPushToDrivers } from '../services/notifications';

interface LojistaDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: UserProfile;
  paymentSettings: PaymentSettings;
  availableDrivers: UserProfile[];
  onRequestRide: (rideData: Omit<Ride, 'id' | 'status' | 'timestamp'>) => void;
  onAddPushLog?: (log: any) => void;
  onUpdateBalance?: (userId: string, amount: number) => void;
}

const LojistaDispatchModal: React.FC<LojistaDispatchModalProps> = ({
  isOpen,
  onClose,
  rider,
  paymentSettings,
  availableDrivers,
  onRequestRide,
  onAddPushLog,
  onUpdateBalance
}) => {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [merchantPrice, setMerchantPrice] = useState<number>(15.0);
  const [priority, setPriority] = useState<DeliveryPriority>('NORMAL');
  const [notes, setNotes] = useState('');

  const [originLoc, setOriginLoc] = useState<Location>({
    lat: -23.5505,
    lng: -46.6333,
    address: 'Rua do Comércio, 100 - Centro, São Paulo',
    neighborhood: 'Centro',
    city: 'São Paulo'
  });

  const [destLoc, setDestLoc] = useState<Location>({
    lat: -23.5615,
    lng: -46.6913,
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
    neighborhood: 'Bela Vista',
    city: 'São Paulo'
  });

  const [calculatedDistance, setCalculatedDistance] = useState<number>(3.5);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(12);
  const [driverEarnings, setDriverEarnings] = useState<number>(12.75);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PREPAID);

  // Map state and refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const [isPinConfirmed, setIsPinConfirmed] = useState(false);

  // Initialize and sync Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([destLoc.lat, destLoc.lng], 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setDestLoc(prev => ({ ...prev, lat, lng }));
          setIsPinConfirmed(false);
        });

        mapRef.current = map;
      }

      // Update Origin Marker
      if (originLoc && mapRef.current) {
        const origPos: [number, number] = [originLoc.lat, originLoc.lng];
        if (!originMarkerRef.current) {
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="flex flex-col items-center">
                <div class="bg-indigo-950 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap uppercase mb-1">Loja Coleta</div>
                <div class="w-8 h-8 bg-indigo-950 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs">
                  <i class="fas fa-store"></i>
                </div>
              </div>
            `,
            iconSize: [60, 50],
            iconAnchor: [30, 45]
          });
          originMarkerRef.current = L.marker(origPos, { icon }).addTo(mapRef.current);
        } else {
          originMarkerRef.current.setLatLng(origPos);
        }
      }

      // Update Destination Marker (Draggable)
      if (destLoc && mapRef.current) {
        const destPos: [number, number] = [destLoc.lat, destLoc.lng];
        if (!destMarkerRef.current) {
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="flex flex-col items-center">
                <div class="bg-amber-500 text-indigo-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md whitespace-nowrap uppercase mb-1 border border-amber-300">Arraste a Entrega</div>
                <div class="w-9 h-9 bg-amber-400 text-indigo-950 rounded-full border-2 border-indigo-950 shadow-2xl flex items-center justify-center text-sm font-black animate-bounce">
                  <i class="fas fa-flag-checkered"></i>
                </div>
              </div>
            `,
            iconSize: [70, 55],
            iconAnchor: [35, 50]
          });

          const marker = L.marker(destPos, { icon, draggable: true }).addTo(mapRef.current);

          marker.on('dragend', (e: any) => {
            const latlng = e.target.getLatLng();
            setDestLoc(prev => ({
              ...prev,
              lat: latlng.lat,
              lng: latlng.lng
            }));
            setIsPinConfirmed(false);
          });

          destMarkerRef.current = marker;
        } else {
          destMarkerRef.current.setLatLng(destPos);
        }
      }

      // Draw Polyline
      if (originLoc && destLoc && mapRef.current) {
        const points: [number, number][] = [
          [originLoc.lat, originLoc.lng],
          [destLoc.lat, destLoc.lng]
        ];
        if (!routeLineRef.current) {
          routeLineRef.current = L.polyline(points, {
            color: '#4f46e5',
            weight: 5,
            opacity: 0.8,
            dashArray: '8, 12'
          }).addTo(mapRef.current);
        } else {
          routeLineRef.current.setLatLngs(points);
        }

        const bounds = L.latLngBounds(points);
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }

      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, originLoc, destLoc]);

  // Cleanup map instance on modal close
  useEffect(() => {
    if (!isOpen && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      routeLineRef.current = null;
    }
  }, [isOpen]);

  const handleConfirmMapLocation = () => {
    setIsPinConfirmed(true);
  };

  // Recalculate distance, estimated time & driver earnings dynamically
  useEffect(() => {
    if (originLoc && destLoc) {
      const dist = calculateDistanceKm(originLoc, destLoc);
      setCalculatedDistance(dist);

      const timeMins = estimateTravelTimeMinutes(dist);
      setEstimatedMinutes(timeMins);

      // Financial formula:
      // Commission percentage (e.g. 15%)
      const comm = (paymentSettings.platformCommission || 15) / 100;
      let calculatedPrice = merchantPrice;

      // Suggest minimum price if lower than minimum fee
      if (paymentSettings.minimumRideFee && calculatedPrice < paymentSettings.minimumRideFee) {
        calculatedPrice = paymentSettings.minimumRideFee;
      }

      const netDriver = Math.max(0, calculatedPrice * (1 - comm));
      setDriverEarnings(netDriver);
    }
  }, [originLoc, destLoc, merchantPrice, paymentSettings]);

  if (!isOpen) return null;

  const currentBalance = rider.walletBalance || 0;
  const isBalanceSufficient = currentBalance >= merchantPrice || paymentMethod !== PaymentMethod.PREPAID;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      alert('Por favor informe o nome do produto a ser entregue.');
      return;
    }

    if (paymentMethod === PaymentMethod.PREPAID && currentBalance < merchantPrice) {
      alert(`Saldo insuficiente na carteira (R$ ${currentBalance.toFixed(2)}). Por favor recarregue seus créditos ou selecione outra forma de pagamento.`);
      return;
    }

    const origMeta = extractAddressMeta(originLoc.address);
    const destMeta = extractAddressMeta(destLoc.address);

    const rideData: Omit<Ride, 'id' | 'status' | 'timestamp'> = {
      riderId: rider.id,
      origin: { ...originLoc, neighborhood: origMeta.neighborhood, city: origMeta.city },
      destination: { ...destLoc, neighborhood: destMeta.neighborhood, city: destMeta.city },
      price: merchantPrice,
      driverEarnings: driverEarnings,
      paymentMethod,
      vehicleTypeRequested: VehicleType.MOTORCYCLE,
      distance: `${calculatedDistance} km`,
      estimatedTimeMinutes: estimatedMinutes,
      pickupDistanceKm: 1.2,
      productName,
      productDescription,
      priority,
      notes,
      merchantName: rider.name,
      pickupNeighborhood: origMeta.neighborhood,
      deliveryNeighborhood: destMeta.neighborhood
    };

    onRequestRide(rideData);

    // Deduct prepaid wallet balance if prepaid
    if (paymentMethod === PaymentMethod.PREPAID && onUpdateBalance) {
      onUpdateBalance(rider.id, -merchantPrice);
    }

    // Trigger Push notification dispatch to all online drivers
    const pushLog = dispatchPushToDrivers(
      `ride-${Date.now()}`,
      productName,
      merchantPrice,
      driverEarnings,
      `${calculatedDistance} km`,
      destMeta.city,
      availableDrivers
    );

    if (onAddPushLog) {
      onAddPushLog(pushLog);
    }

    onClose();
    alert(`⚡ Corrida criada com sucesso! Notificação push enviada para ${availableDrivers.length} motorista(s) online.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-950 text-white p-6 md:p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-400 text-indigo-950 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
              <i className="fas fa-motorcycle"></i>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Chamar Motorista Duarte</h3>
              <p className="text-xs text-indigo-200">Despacho rápido de produtos e mercadorias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Informações da Carga */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest border-b border-slate-100 pb-2">
              1. Detalhes da Entrega
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pizza Grande + Refrigerante, Documentos, Peças"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Prioridade da Entrega
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600"
                >
                  <option value="NORMAL">🟢 Normal</option>
                  <option value="HIGH">🟡 Alta Prioridade</option>
                  <option value="URGENT">🔴 URGENTE (Fila Flash)</option>
                  <option value="LOW">⚪ Baixa (Econômica)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                Descrição do Item & Observações para o Motorista
              </label>
              <input
                type="text"
                placeholder="Ex: Manter na horizontal. Retirar no balcão de trás. Falar com Marcos."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Endereços de Coleta e Entrega */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest border-b border-slate-100 pb-2">
              2. Trajeto & Localização (Geocodificação Direta por Rua/Bairro)
            </h4>

            <AddressAutocomplete
              label="Endereço de Coleta (Seu Estabelecimento / Retirada)"
              placeholder="Digite a rua, número e bairro da coleta..."
              icon="fa-store"
              value={originLoc.address}
              onSelectLocation={setOriginLoc}
              required
            />

            <AddressAutocomplete
              label="Endereço de Entrega (Destino do Cliente)"
              placeholder="Digite a rua, número e bairro do cliente..."
              icon="fa-flag-checkered"
              value={destLoc.address}
              onSelectLocation={setDestLoc}
              required
            />

            {/* Ajuste fino da localização de entrega no mapa com botão de confirmação */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                  <i className="fas fa-map-marked-alt text-indigo-600 mr-1.5"></i>
                  <span>Ajuste Fino da Posição Exata da Entrega</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  Arraste o pino ou clique no mapa
                </span>
              </div>

              <div className="relative w-full h-72 rounded-3xl overflow-hidden border-2 border-indigo-200 shadow-lg">
                {/* Elemento do mapa Leaflet com seletor #map */}
                <div id="map" ref={mapContainerRef} className="w-full h-full z-0" />

                {/* Controle flutuante personalizado "Confirmar Local de Entrega" sobre o mapa */}
                <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100">
                  <div className="flex items-center space-x-2.5 text-indigo-950 text-xs">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-md">
                      <i className="fas fa-map-pin"></i>
                    </div>
                    <div>
                      <p className="font-black text-indigo-950 text-xs leading-tight">Pino de Entrega</p>
                      <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                        Lat: <span className="text-indigo-600 font-extrabold">{destLoc.lat.toFixed(5)}</span> | Lng: <span className="text-indigo-600 font-extrabold">{destLoc.lng.toFixed(5)}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmMapLocation}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md active:scale-95 ${
                      isPinConfirmed
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-amber-400 hover:bg-amber-500 text-indigo-950 shadow-amber-300'
                    }`}
                  >
                    <i className={`fas ${isPinConfirmed ? 'fa-check-circle text-sm' : 'fa-crosshairs text-sm'}`}></i>
                    <span>{isPinConfirmed ? 'Local de Entrega Confirmado!' : 'Confirmar Local de Entrega'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cálculo Financeiro & Valor do Motorista */}
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center justify-between">
              <span>3. Resumo Financeiro da Corrida</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full">
                {availableDrivers.length} motorista(s) online
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Valor que você pagará (R$) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    min={paymentSettings.minimumRideFee || 5.0}
                    value={merchantPrice}
                    onChange={(e) => setMerchantPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-black text-lg text-indigo-950 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Distância & Tempo Estimado
                </label>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
                  <p className="font-black text-indigo-950 text-sm">{calculatedDistance} km</p>
                  <p className="text-[10px] font-bold text-slate-400">~{estimatedMinutes} minutos</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Motorista Receberá Líquido
                </label>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="font-black text-emerald-700 text-lg">R$ {driverEarnings.toFixed(2)}</p>
                  <p className="text-[9px] font-bold text-emerald-600">Taxa plataforma: {paymentSettings.platformCommission}%</p>
                </div>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.PREPAID)}
                  className={`p-3 rounded-xl border-2 text-left font-bold text-xs flex items-center space-x-2 transition-all ${
                    paymentMethod === PaymentMethod.PREPAID
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  <i className="fas fa-wallet text-indigo-600 text-base"></i>
                  <div>
                    <p className="leading-tight">Créditos Duarte Pay</p>
                    <p className="text-[9px] text-slate-400">Saldo atual: R$ {currentBalance.toFixed(2)}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  className={`p-3 rounded-xl border-2 text-left font-bold text-xs flex items-center space-x-2 transition-all ${
                    paymentMethod === PaymentMethod.CASH
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  <i className="fas fa-money-bill-wave text-emerald-600 text-base"></i>
                  <div>
                    <p className="leading-tight">Dinheiro no Local</p>
                    <p className="text-[9px] text-slate-400">Pago direto na entrega</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {!isBalanceSufficient && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-800 text-xs font-bold">
              <i className="fas fa-exclamation-triangle text-amber-600 text-lg shrink-0"></i>
              <span>Saldo de créditos insuficiente na carteira (R$ {currentBalance.toFixed(2)}). Recarrega na aba Carteira com um Código de Recarga ou altere a forma de pagamento.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isBalanceSufficient}
              className={`w-2/3 py-4 font-black uppercase text-xs tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center space-x-2 ${
                isBalanceSufficient
                  ? 'bg-amber-400 hover:bg-amber-500 text-indigo-950 shadow-amber-200'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-paper-plane"></i>
              <span>Confirmar & Notificar Motoristas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LojistaDispatchModal;
