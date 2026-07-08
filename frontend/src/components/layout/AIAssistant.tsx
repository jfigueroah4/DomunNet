'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  FolderOpen,
  ClipboardList,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [activeTab, setActiveTab] = useState('proyectos');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Prueba con: "tabla de proyectos", "estadisticas de bitacora", "fotos de Vista Hermosa", "incidentes abiertos" o "reporte de Escuintla".',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const tabs = [
    { id: 'proyectos', label: 'Proyectos', icon: FolderOpen },
    { id: 'bitacora', label: 'Bitacora', icon: ClipboardList },
    { id: 'fotos', label: 'Fotos', icon: ImageIcon },
  ];

  const suggestions = [
    { label: 'Tabla de proyectos', query: 'tabla de proyectos' },
    { label: 'Estadisticas de bitacora', query: 'estadisticas de bitacora' },
    { label: 'Fotos de Vista Hermosa', query: 'fotos de Vista Hermosa' },
    { label: 'Incidentes abiertos', query: 'incidentes abiertos' },
    { label: 'Reporte de Escuintla', query: 'reporte de Escuintla' },
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const responses: { [key: string]: string } = {
        'tabla de proyectos': 'Generando tabla de proyectos...\n\nProyecto 1: Vista Hermosa (En Progreso)\nProyecto 2: Proyecto Central (Completado)\nProyecto 3: Expansion Escuintla (En Progreso)',
        'estadisticas de bitacora': 'Estadisticas de bitacora:\n\n- Total registros: 127\n- Esta semana: 23\n- Criticos: 3\n- Completados: 89',
        'fotos de vista hermosa': 'Encontre 12 fotografias de Vista Hermosa:\n\n- Fase inicial (4 fotos)\n- Fase intermedia (5 fotos)\n- Fase final (3 fotos)',
        'incidentes abiertos': 'Incidentes abiertos:\n\n1. Error en consultas (Abierto)\n2. Fallo de base de datos (En revision)\n3. Retraso en entrega (Abierto)',
        'reporte de escuintla': 'Reporte de Escuintla:\n\nAvance: 75%\nFecha inicio: 2026-01-15\nFecha estimada: 2026-08-30\nEquipo: 12 personas',
      };

      const response =
        Object.entries(responses).find(([key]) => userMessage.toLowerCase().includes(key))?.[1] ||
        'Comando no reconocido. Intenta con: "tabla de proyectos", "estadisticas de bitacora", "fotos de Vista Hermosa", "incidentes abiertos" o "reporte de Escuintla".';

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 800);
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-slate-950/35 backdrop-blur-[1px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute bg-white shadow-2xl ring-1 ring-slate-200 transition-all duration-300 ease-out ${
          isExpanded
            ? 'inset-4 rounded-xl'
            : 'bottom-0 right-0 top-0 w-full border-l border-slate-200 sm:w-[430px]'
        } ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2 text-red-800 ring-1 ring-red-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">Asistente IA</h2>
              <p className="text-xs text-slate-500">Tablas, graficos, reportes y consultas</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded((value) => !value)}
              className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title={isExpanded ? 'Contraer' : 'Pantalla completa'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50 px-4 pt-3">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-2 text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-red-800 shadow-sm ring-1 ring-slate-200 ring-offset-0'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {messages.length <= 1 && (
          <div className="border-b border-slate-100 bg-white px-5 py-4">
            <p className="mb-2 text-xs font-bold text-slate-700">Ejemplos de consultas:</p>
            <div className={`grid gap-2 ${isExpanded ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.query}
                  onClick={() => setInputValue(suggestion.query)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-800"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'rounded-br-none bg-red-800 text-white'
                    : 'rounded-bl-none border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg rounded-bl-none border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.1s' }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Pide una tabla, grafico o reporte..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/15"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-md bg-red-800 p-2 text-white transition-colors hover:bg-red-900 disabled:bg-slate-300"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
