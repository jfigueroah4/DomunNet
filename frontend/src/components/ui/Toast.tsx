'use client';

import React from "react";
import { Check, X as CloseIcon } from "lucide-react";
import { toast } from "sonner";

export interface ToastProps {
  id?: string | number;
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
}

export function Toast({ id, message, type = "success", onClose }: ToastProps) {
  const isSuccess = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "10px",
        width: "max-content",
        maxWidth: "none",
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.08), 0px 1px 4px rgba(0, 0, 0, 0.04)",
        border: "1px solid #F0F0F0",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
        fontSize: "12px",
        fontWeight: 400,
        color: "#1F1F1F",
        lineHeight: "1.4",
        whiteSpace: "nowrap",
      }}
    >
      {/* Ícono circular a la izquierda */}
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          backgroundColor: isSuccess ? "#52C41A" : "#FF4D4F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isSuccess ? (
          <Check size={11} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <CloseIcon size={11} color="#FFFFFF" strokeWidth={3} />
        )}
      </div>

      {/* Texto completo sin puntos suspensivos */}
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 400,
          fontSize: "12px",
          color: "#1F1F1F",
          whiteSpace: "nowrap",
        }}
      >
        {message}
      </span>

      {/* X de cierre a la derecha */}
      <button
        type="button"
        onClick={() => {
          if (onClose) {
            onClose();
          } else if (id !== undefined) {
            toast.dismiss(id);
          }
        }}
        aria-label="Cerrar notificación"
        style={{
          background: "none",
          border: "none",
          padding: "2px",
          margin: "0 0 0 4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8C8C8C",
          borderRadius: "4px",
          flexShrink: 0,
          transition: "color 0.15s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = "#1F1F1F";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = "#8C8C8C";
        }}
      >
        <CloseIcon size={13} />
      </button>
    </div>
  );
}

export function showSuccessToast(message: string) {
  toast.dismiss();
  return toast.custom(
    (id) => (
      <Toast
        id={id}
        message={message}
        type="success"
        onClose={() => toast.dismiss(id)}
      />
    ),
    {
      duration: 3500,
    }
  );
}

export function showErrorToast(message: string) {
  toast.dismiss();
  return toast.custom(
    (id) => (
      <Toast
        id={id}
        message={message}
        type="error"
        onClose={() => toast.dismiss(id)}
      />
    ),
    {
      duration: 3500,
    }
  );
}

