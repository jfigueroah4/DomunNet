'use client';
import { toast } from 'sonner';
import { X, Check } from 'lucide-react';
import React from 'react';

export const showErrorToast = (message: string) => {
  toast.dismiss();
  toast.custom(
    (t) => (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: '8px',
        padding: '8px 12px',
        fontFamily: "'Poppins', sans-serif",
        fontSize: '12px',
        color: '#1F1F1F',
        width: 'max-content',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FF4D4F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <X size={11} color="#FFFFFF" strokeWidth={3} />
        </div>
        <span>{message}</span>
        <button type="button" onClick={() => toast.dismiss(t as unknown as number)} style={{ marginLeft: '4px', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
          <X size={14} color="#999" />
        </button>
      </div>
    ),
    { duration: 3500, position: 'top-center' }
  );
};

export const showSuccessToast = (message: string) => {
  toast.dismiss();
  toast.custom(
    (t) => (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: '8px',
        padding: '8px 12px',
        fontFamily: "'Poppins', sans-serif",
        fontSize: '12px',
        color: '#1F1F1F',
        width: 'max-content',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#52C41A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={11} color="#FFFFFF" strokeWidth={3} />
        </div>
        <span>{message}</span>
        <button type="button" onClick={() => toast.dismiss(t as unknown as number)} style={{ marginLeft: '4px', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
          <X size={14} color="#999" />
        </button>
      </div>
    ),
    { duration: 3500, position: 'top-center' }
  );
};
