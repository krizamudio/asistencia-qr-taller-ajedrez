'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PaginaAsistencia() {
  const { id } = useParams();
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState('cargando');
  const [sesion, setSesion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch(`/api/sesiones/${id}`);
        if (res.status === 404) { setEstado('no_encontrada'); return; }
        const data = await res.json();
        setSesion(data.sesion);
        const expirada = new Date(data.sesion.expira_en) < new Date();
        setEstado(expirada ? 'expirada' : 'activa');
      } catch { setEstado('error'); }
    };
    verificar();
  }, [id]);

  useEffect(() => {
    if (!sesion || estado !== 'activa') return;
    const intervalo = setInterval(() => {
      const restante = new Date(sesion.expira_en) - new Date();
      if (restante <= 0) { setTiempoRestante(0); setEstado('expirada'); clearInterval(intervalo); }
      else { setTiempoRestante(Math.floor(restante / 1000)); }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [sesion, estado]);

  const formatearTiempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  };

  const registrarAsistencia = async () => {
    if (!nombre.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/sesiones/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      if (res.status === 410) { setEstado('expirada'); return; }
      if (!res.ok) { setEstado('error'); return; }
      setEstado('registrado');
    } catch { setEstado('error'); }
    finally { setEnviando(false); }
  };

  if (estado === 'cargando') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-lg">Verificando sesión...</p>
    </div>
  );

  if (estado === 'no_encontrada') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sesión no encontrada</h1>
        <p className="text-gray-500">Este QR no corresponde a ninguna clase.</p>
      </div>
    </div>
  );

  if (estado === 'expirada') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-5xl mb-4">⏰</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sesión cerrada</h1>
        <p className="text-gray-500">El tiempo para registrar asistencia ya terminó.</p>
      </div>
    </div>
  );

  if (estado === 'registrado') return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-6xl mb-4">✅</p>
        <h1 className="text-2xl font-bold text-green-800 mb-2">¡Asistencia registrada!</h1>
        <p className="text-green-700 text-lg font-medium">{nombre}</p>
        <p className="text-gray-500 mt-2">Tu asistencia quedó guardada correctamente.</p>
      </div>
    </div>
  );

  if (estado === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ocurrió un error</h1>
        <p className="text-gray-500">Intenta escanear el QR de nuevo.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Registrar asistencia</h1>
        {tiempoRestante > 0 && (
          <p className="text-center text-sm text-gray-400 mb-6">
            Cierra en: <span className="font-mono text-red-500 font-semibold">{formatearTiempo(tiempoRestante)}</span>
          </p>
        )}
        <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && registrarAsistencia()}
          placeholder="ESCRIBE TU NOMBRE"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-medium uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
          autoComplete="off"
        />
        <button
          onClick={registrarAsistencia}
          disabled={enviando || !nombre.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 text-lg"
        >
          {enviando ? 'Registrando...' : 'Registrar asistencia'}
        </button>
      </div>
    </div>
  );
}