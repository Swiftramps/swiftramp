export const flags: Record<string, string> = {
  NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', ZAR: '🇿🇦', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧',
}

export const names: Record<string, string> = {
  NGN: 'Nigerian naira', KES: 'Kenyan shilling', GHS: 'Ghanaian cedi',
  ZAR: 'South African rand', USD: 'US dollar', EUR: 'Euro', GBP: 'British pound',
}

export const ccyList = ['NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR', 'GBP'] as const

export type Currency = (typeof ccyList)[number]
