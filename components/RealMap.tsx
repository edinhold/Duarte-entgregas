
import React, { useEffect, useRef, useState } from 'react';

declare const L: any;

interface RealMapProps {
  className?: string;
  driverLocation?: { lat: number, lng: number };
  riderLocation?: { lat: number, lng: number };
  destinationLocation?: { lat: number, lng: number };
  rideStatus?: string;
  driverInfo?: { name: string; plate?: string };
  riderInfo?: { name: string };
}

const RealMap: React.FC<RealMapProps> = ({ 
  className, 
  driverLocation, 
  riderLocation, 
  destinationLocation,
  rideStatus,
  driverInfo,
  riderInfo
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const approachLineRef = useRef<any>(null);
  const approachGlowRef = useRef<any>(null);
  const destinationLineRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([-23.5505, -46.6333], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Marcador do Passageiro
  useEffect(() => {
    if (!mapRef.current || !riderLocation) {
      if (riderMarkerRef.current) {
        mapRef.current.removeLayer(riderMarkerRef.current);
        riderMarkerRef.current = null;
      }
      return;
    }
    const pos: [number, number] = [riderLocation.lat, riderLocation.lng];
    
    if (!riderMarkerRef.current) {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full mb-1 shadow-sm whitespace-nowrap uppercase">${riderInfo?.name || 'Passageiro'}</div>
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-ping"></div>
              <div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] relative z-10">
                <i class="fas fa-user"></i>
              </div>
            </div>
          </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 45]
      });
      riderMarkerRef.current = L.marker(pos, { icon }).addTo(mapRef.current);
    } else {
      riderMarkerRef.current.setLatLng(pos);
    }
  }, [riderLocation, riderInfo]);

  // Marcador de Destino Final
  useEffect(() => {
    if (!mapRef.current || !destinationLocation) {
      if (destinationMarkerRef.current) {
        mapRef.current.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
      return;
    }
    const pos: [number, number] = [destinationLocation.lat, destinationLocation.lng];
    
    if (!destinationMarkerRef.current) {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex flex-col items-center">
             <div class="bg-indigo-950 text-white text-[8px] font-black px-2 py-0.5 rounded-full mb-1 shadow-sm whitespace-nowrap uppercase">Destino</div>
             <div class="w-8 h-8 bg-indigo-950 rounded-lg border-2 border-white shadow-xl flex items-center justify-center text-white text-xs">
              <i class="fas fa-flag-checkered"></i>
            </div>
          </div>
        `,
        iconSize: [60, 40],
        iconAnchor: [30, 35]
      });
      destinationMarkerRef.current = L.marker(pos, { icon }).addTo(mapRef.current);
    } else {
      destinationMarkerRef.current.setLatLng(pos);
    }
  }, [destinationLocation]);

  // Marcador do Motorista
  useEffect(() => {
    if (!mapRef.current || !driverLocation) {
      if (driverMarkerRef.current) {
        mapRef.current.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
      return;
    }

    const dPos: [number, number] = [driverLocation.lat, driverLocation.lng];
    
    if (!driverMarkerRef.current) {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="driver-marker-container flex flex-col items-center">
            <div class="bg-indigo-950 text-white p-1 rounded-lg mb-1 shadow-md text-center min-w-[50px]">
               <p class="text-[7px] font-black uppercase leading-none mb-0.5">${driverInfo?.name || 'Motorista'}</p>
               <p class="text-[6px] font-bold text-indigo-300 uppercase leading-none">${driverInfo?.plate || '---'}</p>
            </div>
            <div class="relative flex items-center justify-center">
              <div class="driver-glow"></div>
              <div class="w-9 h-9 bg-indigo-950 rounded-xl border-2 border-white shadow-2xl flex items-center justify-center text-white text-sm relative z-20">
                <i class="fas fa-car-side"></i>
              </div>
            </div>
          </div>
        `,
        iconSize: [80, 80],
        iconAnchor: [40, 60]
      });
      driverMarkerRef.current = L.marker(dPos, { icon }).addTo(mapRef.current);
    } else {
      driverMarkerRef.current.setLatLng(dPos);
    }

    // Lógica de Trajeto
    const isEnRoute = rideStatus === 'IN_PROGRESS';
    const targetLocation = isEnRoute ? destinationLocation : riderLocation;

    if (targetLocation) {
      const tPos: [number, number] = [targetLocation.lat, targetLocation.lng];
      const routePoints = [dPos, tPos];

      if (isEnRoute && approachLineRef.current) {
        mapRef.current.removeLayer(approachLineRef.current);
        mapRef.current.removeLayer(approachGlowRef.current);
        approachLineRef.current = null;
        approachGlowRef.current = null;
      }

      const lineRef = isEnRoute ? destinationLineRef : approachLineRef;
      const color = isEnRoute ? '#10b981' : '#4f46e5';

      if (!lineRef.current) {
        lineRef.current = L.polyline(routePoints, {
          color: color,
          weight: 6,
          opacity: 0.8,
          dashArray: isEnRoute ? 'none' : '10, 15',
          lineCap: 'round',
          lineJoin: 'round',
          className: isEnRoute ? 'animate-pulse' : 'animate-route-flow'
        }).addTo(mapRef.current);

        if (!isEnRoute && !approachGlowRef.current) {
          approachGlowRef.current = L.polyline(routePoints, {
            color: color,
            weight: 12,
            opacity: 0.15,
            lineJoin: 'round',
            className: 'approach-glow-line'
          }).addTo(mapRef.current);
        }
      } else {
        lineRef.current.setLatLngs(routePoints);
        if (approachGlowRef.current) approachGlowRef.current.setLatLngs(routePoints);
      }

      const bounds = L.latLngBounds([dPos, tPos]);
      mapRef.current.fitBounds(bounds, { padding: [80, 80], animate: true });
    }
  }, [driverLocation, riderLocation, destinationLocation, rideStatus, driverInfo, riderInfo]);

  return (
    <div className={`relative overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-inner ${className}`}>
      <style>{`
        @keyframes routeFlow {
          0% { stroke-dashoffset: 160; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-route-flow {
          animation: routeFlow 3s linear infinite;
        }
        .driver-glow {
          position: absolute;
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, transparent 70%);
          animation: markerPulse 2s ease-out infinite;
        }
        @keyframes markerPulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default RealMap;
