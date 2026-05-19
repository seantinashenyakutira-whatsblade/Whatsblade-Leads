const RATES_TO_ZMW: Record<string, number> = {
  ZMW: 1,
  USD: 27.5,
  EUR: 29.8,
  GBP: 34.5,
  ZAR: 1.45,
  NGN: 0.017,
  KES: 0.21,
  GHS: 1.75,
  BWP: 2.0,
  MZN: 0.43,
  TZS: 0.011,
  UGX: 0.0074,
  RWF: 0.02,
  ETB: 0.48,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZMW: 'K',
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  BWP: 'P',
  MZN: 'MT',
  TZS: 'TSh',
  UGX: 'USh',
  RWF: 'FRw',
  ETB: 'Br',
};

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = RATES_TO_ZMW[fromCurrency] || 1;
  const toRate = RATES_TO_ZMW[toCurrency] || 1;

  const amountInZMW = amount * fromRate;
  return amountInZMW / toRate;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function formatPrice(amount: number, fromCurrency: string, toCurrency: string): string {
  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  return formatCurrency(converted, toCurrency);
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function detectCurrencyByCountry(countryCode: string): string {
  const countryCurrencyMap: Record<string, string> = {
    ZM: 'ZMW',
    US: 'USD',
    GB: 'GBP',
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    ZA: 'ZAR',
    NG: 'NGN',
    KE: 'KES',
    GH: 'GHS',
    BW: 'BWP',
    MZ: 'MZN',
    TZ: 'TZS',
    UG: 'UGX',
    RW: 'RWF',
    ET: 'ETB',
  };
  return countryCurrencyMap[countryCode?.toUpperCase()] || 'USD';
}
