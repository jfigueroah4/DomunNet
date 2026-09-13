'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Plus, Send, X, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface TicketMessage {
  id: string;
  author: string;
  role: 'user' | 'admin';
  message: string;
  timestamp: string;
}

interface SupportTicket {
  id: string;
  title: string;
  status: 'abierto' | 'en_revision' | 'en_progreso' | 'cerrado';
  category: string;
  createdBy: string;
  createdByRole?: string;
  createdByEmail?: string;
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: '1',
    title: 'Solicitud de recuperación de contraseña',
    status: 'abierto',
    category: 'contrasena',
    createdBy: 'Luis Arriaga',
    createdByRole: 'IngenieroResidente',
    createdByEmail: 'luis.arriaga@domunnet.test',
    assignedTo: 'Administrador / Gerencia',
    createdAt: '2026-05-24 08:25',
    messages: [
      {
        id: '1',
        author: 'Luis Arriaga',
        role: 'user',
        message: 'No puedo ingresar con mi contraseña actual. Solicito apoyo para restablecerla.',
        timestamp: '2026-05-24 08:25',
      },
      {
        id: '2',
        author: 'Marco Estrada',
        role: 'admin',
        message: 'Se ha enviado un enlace de recuperación a tu correo electrónico. Revísalo en los próximos 10 minutos.',
        timestamp: '2026-05-24 08:45',
      },
    ],
  },
  {
    id: '2',
    title: 'Error al generar reporte',
    status: 'en_revision',
    category: 'reportes',
    createdBy: 'Marco Estrada',
    createdByRole: 'Administrador',
    createdByEmail: 'marco.estrada@domunnet.test',
    assignedTo: 'Administrador / Gerencia',
    createdAt: '2026-05-24 09:10',
    messages: [
      {
        id: '1',
        author: 'Marco Estrada',
        role: 'user',
        message: 'El PDF del informe abre, pero necesito confirmar si incluye todas las fotografías seleccionadas.',
        timestamp: '2026-05-24 09:10',
      },
    ],
  },
];

export default function TicketsPage() {
  const profile = useAuthStore((state) => state.profile);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Paginación (Máximo 3 tickets por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 3;

  const [formData, setFormData] = useState({
    subject: '',
    category: 'contrasena',
    message: '',
  });

  // Cargar tickets de localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('domun_support_tickets');
      if (stored) {
        setTickets(JSON.parse(stored));
      } else {
        setTickets(INITIAL_TICKETS);
        localStorage.setItem('domun_support_tickets', JSON.stringify(INITIAL_TICKETS));
      }
    } catch {
      setTickets(INITIAL_TICKETS);
    }
  }, []);

  const saveTickets = (updated: SupportTicket[]) => {
    setTickets(updated);
    try {
      localStorage.setItem('domun_support_tickets', JSON.stringify(updated));
    } catch (e) {
      console.error('Error guardando tickets:', e);
    }
  };

  const esEncargado = profile?.rol === 'Administrador' || profile?.rol === 'Gerencia';
  const nombreUsuarioActual = profile ? `${profile.nombre} ${profile.apellido}`.trim() : '';
  const correoUsuarioActual = profile?.correo?.trim().toLowerCase() || '';

  // Lista de usuarios únicos para el filtro
  const usuariosUnicos = Array.from(new Set(tickets.map((t) => t.createdBy).filter(Boolean)));

  // Filtrado de tickets
  const ticketsFiltrados = tickets.filter((t) => {
    // Si no es Administrador ni Gerencia, solo puede ver sus propios tickets
    if (!esEncargado) {
      const creadoPorLower = (t.createdBy || '').toLowerCase();
      const esPropio =
        creadoPorLower === nombreUsuarioActual.toLowerCase() ||
        creadoPorLower === correoUsuarioActual ||
        creadoPorLower === (profile?.username || '').toLowerCase();

      if (!esPropio) return false;
    }

    const query = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !query ||
      t.title.toLowerCase().includes(query) ||
      t.createdBy.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.messages.some((m) => m.message.toLowerCase().includes(query));

    const coincideUsuario = filtroUsuario === 'todos' || t.createdBy === filtroUsuario;
    const coincideCategoria = filtroCategoria === 'todos' || t.category === filtroCategoria;
    const coincideEstado =
      filtroEstado === 'todos' ||
      t.status === filtroEstado ||
      (filtroEstado === 'terminado' && t.status === 'cerrado');

    return coincideBusqueda && coincideUsuario && coincideCategoria && coincideEstado;
  });

  // Paginación
  const totalPaginas = Math.ceil(ticketsFiltrados.length / registrosPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * registrosPorPagina;
  const ticketsPaginados = ticketsFiltrados.slice(indexInicio, indexInicio + registrosPorPagina);

  const openTickets = tickets.filter((ticket) => ticket.status !== 'cerrado').length;

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      abierto: 'bg-red-100 text-red-800 ring-red-200',
      en_revision: 'bg-amber-100 text-amber-800 ring-amber-200',
      en_progreso: 'bg-blue-100 text-blue-800 ring-blue-200',
      cerrado: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 ring-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'abierto':
        return <AlertCircle size={13} />;
      case 'en_revision':
      case 'en_progreso':
        return <Clock size={13} />;
      case 'cerrado':
        return <CheckCircle2 size={13} />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ');

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const authorName = profile ? `${profile.nombre} ${profile.apellido}` : 'Administrador';
    
    const updatedMessages = [
      ...selectedTicket.messages,
      {
        id: Date.now().toString(),
        author: authorName,
        role: 'admin' as const,
        message: newMessage.trim(),
        timestamp: nowStr,
      },
    ];

    const updatedTicket = { ...selectedTicket, messages: updatedMessages };
    const updatedTickets = tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t));
    
    saveTickets(updatedTickets);
    setSelectedTicket(updatedTicket);
    setNewMessage('');
  };

  const handleStatusChange = (newStatus: 'abierto' | 'en_revision' | 'en_progreso' | 'cerrado') => {
    if (!selectedTicket) return;
    const updatedTicket = { ...selectedTicket, status: newStatus };
    const updatedTickets = tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t));
    saveTickets(updatedTickets);
    setSelectedTicket(updatedTicket);
  };

  const handleCreateTicket = () => {
    if (!formData.subject.trim() || !formData.message.trim()) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const creatorName = profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario';
    const creatorRole = profile?.rol || 'Usuario';
    const creatorEmail = profile?.correo || '';

    const newTicket: SupportTicket = {
      id: `TICK-${Date.now().toString().slice(-6)}`,
      title: formData.subject.trim(),
      status: 'abierto',
      category: formData.category,
      createdBy: creatorName,
      createdByRole: creatorRole,
      createdByEmail: creatorEmail,
      assignedTo: 'Administrador / Gerencia',
      createdAt: nowStr,
      messages: [
        {
          id: '1',
          author: creatorName,
          role: 'user',
          message: formData.message.trim(),
          timestamp: nowStr,
        },
      ],
    };

    const updated = [newTicket, ...tickets];
    saveTickets(updated);
    setFormData({ subject: '', category: 'contrasena', message: '' });
    setShowCreateForm(false);
    setSelectedTicket(newTicket);
  };

  return (
    <div className="flex h-full flex-col bg-gray-100 font-poppins">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tickets de Soporte</h1>
            <p className="mt-1 text-xs text-gray-500">Gestión de solicitudes, recuperaciones de contraseña y atención de usuarios</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-white px-3 py-2 text-right shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">Tickets abiertos</p>
            <p className="text-xl font-bold leading-none text-red-900">{openTickets}</p>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por asunto, autor o mensaje..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:border-red-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>

          {/* Filtro Usuario (Solo para Administrador / Gerencia) */}
          {esEncargado && (
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-gray-500" />
              <select
                value={filtroUsuario}
                onChange={(e) => {
                  setFiltroUsuario(e.target.value);
                  setPaginaActual(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-red-800 focus:outline-none"
              >
                <option value="todos">Todos los usuarios</option>
                {usuariosUnicos.map((usr) => (
                  <option key={usr} value={usr}>
                    {usr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setPaginaActual(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-red-800 focus:outline-none"
          >
            <option value="todos">Todas las categorías</option>
            <option value="contrasena">Contraseña</option>
            <option value="reportes">Reportes</option>
            <option value="funcionalidad">Funcionalidad</option>
            <option value="otro">Otro</option>
          </select>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setPaginaActual(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-red-800 focus:outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="abierto">Abierto</option>
            <option value="en_revision">En revisión</option>
            <option value="en_progreso">En progreso</option>
            <option value="cerrado">Terminado / Cerrado</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Sidebar Lista Tickets */}
        <div className="flex w-80 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-3">
            <button
              onClick={() => {
                setShowCreateForm(true);
                setSelectedTicket(null);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-red-800 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-900"
            >
              <Plus size={14} />
              Crear ticket
            </button>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500 font-medium">
              <span>Resultados: {ticketsFiltrados.length}</span>
              <span>Abiertos: {openTickets}</span>
            </div>
          </div>

          {/* Lista Paginada */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {ticketsPaginados.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No se encontraron tickets con los filtros aplicados.
              </div>
            ) : (
              ticketsPaginados.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowCreateForm(false);
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-all hover:border-gray-300 ${
                    selectedTicket?.id === ticket.id ? 'border-red-700 bg-white ring-1 ring-red-700/20 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 flex-1 text-xs font-bold leading-snug text-gray-900">{ticket.title}</h3>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${getStatusBadge(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {formatStatus(ticket.status)}
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gray-600">{ticket.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="font-medium truncate max-w-[140px]">{ticket.createdBy}</span>
                    <span>{ticket.createdAt}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Controls de Paginación */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs">
            <button
              disabled={paginaActual <= 1}
              onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft size={13} />
              Anterior
            </button>
            <span className="text-[11px] text-gray-600 font-medium">
              Pág. {paginaActual} de {totalPaginas}
            </span>
            <button
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
              className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Siguiente
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Panel Principal */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {showCreateForm ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Crear Ticket de Soporte</h3>
                  <p className="mt-1 text-xs text-gray-500">Completa el asunto, categoría y detalle para enviarlo al administrador.</p>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-800">Asunto</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Describe el problema o solicitud"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/15"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-800">Mensaje</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Describe tu solicitud con detalle"
                        rows={9}
                        className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/15"
                      />
                    </div>
                  </div>

                  <aside className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-800">Categoría</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/15"
                    >
                      <option value="contrasena">Contraseña</option>
                      <option value="reportes">Reportes</option>
                      <option value="funcionalidad">Funcionalidad</option>
                      <option value="otro">Otro</option>
                    </select>
                    <div className="mt-4 rounded-md border border-red-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase text-red-900">Resumen</p>
                      <p className="mt-2 text-xs text-gray-700">El ticket quedará registrado inmediatamente en la consola de atención de soporte.</p>
                    </div>
                  </aside>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTicket}
                  className="flex-1 rounded-md bg-red-800 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-900"
                >
                  Enviar ticket
                </button>
              </div>
            </div>
          ) : selectedTicket ? (
            <div className="flex h-full flex-col">
              {/* Header del Ticket seleccionado */}
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{selectedTicket.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 font-poppins">
                      <span>Creado por: <strong className="text-gray-800">{selectedTicket.createdBy}</strong></span>
                      {selectedTicket.createdByRole && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 border border-red-200">
                          {selectedTicket.createdByRole}
                        </span>
                      )}
                      {selectedTicket.createdByEmail && (
                        <span className="text-gray-400">({selectedTicket.createdByEmail})</span>
                      )}
                      <span>&bull; {selectedTicket.createdAt}</span>
                    </div>
                  </div>

                  {/* Cambio de estado habilitado solo para Administrador / Gerencia */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-500">Estado:</span>
                    {esEncargado ? (
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 focus:border-red-800 focus:outline-none"
                      >
                        <option value="abierto">Abierto</option>
                        <option value="en_revision">En revisión</option>
                        <option value="en_progreso">En progreso</option>
                        <option value="cerrado">Terminado / Cerrado</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getStatusBadge(selectedTicket.status)}`}>
                        {getStatusIcon(selectedTicket.status)}
                        {formatStatus(selectedTicket.status)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensajes del Ticket */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-5">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-md rounded-lg px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-bl-none border border-gray-200 bg-white text-gray-800'
                          : 'rounded-br-none bg-red-800 text-white'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-[10px] opacity-80">
                        <span className="font-bold">{msg.author}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Responder */}
              <div className="border-t border-gray-200 bg-white p-4">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe una respuesta para el usuario..."
                    rows={2}
                    className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/15"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="flex items-center justify-center rounded-md bg-red-800 px-4 py-2 text-white transition-colors hover:bg-red-900 disabled:bg-gray-300"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-500">
              <AlertCircle size={36} className="mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Selecciona un ticket para ver sus detalles o responde</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

