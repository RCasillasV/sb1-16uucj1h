import { differenceInMonths, differenceInYears, differenceInDays } from 'date-fns';

export function calculateAge(birthDate: string | Date) {
  const birth = new Date(birthDate);
  const today = new Date();
  
  const years = differenceInYears(today, birth);
  const months = differenceInMonths(today, birth) % 12;

  let formatted: string;
  if (years === 0) {
    if (months === 0) {
      const days = differenceInDays(today, birth);
      formatted = `${days} días`;
    } else {
      formatted = `${months} meses`;
    }
  } else if (years === 1) {
    formatted = months === 0 
      ? '1 año'
      : `1 año y ${months} meses`;
  } else if (years < 5) {
    formatted = months === 0
      ? `${years} años`
      : `${years} años y ${months} meses`;
  } else {
    formatted = `${years} años`;
  }

  return {
    years,
    months,
    formatted
  };
}