import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export type ValidationStatus = 'idle' | 'success' | 'warning' | 'error';

interface ValidationMessageProps {
  status: ValidationStatus;
  message: string;
  show: boolean;
  onClose?: () => void;
}

export default function ValidationMessage({
  status,
  message,
  show,
  onClose,
}: ValidationMessageProps) {
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  if (!show) return null;

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-white',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-white',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-white',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
    idle: {
      icon: AlertCircle,
      bgColor: 'bg-white',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm animate-fadeIn`}
    >
      <Icon size={16} className={config.textColor} strokeWidth={2.5} />
      <span
        className={`font-poppins text-xs ${config.textColor} font-medium`}
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {message}
      </span>
    </div>
  );
}
