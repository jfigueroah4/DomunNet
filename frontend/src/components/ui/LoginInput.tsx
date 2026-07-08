import React from 'react';

interface LoginInputProps {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export default function LoginInput({
  icon,
  rightIcon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
}: LoginInputProps) {
  return (
    <div className="relative">
      {/* Left Icon */}
      {icon && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 text-white/70 pointer-events-none">
          {icon}
        </div>
      )}

      {/* Input */}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full h-[44px]
          bg-transparent
          border-b-2 border-white/50
          text-white
          placeholder-white/50
          font-poppins text-xs
          outline-none
          transition-all duration-300
          hover:border-white/70
          focus:border-red-400 focus:shadow-lg focus:shadow-red-500/20
          ${icon ? 'pl-12' : 'pl-4'}
          ${rightIcon ? 'pr-12' : 'pr-4'}
        `}
      />

      {/* Right Icon */}
      {rightIcon && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-4">
          {rightIcon}
        </div>
      )}
    </div>
  );
}
