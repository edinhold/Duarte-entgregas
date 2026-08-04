
import { PaymentSettings } from '../types';

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}

/**
 * Simula a integração com Gateways de Pagamento Reais.
 * Em um ambiente de produção, estas funções fariam chamadas fetch/axios para o backend.
 */
export const processExternalPayment = async (
  amount: number, 
  settings: PaymentSettings
): Promise<PaymentResponse> => {
  // Simula latência de rede
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Validação de segurança solicitada: Se a chave estiver ausente ou for "erro", simula falha
  if (!settings.apiKey || settings.apiKey === 'erro') {
    return {
      success: false,
      errorMessage: "Requested entity was not found. Verifique suas configurações de API no painel Admin."
    };
  }

  // Lógica específica por provedor (Simulação de Fluxo de API)
  switch (settings.provider) {
    case 'Stripe':
      console.log(`[Stripe API] Criando PaymentIntent de R$${amount} usando chave ${settings.apiKey.substring(0, 8)}...`);
      break;
    case 'MercadoPago':
      console.log(`[MercadoPago API] Gerando preferência de pagamento com Access Token...`);
      break;
    case 'PayPal':
      console.log(`[PayPal API] Autenticando ClientID para checkout express...`);
      break;
  }

  return {
    success: true,
    transactionId: `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`
  };
};
