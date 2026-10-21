'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  X,
  Send,
  Maximize2,
  Minimize2,
  Bot,
  Minus,
  ChevronUp,
  ArrowRight,
  FolderKanban,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { tienePermiso } from '@/lib/rutas-permisos';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRoleSuggestions = (userRole?: string, userPermisos: string[] = []) => {
  const items: Array<{ label: string; query: string }> = [];

  const tieneProyectos = tienePermiso(userPermisos, 'proyectos.read', userRole);
  const tieneBitacora = tienePermiso(userPermisos, 'bitacora.read', userRole);
  const tieneFotos = tienePermiso(userPermisos, 'evidencia_fotografica.read', userRole);
  const tieneReportes = tienePermiso(userPermisos, 'reportes.read', userRole);
  const tieneFinanzas = tienePermiso(userPermisos, 'finanzas.read', userRole);
  const tieneUsuarios = tienePermiso(userPermisos, 'usuarios.read', userRole);

  if (tieneProyectos) {
    items.push({ label: 'Resumen de proyectos', query: 'Generar un resumen ejecutivo de los proyectos activos' });
  }
  if (tieneBitacora) {
    items.push({ label: 'Bitácoras de hoy', query: 'Bitácoras pendientes de validación y registros de hoy' });
  }
  if (tieneFotos) {
    items.push({ label: 'Fotos de obra', query: 'Fotos de inspección y evidencias recientes' });
  }
  if (tieneFinanzas) {
    items.push({ label: 'Estimaciones y Finanzas', query: 'Dime las estimaciones que hayan vencido o estén a punto de vencer' });
  }
  if (tieneReportes) {
    items.push({ label: 'Reportes y Avance', query: 'Generar reporte de avance y estado de obra' });
  }
  if (tieneUsuarios) {
    items.push({ label: 'Usuarios del sistema', query: 'Resumen de usuarios y roles activos' });
  }

  // Fallback genérico si no hay módulos habilitados
  if (items.length === 0) {
    items.push(
      { label: 'Proyectos asignados', query: 'Consultar proyectos en los que participo' },
      { label: 'Bitácora', query: 'Mis registros de bitácora' },
      { label: 'Ayuda', query: '¿Qué consultas puedo realizar según mis permisos?' }
    );
  }

  return {
    roleTitle: userRole || 'Usuario DomunNet',
    title: 'Consultas sugeridas sobre módulos:',
    items: items.slice(0, 4)
  };
};

function FormattedMessage({
  content,
  onNavigate,
  onAskQuery,
}: {
  content: string;
  onNavigate?: (url: string) => void;
  onAskQuery?: (query: string) => void;
}) {
  if (!content) return null;

  const rawLines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {rawLines.map((line, lineIdx) => {
        let cleanLine = line.trim();

        // Limpiar encabezados Markdown tipo ## o ###
        cleanLine = cleanLine.replace(/^#{1,6}\s+/, '');

        // Detectar elementos de lista con guión o asterisco
        const isBullet = cleanLine.startsWith('- ') || cleanLine.startsWith('* ');
        if (isBullet) {
          cleanLine = cleanLine.substring(2).trim();
        }

        if (!cleanLine) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Parsear tanto botones interactivos [ask:Consulta], enlaces [Texto](/ruta) como **negritas**
        const parts = cleanLine.split(/(\[ask:.*?\]|\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__)/g);

        const parsedElements = parts.map((part, partIdx) => {
          if (!part) return null;

          // 1. Detectar botones [ask:Texto a consultar]
          if (part.startsWith('[ask:') && part.endsWith(']')) {
            const queryText = part.slice(5, -1).trim();
            return (
              <button
                key={partIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAskQuery?.(queryText);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mr-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 font-semibold text-[11px] shadow-2xs transition-all cursor-pointer active:scale-95 group select-none"
                title={`Consultar: ${queryText}`}
              >
                <span>{queryText}</span>
                <ArrowRight size={12} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          }

          // 2. Detectar botones / enlaces interactivos de redirección markdown [Texto](/ruta) o [Texto](ask:...)
          const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
          if (linkMatch) {
            const [, label, href] = linkMatch;

            if (href.startsWith('ask:') || href.startsWith('query:')) {
              const queryText = href.replace(/^(ask|query):/, '').trim();
              return (
                <button
                  key={partIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskQuery?.(queryText || label);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mr-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 font-semibold text-[11px] shadow-2xs transition-all cursor-pointer active:scale-95 group select-none"
                  title={`Consultar ${label}`}
                >
                  <span>{label}</span>
                  <ArrowRight size={12} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            }

            return (
              <button
                key={partIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.(href);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mr-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 font-semibold text-[11px] shadow-2xs transition-all cursor-pointer active:scale-95 group select-none"
                title={`Ir a ${label}`}
              >
                <span>{label}</span>
                <ArrowRight size={12} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          }

          // 3. Detectar negritas
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
              <span className="text-gray-500 font-bold text-[11px] select-none leading-none mt-1">•</span>
              <div className="flex-1 flex flex-wrap items-center gap-x-1">{parsedElements}</div>
            </div>
          );
        }

        return (
          <div key={lineIdx} className="flex flex-wrap items-center gap-x-1">
            {parsedElements}
          </div>
        );
      })}
    </div>
  );
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { profile } = useAuthStore();
  const primerNombre = profile?.primerNombre || (profile?.nombre ? profile.nombre.trim().split(' ')[0] : '') || profile?.username || '';
  const userRole = profile?.rol || profile?.cargo || '';

  // Detección automática del proyecto actual en pantalla
  const currentProjectInfo = useMemo(() => {
    let proyId = searchParams?.get('id') || searchParams?.get('slug') || searchParams?.get('proyectoId') || searchParams?.get('proyecto') || '';
    let proyNombre = '';

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('domun_proyecto_actual');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.id) {
            proyId = proyId || parsed.id;
            proyNombre = parsed.nombre || parsed.nombreOficial || '';
          }
        }
      } catch (_) {}

      if (!proyNombre && document.querySelector('h1')) {
        const h1Text = document.querySelector('h1')?.textContent?.trim();
        if (h1Text && !h1Text.includes('Dashboard') && !h1Text.includes('Reportes') && !h1Text.includes('Bitácora')) {
          proyNombre = h1Text;
        }
      }
    }

    return {
      id: proyId,
      codigo: proyId.startsWith('PROY-') || proyId.startsWith('DOM-') ? proyId : '',
      nombre: proyNombre,
      path: pathname || '',
    };
  }, [pathname, searchParams]);

  const handleNavigate = (url: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank');
      return;
    }

    // Normalizar rutas relativas cortas a las rutas reales de Next.js
    let target = url.trim();
    if (!target.startsWith('/dashboard')) {
      if (target.startsWith('/estimaciones') || target.startsWith('/hoja-sabana')) {
        target = '/dashboard/proyectos/supervision';
      } else if (target.startsWith('/finanzas')) {
        target = '/dashboard/estadisticas?tab=finanzas';
      } else if (target.startsWith('/reportes')) {
        target = '/dashboard/reportes';
      } else if (target.startsWith('/proyectos')) {
        target = '/dashboard/proyectos';
      } else if (target.startsWith('/bitacora')) {
        target = '/dashboard/bitacora';
      } else if (target.startsWith('/fotografias')) {
        target = '/dashboard/fotografias';
      } else if (target.startsWith('/estadisticas')) {
        target = '/dashboard/estadisticas';
      } else if (target.startsWith('/usuarios')) {
        target = '/dashboard/usuarios';
      } else if (target.startsWith('/roles')) {
        target = '/dashboard/roles';
      } else if (target.startsWith('/configuracion')) {
        target = '/dashboard/configuracion';
      } else {
        target = `/dashboard${target.startsWith('/') ? target : `/${target}`}`;
      }
    }

    router.push(target);
  };

  const roleData = useMemo(() => getRoleSuggestions(userRole, profile?.permisos || []), [userRole, profile?.permisos]);

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
    const suggestionButtons = roleData.items.map(it => `[${it.label}](ask:${it.query})`).join(' ');
    const initialText = `${nombreGreeting} Soy DomunBot AI, tu asistente en tiempo real de DomunNet. ¿En qué puedo ayudarte hoy?\n\n${suggestionButtons}`;
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
  }, [primerNombre, roleData.items]);

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

    let savedReports: any[] = [];
    try {
      savedReports = JSON.parse(localStorage.getItem('domun_reportes_historial') || '[]');
    } catch (_) {}

    try {
      // Llamada al endpoint API con datos de proyecto actual, historial de reportes y contexto en vivo
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFirstName: primerNombre,
          userRole: userRole,
          userPermissions: profile?.permisos || [],
          currentProject: currentProjectInfo,
          currentPath: pathname,
          reportsHistory: savedReports.slice(0, 15),
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
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
      const replyContent = `${greeting}No fue posible consultar el asistente en este momento. Intenta de nuevo en unos segundos.`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        className={`fixed z-[1000] md:z-50 bg-white shadow-2xl border border-[#D1D5DB] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          isExpanded
            ? 'inset-4 sm:inset-8 md:inset-12 rounded-2xl'
            : isMinimized
            ? 'bottom-[62px] md:bottom-0 right-3 sm:right-6 md:right-8 w-auto sm:w-[320px] h-12 rounded-xl md:rounded-t-xl md:rounded-b-none shadow-lg'
            : 'bottom-[62px] md:bottom-0 right-3 left-3 sm:left-auto sm:right-6 md:right-8 w-auto sm:w-[390px] md:w-[420px] h-[520px] max-h-[calc(100vh-130px)] md:max-h-[calc(100vh-80px)] rounded-2xl md:rounded-t-2xl md:rounded-b-none'
        } ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95 pointer-events-none'}`}
      >
        {/* Encabezado del Chat */}
        <div
          className="flex items-center justify-between border-b border-[#D1D5DB] bg-[#E5E7EB] text-[#1F2937] px-4 py-2.5 select-none cursor-pointer"
          onClick={() => {
            if (isMinimized) setIsMinimized(false);
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center text-[#4B5563] shrink-0">
              <Bot size={19} className="text-[#4B5563] translate-y-[1px]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold tracking-wide text-[#4B5563]">DomunBot AI</h2>
              {!isMinimized && (
                <p className="text-[10px] text-[#6B7280] truncate">Asistente en Tiempo Real • DomunNet</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Botón Minimizar / Restaurar */}
            <button
              onClick={() => {
                setIsMinimized((prev) => !prev);
                if (isExpanded) setIsExpanded(false);
              }}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#D1D5DB] rounded-lg transition-colors cursor-pointer"
              title={isMinimized ? 'Restaurar chat' : 'Minimizar a la barra'}
            >
              {isMinimized ? <ChevronUp size={15} /> : <Minus size={15} />}
            </button>
            {/* Botón Pantalla Completa */}
            {!isMinimized && (
              <button
                onClick={() => setIsExpanded((value) => !value)}
                className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#D1D5DB] rounded-lg transition-colors cursor-pointer"
                title={isExpanded ? 'Restaurar tamaño' : 'Ampliar ventana'}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}
            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#D1D5DB] rounded-lg transition-colors cursor-pointer"
              title="Cerrar chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Indicador de Proyecto Actual en Pantalla */}
        {!isMinimized && currentProjectInfo.nombre && (
          <div className="bg-[#F3F4F6] border-b border-[#D1D5DB] px-3.5 py-1.5 flex items-center gap-1.5 text-[10px] text-[#4B5563]">
            <FolderKanban size={12} className="shrink-0 text-gray-600" />
            <span className="truncate font-semibold">
              Proyecto activo: {currentProjectInfo.nombre}
            </span>
          </div>
        )}

        {/* Cuerpo del chat */}
        {!isMinimized && (
          <>
            {/* Área de Mensajes */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-none bg-[#9B0F06] text-white shadow-2xs font-medium'
                        : 'rounded-bl-none border border-gray-200 bg-[#F9FAFB] text-slate-800 shadow-2xs'
                    }`}
                  >
                    <FormattedMessage
                      content={msg.content}
                      onNavigate={handleNavigate}
                      onAskQuery={(q) => handleSendMessage(q)}
                    />
                  </div>
                  {msg.timestamp && (
                    <span className="mt-1 px-1 text-[9px] text-[#9CA3AF]">{msg.timestamp}</span>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none border border-gray-200 bg-[#F9FAFB] px-4 py-2.5 text-slate-700 shadow-2xs">
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0.15s' }}></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Barra de Entrada de Texto */}
            <div className="border-t border-gray-100 bg-white px-3 py-2.5">
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3.5 py-1.5 border border-gray-200 focus-within:border-[#4B5563]/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#4B5563]/10 transition-all shadow-2xs">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe tu consulta para la IA..."
                  className="flex-1 bg-transparent text-xs text-[#1F2937] placeholder:text-gray-400 outline-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="w-7 h-7 rounded-full bg-transparent hover:bg-gray-200/60 flex items-center justify-center text-gray-500 hover:text-[#4B5563] transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
