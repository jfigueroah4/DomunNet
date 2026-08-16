import React from 'react';

interface LoginInputProps {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: boolean;
}

export default function LoginInput({
  icon,
  rightIcon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  error = false,
}: LoginInputProps) {
  return (
    <div className="relative">
      {/* Left Icon */}
      {icon && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center"
          style={{
            color: error ? '#FF4D4F' : 'rgba(255,255,255,0.6)',
            transition: 'color 0.25s ease'
          }}
        >
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
        style={{
          borderBottom: error ? '1.5px solid #FF4D4F' : '1px solid rgba(255, 255, 255, 0.4)',
          transition: 'border-bottom-color 0.25s ease, border-bottom-width 0.25s ease',
          paddingLeft: icon ? '26px' : '8px',
          paddingRight: rightIcon ? '36px' : '8px',
        }}
        className={`
          w-full h-[38px]
          bg-transparent
          text-white
          placeholder-white/40
          font-poppins text-[12px]
          outline-none
        `}
      />

      {/* Right Icon */}
      {rightIcon && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center p-1">
          {rightIcon}
        </div>
      )}
    </div>
  );
}
