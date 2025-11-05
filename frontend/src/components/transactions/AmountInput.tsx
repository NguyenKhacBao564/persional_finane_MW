import { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  value?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * AmountInput - Formatted VND input with thousand separators.
 * Displays formatted value while maintaining numeric value for form state.
 * Blocks negative values and enforces positive numbers only.
 */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value = 0, onChange, onBlur, disabled, placeholder, className }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    // Format number with thousand separators
    const formatNumber = (num: number): string => {
      if (num === 0) return '';
      return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 0,
      }).format(num);
    };

    // Parse formatted string to number
    const parseNumber = (str: string): number => {
      const cleaned = str.replace(/[^\d]/g, '');
      return cleaned === '' ? 0 : parseInt(cleaned, 10);
    };

    // Sync display value with prop value
    useEffect(() => {
      setDisplayValue(formatNumber(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const numericValue = parseNumber(input);

      // Update display with formatted value
      setDisplayValue(formatNumber(numericValue));

      // Notify parent of numeric value
      if (onChange) {
        onChange(numericValue);
      }
    };

    const handleBlur = () => {
      // Reformat on blur to ensure consistency
      setDisplayValue(formatNumber(value));
      if (onBlur) {
        onBlur();
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder || '0'}
          className={cn('text-right pr-12', className)}
          autoComplete="off"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          VND
        </span>
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';
