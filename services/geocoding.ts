// Geocoding and Location calculation service for Duarte Delivery
import { Location } from '../types';

export interface AddressSearchResult {
  display_name: string;
  lat: number;
  lng: number;
  addressDetails?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
  };
}

/**
 * Searches address using OpenStreetMap Nominatim API (No CEP required)
 * Accepts street name, number, neighborhood, city
 */
export async function searchAddress(query: string): Promise<AddressSearchResult[]> {
  if (!query || query.trim().length < 3) return [];
  
  try {
    const encoded = encodeURIComponent(query.trim() + ', Brasil');
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&addressdetails=1&limit=5`, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });

    if (!response.ok) throw new Error('Falha ao buscar endereço');

    const data = await response.json();
    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      addressDetails: {
        road: item.address?.road || item.address?.street,
        house_number: item.address?.house_number,
        suburb: item.address?.suburb || item.address?.neighbourhood,
        city: item.address?.city || item.address?.town || item.address?.municipality,
        state: item.address?.state
      }
    }));
  } catch (err) {
    console.warn('Geocoding search fallback triggered:', err);
    // Mock fallback results if offline/network blocked
    const mockResults: AddressSearchResult[] = [
      {
        display_name: `${query}, Centro - São Paulo, SP`,
        lat: -23.5505 + (Math.random() - 0.5) * 0.04,
        lng: -46.6333 + (Math.random() - 0.5) * 0.04,
        addressDetails: { road: query, suburb: 'Centro', city: 'São Paulo' }
      },
      {
        display_name: `${query}, Pinheiros - São Paulo, SP`,
        lat: -23.5615 + (Math.random() - 0.5) * 0.04,
        lng: -46.6913 + (Math.random() - 0.5) * 0.04,
        addressDetails: { road: query, suburb: 'Pinheiros', city: 'São Paulo' }
      }
    ];
    return mockResults;
  }
}

/**
 * Haversine formula distance calculation in kilometers
 */
export function calculateDistanceKm(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
  const R = 6371; // Earth radius in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLng = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Estimate travel time in minutes based on distance and average urban velocity (25 km/h for motorcycles)
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  const avgSpeedKmH = 25;
  const timeHours = distanceKm / avgSpeedKmH;
  const minutes = Math.ceil(timeHours * 60) + 4; // Add 4 mins for traffic/pickup
  return Math.max(5, minutes);
}

/**
 * Extract neighborhood and city from address string or details
 */
export function extractAddressMeta(addressStr: string): { neighborhood: string; city: string } {
  const parts = addressStr.split(',').map(p => p.trim());
  let neighborhood = 'Centro';
  let city = 'São Paulo';

  if (parts.length >= 2) {
    neighborhood = parts[1] || 'Centro';
  }
  if (parts.length >= 3) {
    city = parts[2] || 'São Paulo';
  }

  return { neighborhood, city };
}
