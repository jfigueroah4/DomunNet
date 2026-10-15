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
  const isLong = (message || "").length > 65;

  return (
    <div
      className="custom-toast"
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: isLong ? "flex-start" : "center",
        justifyContent: "flex-start",
        gap: "10px",
        width: isLong ? "min(580px, calc(100vw - 32px))" : "max-content",
        maxWidth: "min(580px, calc(100vw - 32px))",
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        padding: isLong ? "10px 14px" : "8px 12px",
        boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.09), 0px 2px 6px rgba(0, 0, 0, 0.04)",
        border: "1px solid #EBEBEB",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
        fontSize: "12px",
        fontWeight: 400,
        color: "#1F1F1F",
        lineHeight: "1.45",
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
          marginTop: isLong ? "1px" : "0",
        }}
      >
        {isSuccess ? (
          <Check size={11} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <CloseIcon size={11} color="#FFFFFF" strokeWidth={3} />
        )}
      </div>

      {/* Texto completo con wrap y espaciado compacto */}
      <span
        style={{
          flex: 1,
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 400,
          fontSize: "12px",
          color: "#1F1F1F",
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          letterSpacing: "-0.01em",
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
          marginTop: isLong ? "1px" : "0",
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

const calcularDuracionToast = (mensaje: string): number => {
  const len = (mensaje || "").length;
  if (len > 140) return 10000; // 10s para mensajes largos con listas
  if (len > 70) return 7500;   // 7.5s para mensajes medianos
  return 5000;                 // 5s para mensajes estándar
};

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
      duration: calcularDuracionToast(message),
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
      duration: calcularDuracionToast(message),
    }
  );
}

export function showInfoToast(message: string) {
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
      duration: calcularDuracionToast(message),
    }
  );
}
