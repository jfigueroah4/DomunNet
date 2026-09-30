'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Maximize2,
  Minimize2,
  Bot,
  UserCheck,
  Minus,
  ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRoleSuggestions = (userRole?: string) => {
  const roleLower = (userRole || '').toLowerCase();

  if (roleLower.includes('admin') || roleLower.includes('director') || roleLower.includes('gerente')) {
    return {
      roleTitle: userRole || 'Administrador',
      title: 'Consultas sugeridas sobre módulos:',
      items: [
        { label: 'Resumen de proyectos', query: 'Generar un resumen ejecutivo de los proyectos activos' },
        { label: 'Incidentes críticos', query: 'Listar incidentes críticos abiertos en obra' },
        { label: 'Estado presupuestario', query: 'Status general de presupuestos y ejecución' },
        { label: 'Usuarios del sistema', query: 'Resumen de usuarios y roles activos' },
      ]
    };
  }

  if (roleLower.includes('supervis') || roleLower.includes('resident') || roleLower.includes('ingenier')) {
    return {
      roleTitle: userRole || 'Supervisor / Residente',
      title: 'Consultas sugeridas sobre módulos:',
      items: [
        { label: 'Bitácoras de hoy', query: 'Bitácoras pendientes de validación hoy' },
        { label: 'Avance de obra', query: 'Avance físico vs planificado del proyecto' },
        { label: 'Fotos de inspección', query: 'Fotos de inspección de campo recientes' },
        { label: 'Renglones en curso', query: 'Renglones de trabajo en ejecución' },
      ]
    };
  }

  return {
    roleTitle: userRole || 'Usuario DomunNet',
    title: 'Consultas sugeridas sobre módulos:',
    items: [
      { label: 'Proyectos activos', query: 'Tabla de proyectos activos' },
      { label: 'Estado de bitácora', query: 'Estadísticas generales de bitácora' },
      { label: 'Incidentes abiertos', query: 'Mostrar incidentes abiertos' },
      { label: 'Galería de fotos', query: 'Ver fotos recientes de obras' },
    ]
  };
};

function FormattedMessage({ content }: { content: string }) {
  if (!content) return null;

  const rawLines = content.split('\n');

  return (
    <div className="space-y-1 text-xs leading-relaxed">
      {rawLines.map((line, lineIdx) => {
        let cleanLine = line.trim();

        // Limpiar encabezados Markdown tipo ## o ###
        cleanLine = cleanLine.replace(/^#{1,6}\s+/, '');

        // Detectar elementos de lista con guión o asterisco
        const isBullet = cleanLine.startsWith('- ') || cleanLine.startsWith('* ');
        if (isBullet) {
          cleanLine = cleanLine.substring(2).trim();
        }

        // Parsear **negritas** o __negritas__
        const parts = cleanLine.split(/(\*\*.*?\*\*|__.*?__)/g);

        const parsedElements = parts.map((part, partIdx) => {
          if (
            (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
            (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
          ) {
            return (
              <strong key={partIdx} className="font-bold text-slate-900">
                {part.substring(2, part.length - 2)}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-0.5">
              <span className="text-[#78350F] font-bold text-[11px] select-none leading-none mt-1">•</span>
              <div className="flex-1">{parsedElements}</div>
            </div>
          );
        }

        if (!cleanLine) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        return <div key={lineIdx}>{parsedElements}</div>;
      })}
    </div>
  );
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const { profile } = useAuthStore();
  const primerNombre = profile?.primerNombre || (profile?.nombre ? profile.nombre.trim().split(' ')[0] : '') || profile?.username || '';
  const userRole = profile?.rol || profile?.cargo || '';

  const roleData = useMemo(() => getRoleSuggestions(userRole), [userRole]);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar saludo personalizado cuando carga la información del perfil o se abre el chat
  useEffect(() => {
    const nombreGreeting = primerNombre ? `Hola, ${primerNombre}.` : 'Hola.';
    const rolText = roleData.roleTitle ? ` (${roleData.roleTitle})` : '';
    const initialText = `${nombreGreeting} Soy tu asistente de DomunNet${rolText}. Puedo ayudarte con consultas de proyectos, bitácora, reportes y supervisión.`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => {
      if (prev.length === 0) {
        return [{ role: 'assistant', content: initialText, timestamp: time }];
      }
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ ...prev[0], content: initialText }];
      }
      return prev;
    });
  }, [primerNombre, roleData.roleTitle]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }
    const timeout = window.setTimeout(() => setShouldRender(false), 260);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMessages = [...messages, { role: 'user' as const, content: query, timestamp: time }];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Llamada al endpoint API proxy de Next.js
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFirstName: primerNombre,
          userRole: userRole,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error al llamar a /api/chat:', err);
    }

    // Respuesta local de respaldo si la red falla
    setTimeout(() => {
      const greeting = primerNombre ? `Hola, ${primerNombre}. ` : '';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `${greeting}He procesado tu consulta: "${query}".`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsLoading(false);
    }, 600);
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Fondo semitransparente SOLO cuando la ventana está expandida */}
      {isExpanded && (
        <div
          className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Ventana Emergente de Chat acoplada al borde inferior en desktop y flotante sobre nav en mobile */}
      <div
        className={`fixed z-[1000] md:z-50 bg-white shadow-2xl border border-[#E8DEC8] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          isExpanded
            ? 'inset-4 sm:inset-8 md:inset-12 rounded-2xl'
            : isMinimized
            ? 'bottom-[62px] md:bottom-0 right-3 sm:right-6 md:right-8 w-auto sm:w-[320px] h-12 rounded-xl md:rounded-t-xl md:rounded-b-none shadow-lg'
            : 'bottom-[62px] md:bottom-0 right-3 left-3 sm:left-auto sm:right-6 md:right-8 w-auto sm:w-[390px] md:w-[410px] h-[500px] max-h-[calc(100vh-130px)] md:max-h-[calc(100vh-80px)] rounded-2xl md:rounded-t-2xl md:rounded-b-none'
        } ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95 pointer-events-none'}`}
      >
        {/* Encabezado del Chat: Única sección en tono beige */}
        <div
          className="flex items-center justify-between border-b border-[#E8DEC8] bg-[#F5EFEB] text-[#2C241E] px-4 py-2.5 select-none cursor-pointer"
          onClick={() => {
            if (isMinimized) setIsMinimized(false);
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center text-[#78350F]">
              <Bot size={19} className="text-[#78350F] translate-y-[1px]" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-wide text-[#78350F]">DomunBot AI</h2>
              {!isMinimized && (
                <p className="text-[10px] text-[#8C7A6B]">Asistente Virtual • DomunNet</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {/* Botón Minimizar / Restaurar */}
            <button
              onClick={() => {
                setIsMinimized((prev) => !prev);
                if (isExpanded) setIsExpanded(false);
              }}
              className="p-1.5 text-[#7C6E65] hover:text-[#2C241E] hover:bg-[#EAE0D3] rounded-lg transition-colors"
              title={isMinimized ? 'Restaurar chat' : 'Minimizar a la barra'}
            >
              {isMinimized ? <ChevronUp size={15} /> : <Minus size={15} />}
            </button>
            {/* Botón Pantalla Completa */}
            {!isMinimized && (
              <button
                onClick={() => setIsExpanded((value) => !value)}
                className="p-1.5 text-[#7C6E65] hover:text-[#2C241E] hover:bg-[#EAE0D3] rounded-lg transition-colors"
                title={isExpanded ? 'Restaurar tamaño' : 'Ampliar ventana'}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}
            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 text-[#7C6E65] hover:text-[#2C241E] hover:bg-[#EAE0D3] rounded-lg transition-colors"
              title="Cerrar chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cuerpo del chat: Fondo blanco en el interior */}
        {!isMinimized && (
          <>
            {/* Opciones de Mensajes / Sugerencias Rápidas con fondo blanco */}
            {messages.length <= 1 && (
              <div className="border-b border-gray-100 bg-white px-3.5 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-[#8C7A6B] uppercase tracking-wider">
                    {roleData.title}
                  </span>
                  {roleData.roleTitle && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#6B5A4B] text-[9px] font-medium border border-[#EFE8DC]">
                      <UserCheck size={10} className="text-[#78350F]" />
                      {roleData.roleTitle}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roleData.items.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => handleSendMessage(suggestion.query)}
                      className="rounded-full border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-left text-[10.5px] font-medium text-gray-700 transition-all hover:border-[#78350F]/40 hover:bg-[#FAF5EE] hover:text-[#78350F] shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Área de Mensajes con fondo blanco */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-none bg-[#9B0F06] text-white shadow-2xs font-medium'
                        : 'rounded-bl-none border border-gray-200 bg-[#F9FAFB] text-slate-800 shadow-2xs'
                    }`}
                  >
                    <FormattedMessage content={msg.content} />
                  </div>
                  {msg.timestamp && (
                    <span className="mt-1 px-1 text-[9px] text-[#A39486]">{msg.timestamp}</span>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none border border-gray-200 bg-[#F9FAFB] px-4 py-2.5 text-slate-700 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-[#7C6E65]">Consultando IA</span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#78350F]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#78350F]" style={{ animationDelay: '0.15s' }}></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#78350F]" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Barra de Entrada de Texto con fondo blanco */}
            <div className="border-t border-gray-100 bg-white px-3 py-2.5">
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3.5 py-1.5 border border-gray-200 focus-within:border-[#78350F]/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#78350F]/10 transition-all shadow-2xs">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe tu consulta para la IA..."
                  className="flex-1 bg-transparent text-xs text-[#2C241E] placeholder:text-gray-400 outline-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="w-7 h-7 rounded-full bg-transparent hover:bg-gray-200/60 flex items-center justify-center text-gray-500 hover:text-[#78350F] transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Enviar mensaje"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
