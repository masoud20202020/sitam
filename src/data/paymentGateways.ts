
import { v4 as uuidv4 } from 'uuid';

export type PaymentGatewayConfig = {
  merchantId?: string;
  terminalId?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  [key: string]: string | undefined;
};

export type PaymentGateway = {
  id: string;
  name: string;
  slug: string; // e.g., 'zarinpal', 'snapppay'
  description: string;
  isActive: boolean;
  logo?: string;
  config: PaymentGatewayConfig;
  isSystem?: boolean; // If true, cannot be deleted
};

const PAYMENT_GATEWAYS_KEY = 'payment_gateways';

export const defaultGateways: PaymentGateway[] = [
  {
    id: '1',
    name: 'زرین‌پال',
    slug: 'zarinpal',
    description: 'پرداخت امن با کلیه کارت‌های عضو شتاب',
    isActive: true,
    isSystem: true,
    logo: '/images/gateways/zarinpal.png',
    config: {
      merchantId: '',
    },
  },
  {
    id: '2',
    name: 'اسنپ‌پی',
    slug: 'snapppay',
    description: 'پرداخت اقساطی در ۴ قسط بدون کارمزد',
    isActive: false,
    isSystem: true,
    logo: '/images/gateways/snapppay.png',
    config: {
      merchantId: '',
      username: '',
      password: '',
    },
  },
  {
    id: '3',
    name: 'به‌پرداخت ملت',
    slug: 'behpardakht',
    description: 'درگاه پرداخت بانک ملت',
    isActive: false,
    isSystem: true,
    logo: '/images/gateways/mellat.png',
    config: {
      terminalId: '',
      username: '',
      password: '',
    },
  },
  {
    id: '4',
    name: 'سامان کیش',
    slug: 'sep',
    description: 'درگاه پرداخت اینترنتی بانک سامان',
    isActive: false,
    isSystem: true,
    logo: '/images/gateways/saman.png',
    config: {
      merchantId: '',
    },
  },
];

export function getPaymentGateways(): PaymentGateway[] {
  if (typeof window === 'undefined') return defaultGateways;
  const raw = localStorage.getItem(PAYMENT_GATEWAYS_KEY);
  if (!raw) {
    localStorage.setItem(PAYMENT_GATEWAYS_KEY, JSON.stringify(defaultGateways));
    return defaultGateways;
  }
  try {
    const parsed = JSON.parse(raw);
    
    // 1. Update system gateways with stored config
    const systemGateways = defaultGateways.map(def => {
      const existing = parsed.find((p: PaymentGateway) => p.slug === def.slug);
      return existing ? { ...def, ...existing, config: { ...def.config, ...existing.config }, isSystem: true } : { ...def, isSystem: true };
    });

    // 2. Add custom gateways (those not in defaultGateways)
    const customGateways = parsed.filter((p: PaymentGateway) => 
      !defaultGateways.some(def => def.slug === p.slug) && p.slug !== 'cod'
    ).map((p: PaymentGateway) => ({ ...p, isSystem: false }));

    return [...systemGateways, ...customGateways];
  } catch {
    return defaultGateways;
  }
}

export function savePaymentGateways(gateways: PaymentGateway[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PAYMENT_GATEWAYS_KEY, JSON.stringify(gateways));
}

export function addPaymentGateway(name: string, description: string): PaymentGateway {
  const gateways = getPaymentGateways();
  const newGateway: PaymentGateway = {
    id: uuidv4(),
    name,
    slug: `custom-${Date.now()}`,
    description,
    isActive: true,
    isSystem: false,
    config: {}
  };
  gateways.push(newGateway);
  savePaymentGateways(gateways);
  return newGateway;
}

export function deletePaymentGateway(id: string) {
  const gateways = getPaymentGateways();
  const newGateways = gateways.filter(g => g.id !== id || g.isSystem); // Prevent deleting system gateways
  savePaymentGateways(newGateways);
  return newGateways;
}

export function updatePaymentGateway(id: string, patch: Partial<PaymentGateway>) {
  const gateways = getPaymentGateways();
  const index = gateways.findIndex(g => g.id === id);
  if (index === -1) return;

  gateways[index] = { ...gateways[index], ...patch };
  savePaymentGateways(gateways);
  return gateways[index];
}

export function getActivePaymentGateways(): PaymentGateway[] {
  return getPaymentGateways().filter(g => g.isActive);
}
