'use client';

// Card brand detection regex patterns
export const CARD_PATTERNS = {
  visa: /^4[0-9]{0,}$/,
  mastercard: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)[0-9]{0,}$/,
  amex: /^3[47][0-9]{0,}$/,
  discover: /^(6011|65|64[4-9]|622)[0-9]{0,}$/,
  diners: /^(36|38|30[0-5])[0-9]{0,}$/,
  jcb: /^35[0-9]{0,}$/,
  unionpay: /^62[0-9]{0,}$/,
} as const;

export type CardBrand = keyof typeof CARD_PATTERNS | 'unknown';

export interface CardInfo {
  brand: CardBrand;
  brandName: string;
  isValid: boolean;
  maxLength: number;
  cvvLength: number;
  icon: string;
  color: string;
}

export interface CardValidation {
  isValid: boolean;
  cardInfo: CardInfo;
  errors: {
    number?: string;
    expiry?: string;
    cvv?: string;
    name?: string;
  };
}

export interface MobileMoneyValidation {
  isValid: boolean;
  errors: {
    phoneNumber?: string;
    provider?: string;
  };
}

// Card brand information
export const CARD_INFO: Record<CardBrand, Omit<CardInfo, 'isValid'>> = {
  visa: {
    brand: 'visa',
    brandName: 'Visa',
    maxLength: 19,
    cvvLength: 3,
    icon: '💳',
    color: 'text-blue-600',
  },
  mastercard: {
    brand: 'mastercard',
    brandName: 'Mastercard',
    maxLength: 16,
    cvvLength: 3,
    icon: '💳',
    color: 'text-orange-600',
  },
  amex: {
    brand: 'amex',
    brandName: 'American Express',
    maxLength: 15,
    cvvLength: 4,
    icon: '💳',
    color: 'text-blue-500',
  },
  discover: {
    brand: 'discover',
    brandName: 'Discover',
    maxLength: 16,
    cvvLength: 3,
    icon: '💳',
    color: 'text-orange-500',
  },
  diners: {
    brand: 'diners',
    brandName: 'Diners Club',
    maxLength: 14,
    cvvLength: 3,
    icon: '💳',
    color: 'text-gray-600',
  },
  jcb: {
    brand: 'jcb',
    brandName: 'JCB',
    maxLength: 16,
    cvvLength: 3,
    icon: '💳',
    color: 'text-green-600',
  },
  unionpay: {
    brand: 'unionpay',
    brandName: 'UnionPay',
    maxLength: 19,
    cvvLength: 3,
    icon: '💳',
    color: 'text-red-600',
  },
  unknown: {
    brand: 'unknown',
    brandName: 'Card',
    maxLength: 19,
    cvvLength: 3,
    icon: '💳',
    color: 'text-gray-500',
  },
};

// Detect card brand from number
export function detectCardBrand(cardNumber: string): CardBrand {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  for (const [brand, pattern] of Object.entries(CARD_PATTERNS)) {
    if (pattern.test(cleanNumber)) {
      return brand as CardBrand;
    }
  }
  
  return 'unknown';
}

// Luhn algorithm for card number validation
export function luhnCheck(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleanNumber)) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Format card number with spaces
export function formatCardNumber(value: string, brand: CardBrand): string {
  const cleanValue = value.replace(/\D/g, '');
  const maxLength = CARD_INFO[brand].maxLength;
  const truncated = cleanValue.slice(0, maxLength);
  
  // AMEX: 4-6-5 format
  if (brand === 'amex') {
    const parts = truncated.match(/^(\d{0,4})(\d{0,6})(\d{0,5})$/);
    if (parts) {
      return [parts[1], parts[2], parts[3]].filter(Boolean).join(' ');
    }
  }
  
  // Other cards: 4-4-4-4 format
  const parts = truncated.match(/.{1,4}/g);
  return parts ? parts.join(' ') : truncated;
}

// Validate expiry date
export function validateExpiry(expiry: string): { isValid: boolean; error?: string } {
  const cleanExpiry = expiry.replace(/\D/g, '');
  
  if (cleanExpiry.length < 4) {
    return { isValid: false, error: 'Enter a valid expiry date (MM/YY)' };
  }
  
  const month = parseInt(cleanExpiry.slice(0, 2), 10);
  const year = parseInt(cleanExpiry.slice(2, 4), 10);
  
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month' };
  }
  
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, error: 'Card has expired' };
  }
  
  if (year > currentYear + 20) {
    return { isValid: false, error: 'Invalid expiry year' };
  }
  
  return { isValid: true };
}

// Format expiry input
export function formatExpiry(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length >= 2) {
    return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
  }
  
  return cleanValue;
}

// Validate CVV
export function validateCVV(cvv: string, brand: CardBrand): { isValid: boolean; error?: string } {
  const cleanCVV = cvv.replace(/\D/g, '');
  const expectedLength = CARD_INFO[brand].cvvLength;
  
  if (cleanCVV.length !== expectedLength) {
    return { isValid: false, error: `CVV must be ${expectedLength} digits` };
  }
  
  return { isValid: true };
}

// Validate cardholder name
export function validateCardholderName(name: string): { isValid: boolean; error?: string } {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Enter the name on your card' };
  }
  
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  if (trimmedName.split(/\s+/).length < 2) {
    return { isValid: false, error: 'Enter your full name as shown on card' };
  }
  
  return { isValid: true };
}

// Full card validation
export function validateCard(
  cardNumber: string,
  expiry: string,
  cvv: string,
  name: string
): CardValidation {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  const brand = detectCardBrand(cleanNumber);
  const cardInfo = { ...CARD_INFO[brand], isValid: false };
  const errors: CardValidation['errors'] = {};
  
  // Validate card number
  if (!cleanNumber) {
    errors.number = 'Enter your card number';
  } else if (!luhnCheck(cleanNumber)) {
    errors.number = 'Invalid card number';
  } else if (cleanNumber.length < 13) {
    errors.number = 'Card number is too short';
  }
  
  // Validate expiry
  const expiryResult = validateExpiry(expiry);
  if (!expiryResult.isValid) {
    errors.expiry = expiryResult.error;
  }
  
  // Validate CVV
  const cvvResult = validateCVV(cvv, brand);
  if (!cvvResult.isValid) {
    errors.cvv = cvvResult.error;
  }
  
  // Validate name
  const nameResult = validateCardholderName(name);
  if (!nameResult.isValid) {
    errors.name = nameResult.error;
  }
  
  const isValid = Object.keys(errors).length === 0;
  cardInfo.isValid = isValid;
  
  return { isValid, cardInfo, errors };
}

// Mobile money phone number validation by country
export const PHONE_PATTERNS: Record<string, { pattern: RegExp; format: string; countryCode: string }> = {
  KE: { pattern: /^(?:254|\+254|0)?([17]\d{8})$/, format: '7XX XXX XXX', countryCode: '+254' },
  TZ: { pattern: /^(?:255|\+255|0)?([67]\d{8})$/, format: '6XX XXX XXX', countryCode: '+255' },
  UG: { pattern: /^(?:256|\+256|0)?([37]\d{8})$/, format: '7XX XXX XXX', countryCode: '+256' },
  GH: { pattern: /^(?:233|\+233|0)?([235]\d{8})$/, format: '2X XXX XXXX', countryCode: '+233' },
  NG: { pattern: /^(?:234|\+234|0)?([789]\d{9})$/, format: '8XX XXX XXXX', countryCode: '+234' },
  RW: { pattern: /^(?:250|\+250|0)?([78]\d{8})$/, format: '7X XXX XXXX', countryCode: '+250' },
  ZA: { pattern: /^(?:27|\+27|0)?([6-8]\d{8})$/, format: '6X XXX XXXX', countryCode: '+27' },
};

// Validate mobile money phone number
export function validateMobileNumber(
  phoneNumber: string,
  countryCode: string
): { isValid: boolean; formattedNumber: string; error?: string } {
  const phonePattern = PHONE_PATTERNS[countryCode];
  
  if (!phonePattern) {
    return { isValid: false, formattedNumber: '', error: 'Unsupported country' };
  }
  
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  const match = cleanNumber.match(phonePattern.pattern);
  
  if (!match) {
    return { 
      isValid: false, 
      formattedNumber: '', 
      error: `Invalid phone number format. Expected: ${phonePattern.format}` 
    };
  }
  
  const nationalNumber = match[1];
  const formattedNumber = `${phonePattern.countryCode}${nationalNumber}`;
  
  return { isValid: true, formattedNumber };
}

// Mobile money provider validation
export function validateMobileMoneyProvider(
  provider: string,
  countryCode: string
): { isValid: boolean; error?: string } {
  const providersByCountry: Record<string, string[]> = {
    KE: ['mpesa'],
    TZ: ['mpesa', 'tigo_pesa', 'airtel_money'],
    UG: ['mtn_momo', 'airtel_money'],
    GH: ['mtn_momo', 'airtel_money'],
    NG: ['mtn_momo'],
    RW: ['mtn_momo', 'airtel_money'],
    CI: ['orange_money', 'mtn_momo'],
    SN: ['orange_money'],
    CM: ['mtn_momo', 'orange_money'],
  };
  
  const validProviders = providersByCountry[countryCode] || [];
  
  if (!validProviders.includes(provider)) {
    return { isValid: false, error: 'Provider not available in your country' };
  }
  
  return { isValid: true };
}

// Full mobile money validation
export function validateMobileMoney(
  phoneNumber: string,
  countryCode: string,
  provider: string
): MobileMoneyValidation {
  const errors: MobileMoneyValidation['errors'] = {};
  
  const phoneResult = validateMobileNumber(phoneNumber, countryCode);
  if (!phoneResult.isValid) {
    errors.phoneNumber = phoneResult.error;
  }
  
  const providerResult = validateMobileMoneyProvider(provider, countryCode);
  if (!providerResult.isValid) {
    errors.provider = providerResult.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Simulate M-Pesa STK Push
export async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  reference: string
): Promise<{ success: boolean; checkoutRequestId?: string; error?: string }> {
  // In production, this would call the Safaricom Daraja API
  // For now, we simulate the STK push
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate success rate
  const success = Math.random() > 0.1;
  
  if (success) {
    return {
      success: true,
      checkoutRequestId: `ws_CO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
  
  return {
    success: false,
    error: 'Failed to initiate payment. Please try again.',
  };
}

// Simulate M-Pesa payment status check
export async function checkMpesaPaymentStatus(
  checkoutRequestId: string
): Promise<{ status: 'pending' | 'completed' | 'failed' | 'cancelled'; message?: string }> {
  // In production, this would query the Safaricom API for transaction status
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate different outcomes
  const random = Math.random();
  
  if (random < 0.7) {
    return { status: 'completed', message: 'Payment received successfully' };
  } else if (random < 0.85) {
    return { status: 'pending', message: 'Waiting for customer to complete payment' };
  } else if (random < 0.95) {
    return { status: 'cancelled', message: 'Customer cancelled the transaction' };
  }
  
  return { status: 'failed', message: 'Transaction failed. Please try again.' };
}

// Simulate card payment processing
export async function processCardPayment(
  cardNumber: string,
  expiry: string,
  cvv: string,
  name: string,
  amount: number,
  currency: string
): Promise<{ success: boolean; transactionId?: string; error?: string; requiresAuth?: boolean }> {
  // In production, this would integrate with Stripe, Paystack, Flutterwave, etc.
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Validate card first
  const validation = validateCard(cardNumber, expiry, cvv, name);
  
  if (!validation.isValid) {
    return {
      success: false,
      error: Object.values(validation.errors)[0] || 'Invalid card details',
    };
  }
  
  // Simulate 3D Secure requirement for certain cards
  const cleanNumber = cardNumber.replace(/\s/g, '');
  const requires3DS = cleanNumber.startsWith('4000') || cleanNumber.startsWith('5200');
  
  if (requires3DS) {
    return {
      success: false,
      requiresAuth: true,
      error: '3D Secure authentication required',
    };
  }
  
  // Simulate success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
  
  // Simulate different decline reasons
  const declineReasons = [
    'Card declined by issuer',
    'Insufficient funds',
    'Transaction limit exceeded',
    'Card reported lost or stolen',
  ];
  
  return {
    success: false,
    error: declineReasons[Math.floor(Math.random() * declineReasons.length)],
  };
}

// Format amount for display with currency
export function formatAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

// Get currency by country
export function getCurrencyByCountry(countryCode: string): string {
  const currencies: Record<string, string> = {
    KE: 'TSH',
    TZ: 'TZS',
    UG: 'UGX',
    GH: 'GHS',
    NG: 'NGN',
    RW: 'RWF',
    ZA: 'ZAR',
    US: 'USD',
    GB: 'GBP',
    EU: 'EUR',
  };
  
  return currencies[countryCode] || 'USD';
}

