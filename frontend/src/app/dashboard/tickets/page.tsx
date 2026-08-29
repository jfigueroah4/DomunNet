'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Plus, Send, X } from 'lucide-react';

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
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
}

export default function TicketsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    category: 'contrasena',
    message: '',
  });

  const [tickets] = useState<SupportTicket[]>([
    {
      id: '1',
      title: 'Solicitud de recuperacion de contrasena',
      status: 'abierto',
      category: 'contrasena',
      createdBy: 'Luis Arriaga',
      assignedTo: 'Marco Estrada',
      createdAt: '2026-05-24 08:25',
      messages: [
        {
          id: '1',
          author: 'Luis Arriaga',
          role: 'user',
          message: 'No puedo ingresar con mi contrasena actual. Solicito apoyo para restablecerla.',
          timestamp: '2026-05-24 08:25',
        },
        {
          id: '2',
          author: 'Marco Estrada',
          role: 'admin',
          message: 'Se ha enviado un enlace de recuperacion a tu correo electronico. Revisalo en los proximos 10 minutos.',
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
      assignedTo: 'Marco Estrada',
      createdAt: '2026-05-24 09:10',
      messages: [
        {
          id: '1',
          author: 'Marco Estrada',
          role: 'user',
          message: 'El PDF del informe abre, pero necesito confirmar si incluye todas las fotografias seleccionadas.',
          timestamp: '2026-05-24 09:10',
        },
      ],
    },
  ]);

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
    setNewMessage('');
  };

  const handleCreateTicket = () => {
    if (!formData.subject.trim() || !formData.message.trim()) return;
    setFormData({ subject: '', category: 'contrasena', message: '' });
    setShowCreateForm(false);
  };

  return (
    <div className="flex h-full flex-col bg-gray-100">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tickets de Soporte</h1>
            <p className="mt-1 text-xs text-gray-500">Mensajes de contrasena, errores y solicitudes entre usuarios y administrador</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">Tickets abiertos</p>
            <p className="text-xl font-bold leading-none text-red-900">{openTickets}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        <div className="flex w-80 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <button
              onClick={() => {
                setShowCreateForm(true);
                setSelectedTicket(null);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-red-800 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-900"
            >
              <Plus size={14} />
              Crear ticket
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Total</p>
                <p className="text-sm font-bold text-gray-900">{tickets.length}</p>
              </div>
              <div className="rounded-md border border-red-200 bg-red-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-red-800">Abiertos</p>
                <p className="text-sm font-bold text-red-900">{openTickets}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowCreateForm(false);
                }}
                className={`w-full rounded-lg border p-3 text-left transition-all hover:border-gray-300 hover:bg-gray-50 ${
                  selectedTicket?.id === ticket.id ? 'border-red-300 bg-red-50 shadow-sm' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 flex-1 text-xs font-bold leading-snug text-gray-900">{ticket.title}</h3>
                </div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${getStatusBadge(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {formatStatus(ticket.status)}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase text-gray-600">{ticket.category}</span>
                </div>
                <p className="text-xs text-gray-500">{ticket.createdAt}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {showCreateForm ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Crear Ticket</h3>
                  <p className="mt-1 text-xs text-gray-500">Completa el asunto, categoria y detalle para enviarlo al administrador.</p>
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
                        placeholder="Describe tu problema"
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
                    <label className="mb-1.5 block text-xs font-semibold text-gray-800">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/15"
                    >
                      <option value="contrasena">Contrasena</option>
                      <option value="reportes">Reportes</option>
                      <option value="acceso">Acceso</option>
                      <option value="funcionalidad">Funcionalidad</option>
                      <option value="otro">Otro</option>
                    </select>
                    <div className="mt-4 rounded-md border border-red-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase text-red-900">Resumen</p>
                      <p className="mt-2 text-xs text-gray-700">El ticket se enviara al administrador con prioridad normal y quedara visible en el historial.</p>
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
                  Enviar al administrador
                </button>
              </div>
            </div>
          ) : selectedTicket ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{selectedTicket.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedTicket.createdBy} - {selectedTicket.createdAt}
                    </p>
                  </div>
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getStatusBadge(selectedTicket.status)}`}>
                    {formatStatus(selectedTicket.status)}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-5">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-br-none bg-red-800 text-white'
                          : 'rounded-bl-none border border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold">{msg.author}</p>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 bg-white p-4">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe respuesta para el usuario..."
                    rows={2}
                    className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/15"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="rounded-md bg-red-800 p-2 text-white transition-colors hover:bg-red-900 disabled:bg-gray-300"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-500">
              <AlertCircle size={32} className="mb-2 text-gray-300" />
              <p className="text-sm">Selecciona un ticket o crea uno nuevo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
