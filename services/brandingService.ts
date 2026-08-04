// Branding & Visual Identity Service for Duarte Delivery
import { BrandingSettings } from '../types';

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  systemName: 'Duarte Delivery',
  presentationText: 'Plataforma inteligente de transporte multimodal e entregas expressas.',
  mainLogo: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
  lightBgLogo: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
  darkBgLogo: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
  reducedIcon: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
  favicon: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
  pwaIcon: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
  loginBgImage: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=1200&auto=format&fit=crop',
  primaryColor: '#4f46e5', // Indigo 600
  secondaryColor: '#0f172a', // Slate 900
  buttonColor: '#1e1b4b', // Indigo 950
  sidebarColor: '#1e1b4b', // Indigo 950
  headerColor: '#1e1b4b', // Indigo 950
  themeMode: 'light',
  altText: 'Logo Duarte Delivery',
  updatedAt: new Date().toISOString()
};

/**
 * Validates uploaded image file format, size and MIME type according to Section 18.3
 */
export function validateBrandingImage(file: File): { isValid: boolean; errorMsg?: string } {
  // Max size: 5 MB (5 * 1024 * 1024 bytes)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

  if (!file) {
    return { isValid: false, errorMsg: 'Nenhum arquivo selecionado.' };
  }

  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  const isMimeValid = ALLOWED_MIME_TYPES.includes(mimeType) || 
                      fileName.endsWith('.png') || 
                      fileName.endsWith('.jpg') || 
                      fileName.endsWith('.jpeg');

  if (!isMimeValid) {
    return {
      isValid: false,
      errorMsg: 'Formato não permitido. Envie uma imagem PNG, JPG ou JPEG.'
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      isValid: false,
      errorMsg: 'A imagem ultrapassa o limite de 5 MB.'
    };
  }

  return { isValid: true };
}

/**
 * Reads a File object as Data URL string with image corruption check
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Image load test to check integrity
      const img = new Image();
      img.onload = () => resolve(result);
      img.onerror = () => reject(new Error('Não foi possível processar esta imagem. Selecione outro arquivo.'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo no navegador.'));
    reader.readAsDataURL(file);
  });
}
