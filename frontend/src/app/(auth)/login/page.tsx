"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, Mail, Phone } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/components/ui/Toast";

/**
 * Modal Soporte Técnico — Solo información, SIN enlaces clickeables
 */
function SoporteTecnicoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.3s ease",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#0a0a0a",
            borderRadius: "12px",
            padding: "32px 24px",
            maxWidth: "420px",
            width: "90%",
            boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.3)",
            position: "relative",
            animation: "slideUp 0.3s ease",
          }}
        >
          {/* Botón cerrar X */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255, 255, 255, 0.6)",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
            }}
          >
            ✕
          </button>

          {/* Logo Circular */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#9B0F06",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: "3px solid rgba(155, 15, 6, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              ?
            </span>
          </div>

          {/* Título */}
          <h2
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#FFFFFF",
              margin: "0 0 4px 0",
              textAlign: "center",
            }}
          >
            Soporte Técnico
          </h2>

          {/* Subtítulo */}
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "11px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.6)",
              margin: "0 0 16px 0",
              textAlign: "center",
            }}
          >
            Universidad Mariano Gálvez de Guatemala
          </p>

          {/* Descripción */}
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: "1.5",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Para asistencia con tu cuenta o contraseña, comunícate con el
            equipo de soporte:
          </p>

          {/* Información de contacto — SOLO TEXTO, SIN ENLACES */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            {/* Email */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "rgba(255, 255, 255, 0.9)",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "13px",
                fontWeight: 400,
              }}
            >
              <Mail size={18} style={{ color: "#9B0F06", flexShrink: 0 }} />
              <span>josuedanielf2002@gmail.com</span>
            </div>

            {/* Teléfono */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "rgba(255, 255, 255, 0.9)",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "13px",
                fontWeight: 400,
              }}
            >
              <Phone size={18} style={{ color: "#9B0F06", flexShrink: 0 }} />
              <span>+502 5625-2922</span>
            </div>
          </div>

          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              height: "40px",
              backgroundColor: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "8px",
              color: "white",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(155, 15, 6, 0.2)";
              e.currentTarget.style.borderColor = "rgba(155, 15, 6, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/**
 * Página de Login — DomunNet
 * ✓ Toast flotante centrado
 * ✓ Modal Soporte sin enlaces
 * ✓ Validación de campos vacíos
 */
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSoporteModalOpen, setIsSoporteModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailEmpty = !email.trim();
    const isPasswordEmpty = !password.trim();

    setEmailError(isEmailEmpty);
    setPasswordError(isPasswordEmpty);

    if (isEmailEmpty || isPasswordEmpty) {
      showErrorToast("Ingresa tu correo/usuario y contraseña para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identificador: email.trim(),
          contrasena: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmailError(false);
        setPasswordError(false);
        showSuccessToast("¡Sesión iniciada correctamente!");
        setTimeout(() => router.push("/dashboard"), 500);
      } else {
        setEmailError(true);
        setPasswordError(true);
        showErrorToast(
          "Credenciales incorrectas. Verifica tu usuario y contraseña."
        );
      }
    } catch (error) {
      console.error("Error en login:", error);
      setEmailError(true);
      setPasswordError(true);
      showErrorToast("Error al conectar. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2d1a1a 0%, #3d0f0f 50%, #2d1a1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: "white",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          <span style={{ fontSize: "28px", fontWeight: "bold", color: "#2d1a1a" }}>
            D
          </span>
        </div>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "white",
            margin: "0 0 8px 0",
            textAlign: "center",
          }}
        >
          Bienvenido a DOMUN
        </h1>

        <p
          style={{
            fontSize: "13px",
            fontWeight: 400,
            color: "rgba(255, 255, 255, 0.7)",
            margin: "0 0 24px 0",
            textAlign: "center",
          }}
        >
          Gestión inteligente de transporte
        </p>

        {/* Formulario */}
        <form
          onSubmit={handleLogin}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Email */}
          <div style={{ position: "relative", marginBottom: "4px" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                color: emailError ? "#FF4D4F" : "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                transition: "color 0.25s ease",
                zIndex: 1,
              }}
            >
              <User size={16} strokeWidth={2} />
            </div>

            <input
              type="text"
              placeholder="Correo o Usuario"
              value={email}
              onChange={handleEmailChange}
              autoComplete="username"
              style={{
                width: "100%",
                height: "42px",
                background: "transparent",
                border: "none",
                borderBottom: emailError
                  ? "1.5px solid #FF4D4F"
                  : "1px solid rgba(255,255,255,0.4)",
                color: "white",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "13px",
                paddingLeft: "32px",
                paddingRight: "12px",
                boxSizing: "border-box",
                transition: "border-bottom-color 0.25s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                if (!emailError) {
                  e.target.style.borderBottomColor = "rgba(255,255,255,0.6)";
                }
              }}
              onBlur={(e) => {
                if (!emailError) {
                  e.target.style.borderBottomColor = "rgba(255,255,255,0.4)";
                }
              }}
            />
          </div>

          {/* Contraseña */}
          <div style={{ position: "relative", marginBottom: "4px" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                color: passwordError ? "#FF4D4F" : "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                transition: "color 0.25s ease",
                zIndex: 1,
              }}
            >
              <Lock size={16} strokeWidth={2} />
            </div>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
              style={{
                width: "100%",
                height: "42px",
                background: "transparent",
                border: "none",
                borderBottom: passwordError
                  ? "1.5px solid #FF4D4F"
                  : "1px solid rgba(255,255,255,0.4)",
                color: "white",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "13px",
                paddingLeft: "32px",
                paddingRight: "40px",
                boxSizing: "border-box",
                transition: "border-bottom-color 0.25s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                if (!passwordError) {
                  e.target.style.borderBottomColor = "rgba(255,255,255,0.6)";
                }
              }}
              onBlur={(e) => {
                if (!passwordError) {
                  e.target.style.borderBottomColor = "rgba(255,255,255,0.4)";
                }
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "0",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: passwordError ? "#FF4D4F" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "4px",
                transition: "color 0.25s ease",
              }}
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={2} />
              ) : (
                <Eye size={16} strokeWidth={2} />
              )}
            </button>
          </div>

          {/* Opciones */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
              marginBottom: "20px",
              fontSize: "12px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{
                  cursor: "pointer",
                  width: "14px",
                  height: "14px",
                  accentColor: "#FF4D4F",
                }}
              />
              Recuérdame
            </label>

            <a
              href="#"
              style={{
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: isLoading ? "rgba(255, 77, 79, 0.6)" : "#FF4D4F",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "#E63C3E";
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "#FF4D4F";
              }
            }}
          >
            {isLoading ? "Conectando..." : "Iniciar sesión"}
          </button>
        </form>

        {/* Link Soporte */}
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          ¿Necesitas ayuda?{" "}
          <button
            type="button"
            onClick={() => setIsSoporteModalOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "#FF4D4F",
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "12px",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#E63C3E";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "#FF4D4F";
            }}
          >
            Contactar soporte
          </button>
        </div>
      </div>

      {/* Modal */}
      <SoporteTecnicoModal
        isOpen={isSoporteModalOpen}
        onClose={() => setIsSoporteModalOpen(false)}
      />
    </div>
  );
}
