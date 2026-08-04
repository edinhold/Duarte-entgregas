import React, { useState, useEffect, useRef } from 'react';
import { AddressSearchResult, searchAddress } from '../services/geocoding';
import { Location } from '../types';

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  icon?: string;
  value: string;
  onSelectLocation: (loc: Location) => void;
  required?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  placeholder,
  icon = 'fa-map-marker-alt',
  value,
  onSelectLocation,
  required = false
}) => {
  const [inputText, setInputText] = useState(value || '');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputText(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (text.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      const searchRes = await searchAddress(text);
      setResults(searchRes);
      setIsLoading(false);
    }, 400);
  };

  const handleSelectResult = (res: AddressSearchResult) => {
    const fullAddr = res.display_name;
    setInputText(fullAddr);
    setIsOpen(false);

    onSelectLocation({
      lat: res.lat,
      lng: res.lng,
      address: fullAddr,
      neighborhood: res.addressDetails?.suburb || 'Centro',
      city: res.addressDetails?.city || 'São Paulo'
    });
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLoading(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const addr = `Localização Atual (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setInputText(addr);
          onSelectLocation({
            lat,
            lng,
            address: addr,
            neighborhood: 'Sua Posição',
            city: 'São Paulo'
          });
        },
        () => {
          setIsLoading(false);
          alert('Não foi possível obter a posição GPS atual. Digite o endereço manualmente.');
        }
      );
    }
  };

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={handleUseCurrentGPS}
          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center space-x-1"
        >
          <i className="fas fa-crosshairs"></i>
          <span>Usar GPS</span>
        </button>
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-4 text-indigo-600 text-sm pointer-events-none">
          <i className={`fas ${icon}`}></i>
        </div>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          required={required}
          className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm text-slate-800 outline-none focus:border-indigo-600 transition-all placeholder:text-slate-400 placeholder:font-normal"
        />
        {isLoading && (
          <div className="absolute right-4 text-indigo-600 animate-spin">
            <i className="fas fa-spinner"></i>
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-slide-up max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectResult(res)}
                  className="w-full text-left p-3.5 hover:bg-indigo-50/60 transition-colors flex items-start space-x-3 group"
                >
                  <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs mt-0.5 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <i className="fas fa-map-pin"></i>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-950">
                      {res.addressDetails?.road || res.display_name.split(',')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {res.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="p-4 text-center text-xs text-slate-400 italic font-medium">
                Nenhum endereço encontrado para essa busca.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
