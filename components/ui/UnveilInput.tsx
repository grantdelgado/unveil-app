import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  className?: string;
}

// Base Text Input Component
export const TextInput: React.FC<BaseInputProps> = ({
  error,
  className,
  disabled,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <input
        className={cn(
          'w-full py-3 px-4 border rounded-lg text-base transition-colors duration-200',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
          // Prevent iOS zoom on input focus
          'text-[16px] md:text-base',
          error ? 'border-red-300' : 'border-gray-300',
          className,
        )}
        disabled={disabled}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Phone Number Input Component with Formatting
interface PhoneNumberInputProps extends Omit<BaseInputProps, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  error,
  className,
  disabled,
  placeholder = "(555) 123-4567",
  autoFocus,
  ...props
}) => {
  const formatPhoneNumber = (inputValue: string) => {
    // Remove all non-digits
    const cleaned = inputValue.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length >= 10) {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }

    // For shorter numbers, progressive formatting
    if (cleaned.length >= 6) {
      const match = cleaned.match(/^(\d{3})(\d{0,3})(\d{0,4})/);
      if (match) {
        let formatted = `(${match[1]})`;
        if (match[2]) formatted += ` ${match[2]}`;
        if (match[3]) formatted += `-${match[3]}`;
        return formatted;
      }
    }

    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full py-3 px-4 border rounded-lg transition-colors duration-200',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
          // Prevent iOS zoom and ensure touch-friendly size
          'text-[16px] md:text-base min-h-[44px]',
          error ? 'border-red-300' : 'border-gray-300',
          className,
        )}
        disabled={disabled}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Enhanced OTP Input Component with auto-focus and auto-submit
interface OTPInputProps extends Omit<BaseInputProps, 'onChange' | 'value' | 'maxLength'> {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void; // Called when 6 digits entered
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  onComplete,
  error,
  className,
  disabled,
  placeholder = "123456",
  autoFocus = true,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when component mounts or when switching to OTP step
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    onChange(inputValue);
    
    // Auto-submit when 6 digits are entered
    if (inputValue.length === 6 && onComplete) {
      // Small delay to ensure the input value is fully processed
      setTimeout(() => {
        onComplete(inputValue);
      }, 100);
    }
  };

  // Handle paste events for better UX
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      onChange(digits);
      if (digits.length === 6 && onComplete) {
        setTimeout(() => {
          onComplete(digits);
        }, 100);
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        maxLength={6}
        autoComplete="one-time-code"
        className={cn(
          'w-full py-4 px-4 border rounded-lg text-center font-mono tracking-widest transition-colors duration-200',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
          // Prevent iOS zoom and ensure touch-friendly size
          'text-[18px] md:text-lg min-h-[52px]',
          error ? 'border-red-300' : 'border-gray-300',
          className,
        )}
        disabled={disabled}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Display Names
TextInput.displayName = 'TextInput';
PhoneNumberInput.displayName = 'PhoneNumberInput';
OTPInput.displayName = 'OTPInput'; 