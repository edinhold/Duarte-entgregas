
import React from 'react';

interface MapMockProps {
  className?: string;
  origin?: string;
  destination?: string;
  markers?: Array<{ lat: number, lng: number, type: 'driver' | 'rider' }>;
}

const MapMock: React.FC<MapMockProps> = ({ className, origin, destination, markers }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-200 rounded-xl border border-slate-300 ${className}`}>
      {/* Visual Mock Map Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Mock Roads */}
      <div className="absolute top-1/2 left-0 w-full h-8 bg-white/50 -rotate-12 border-y border-slate-400/20" />
      <div className="absolute top-0 left-1/3 w-8 h-full bg-white/50 rotate-6 border-x border-slate-400/20" />

      {/* Static Markers if locations provided */}
      {origin && (
        <div className="absolute top-[25%] left-[25%] flex flex-col items-center">
          <i className="fas fa-map-marker-alt text-red-500 text-2xl drop-shadow-md"></i>
          <span className="text-[10px] bg-white px-1 rounded border shadow-sm mt-1 whitespace-nowrap">{origin}</span>
        </div>
      )}
      {destination && (
        <div className="absolute top-[75%] left-[75%] flex flex-col items-center">
          <i className="fas fa-flag-checkered text-indigo-950 text-2xl drop-shadow-md"></i>
          <span className="text-[10px] bg-white px-1 rounded border shadow-sm mt-1 whitespace-nowrap">{destination}</span>
        </div>
      )}

      {/* Dynamic Markers */}
      {markers?.map((m, idx) => (
        <div 
          key={idx}
          className="absolute transition-all duration-1000 ease-linear z-20"
          style={{ top: `${m.lat}%`, left: `${m.lng}%`, transform: 'translate(-50%, -50%)' }}
        >
          {m.type === 'driver' && (
            <div className="absolute inset-0 w-12 h-12 -m-2 bg-indigo-950/20 rounded-full animate-ping"></div>
          )}
          <div className={`p-2.5 rounded-2xl shadow-2xl border-2 border-white ${m.type === 'driver' ? 'bg-indigo-950 text-white' : 'bg-blue-600 text-white'}`}>
            <i className={`fas ${m.type === 'driver' ? 'fa-car-side' : 'fa-user'}`}></i>
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-2.5 rounded-2xl text-xs font-bold text-slate-600 border border-slate-200 shadow-xl flex items-center justify-between z-30">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span>GPS Ativo</span>
        </div>
        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">Sinal: Excelente</span>
      </div>
    </div>
  );
};

export default MapMock;
