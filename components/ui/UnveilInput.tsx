import React from 'react';
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
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full py-3 px-4 border rounded-lg text-base transition-colors duration-200',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
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

// OTP Input Component for verification codes
interface OTPInputProps extends Omit<BaseInputProps, 'onChange' | 'value' | 'maxLength'> {
  value: string;
  onChange: (value: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  error,
  className,
  disabled,
  placeholder = "123456",
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    onChange(inputValue);
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={6}
        className={cn(
          'w-full py-3 px-4 border rounded-lg text-base text-center font-mono tracking-widest transition-colors duration-200',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
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