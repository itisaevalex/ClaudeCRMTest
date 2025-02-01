import { useMemo } from 'react';

const BASE_RATES = {
  'Home': 2.5,
  'Office': 3.5,
  'Move-out': 4.5
};

export const useBookingPrice = (area: number, dateTime: string, cleaningType: string) => {
  return useMemo(() => {
    if (!area || !dateTime) return 0;
    
    const baseRate = BASE_RATES[cleaningType as keyof typeof BASE_RATES] || BASE_RATES['Home'];
    let price = area * baseRate;
    
    return Math.round(price * 100) / 100;
  }, [area, dateTime, cleaningType]);
};