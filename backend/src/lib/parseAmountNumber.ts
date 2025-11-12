/**
 * Parse amount from various formats to a clean number
 * Handles: "1,000.50", "1.000,50", "1 000", "$100", etc.
 * 
 * @param value - Amount string or number
 * @returns Parsed number
 * @throws Error if value cannot be parsed to valid positive number
 */
export function parseAmountNumber(value: unknown): number {
  if (typeof value === 'number') {
    if (isNaN(value) || value <= 0) {
      throw new Error('Amount must be a positive number');
    }
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error('Amount must be a number or string');
  }

  // Remove currency symbols, spaces, and separators
  // Keep only digits, dots, and minus sign
  let cleaned = value.trim()
    .replace(/[$€£¥₫]/g, '')  // Remove currency symbols
    .replace(/\s+/g, '')       // Remove spaces
    .replace(/,/g, '');        // Remove commas (assuming US/standard format)

  // Handle European format (1.000,50) by checking if last comma is decimal separator
  if (/\.\d{3}/.test(cleaned) && /,\d{1,2}$/.test(value)) {
    cleaned = value.replace(/\./g, '').replace(',', '.');
  }

  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    throw new Error(`Invalid amount format: "${value}"`);
  }

  if (num <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  return num;
}

/**
 * Parse date from various formats
 * 
 * @param value - Date string
 * @param format - Expected format hint
 * @returns ISO date string (YYYY-MM-DD)
 */
export function parseDateString(value: string, format?: string): string {
  if (!value || value.trim() === '') {
    throw new Error('Date is required');
  }

  const trimmed = value.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return trimmed;
    }
  }

  // Handle DD/MM/YYYY
  if (format === 'DD/MM/YYYY' || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(iso);
    if (!isNaN(date.getTime())) {
      return iso;
    }
  }

  // Handle MM/DD/YYYY
  if (format === 'MM/DD/YYYY' || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split('/');
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(iso);
    if (!isNaN(date.getTime())) {
      return iso;
    }
  }

  // Fallback: try native Date parsing
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  throw new Error(`Invalid date format: "${value}"`);
}
