/**
 * Number formatting utilities for Spanish locale
 * Thousands separator: . (dot)
 * Decimal separator: , (comma)
 */

/**
 * Format number for display with Spanish locale
 * Always shows 2 decimals
 * Manually formats to ensure consistency across browsers
 */
export const formatSpanishNumber = (value: number): string => {
  // Handle edge cases
  if (value === null || value === undefined || isNaN(value)) {
    return '0,00';
  }

  // Convert to fixed 2 decimals
  const fixed = value.toFixed(2);
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = fixed.split('.');
  
  // Add dots for thousands separator manually
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Return with comma as decimal separator
  return `${withThousands},${decimalPart}`;
};

/**
 * Parse Spanish formatted string to number
 * Handles dots as thousands separator and comma as decimal
 */
export const parseSpanishNumber = (value: string): number => {
  if (!value) return 0;
  // Remove dots (thousands separator) and replace comma with dot (decimal)
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

/**
 * Format input value as user types
 * Adds dots for thousands and comma for decimals
 * Handles both integer and decimal input
 */
export const formatInputValue = (value: string): string => {
  if (!value) return '';
  
  // Remove all characters except digits and comma
  let cleaned = value.replace(/[^\d,]/g, '');
  
  // Only allow one comma
  const commaCount = (cleaned.match(/,/g) || []).length;
  if (commaCount > 1) {
    // Keep only the first comma
    const firstCommaIndex = cleaned.indexOf(',');
    cleaned = cleaned.substring(0, firstCommaIndex + 1) + cleaned.substring(firstCommaIndex + 1).replace(/,/g, '');
  }
  
  // Split by comma to handle integer and decimal parts
  const parts = cleaned.split(',');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add dots for thousands in integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Reconstruct with decimal part if exists
  if (decimalPart !== undefined) {
    return `${integerPart},${decimalPart.slice(0, 2)}`; // Limit to 2 decimals
  }
  
  return integerPart;
};

/**
 * Format value on blur (when user leaves input)
 * Ensures proper format with ,00 for integers
 */
export const formatOnBlur = (value: string): string => {
  if (!value) return '';
  
  const numValue = parseSpanishNumber(value);
  return formatSpanishNumber(numValue);
};
