'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PaginaAsistencia() {
  const { id } = useParams();
  const [estado, setEstado] = useState('cargando'); // cargando | activa | expirada | no_encontrada | registrado | error
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [sesion, setSesion] = useState(null);

  useEffect(() => {
    const inicializar = async () => {
      try {
        // Verificar sesión
        const resSesion = await fetch(`/api/sesiones/${id}`);
        if (resSesion.status === 404) { setEstado('no_encontrada'); return; }
        const dataSesion = await resSesion.json();
        setSesion(dataSesion.sesion);

        const expirada = new Date(dataSesion.sesion.expira_en) < new Date();
        if (expirada) { setEstado('expirada'); return; }

        // Cargar alumnos activos
        const resAlumnos = await fetch('/api/alumnos');
        const dataAlumnos = await resAlumnos.json();
        setAlumnos(dataAlumnos.filter((a) => a.activo));

        setEstado('activa');
      } catch {
        setEstado('error');
      }
    };
    inicializar();
  }, [id]);

  // Cuenta regresiva
  useEffect(() => {
    if (!sesion || estado !== 'activa') return;
    const intervalo = setInterval(() => {
      const restante = new Date(sesion.expira_en) - new Date();
      if (restante <= 0) {
        setTiempoRestante(0);
        setEstado('expirada');
        clearInterval(intervalo);
      } else {
        setTiempoRestante(Math.floor(restante / 1000));
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [sesion, estado]);

  const formatearTiempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  };

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setConfirmando(true);
  };

  const cancelarConfirmacion = () => {
    setAlumnoSeleccionado(null);
    setConfirmando(false);
  };

  const confirmarAsistencia = async () => {
    if (!alumnoSeleccionado) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/sesiones/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: alumnoSeleccionado.nombre }),
      });

      if (res.status === 410) { setEstado('expirada'); return; }
      if (!res.ok) { setEstado('error'); return; }

      setEstado('registrado');
    } catch {
      setEstado('error');
    } finally {
      setEnviando(false);
    }
  };

  // — Pantallas según estado —

  if (estado === 'cargando') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-lg">Cargando...</p>
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
        <p className="text-green-700 text-lg font-medium">{alumnoSeleccionado?.nombre}</p>
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

  // Pantalla de confirmación
  if (confirmando && alumnoSeleccionado) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm text-center">
        <p className="text-4xl mb-4">👤</p>
        <h1 className="text-xl font-bold text-gray-800 mb-1">¿Eres tú?</h1>
        <p className="text-2xl font-bold text-blue-600 mb-6">{alumnoSeleccionado.nombre}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={confirmarAsistencia}
            disabled={enviando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {enviando ? 'Registrando...' : 'Sí, confirmar asistencia'}
          </button>
          <button
            onClick={cancelarConfirmacion}
            disabled={enviando}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
          >
            No, regresar
          </button>
        </div>
      </div>
    </div>
  );

  // Pantalla principal — lista de alumnos
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Registrar asistencia</h1>

        {tiempoRestante > 0 && (
          <p className="text-center text-sm text-gray-400 mb-6">
            Cierra en: <span className="font-mono text-red-500 font-semibold">{formatearTiempo(tiempoRestante)}</span>
          </p>
        )}

        {alumnos.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-400">No hay alumnos registrados aún.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 text-center mb-4">Toca tu nombre para registrar tu asistencia</p>
            {alumnos.map((a) => (
              <button
                key={a.id}
                onClick={() => seleccionarAlumno(a)}
                className="w-full bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-800 font-medium py-4 px-6 rounded-xl text-left transition shadow-sm"
              >
                {a.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}