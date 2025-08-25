// Format phone numbers like Telegram does
export const formatPhoneNumberLikeTelegram = (input: string, selectedCountry: any): string => {
  if (!input || !selectedCountry) return input;
  
  // Remove all non-digit characters except +
  const cleanInput = input.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it
  if (cleanInput.startsWith('+')) {
    return cleanInput;
  }
  
  // If it doesn't start with +, add the country code
  return `+${selectedCountry.dialCode}${cleanInput}`;
};
