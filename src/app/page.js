'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { useInactividad } from '@/lib/useInactividad';

export default function Home() {
  const [sesionActual, setSesionActual] = useState(null);
  const [qrImagen, setQrImagen] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [sesiones, setSesiones] = useState([]);
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [asistentesDetalle, setAsistentesDetalle] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [tabActiva, setTabActiva] = useState('sesiones'); // 'sesiones' | 'alumnos'

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useInactividad(3);

  const cargarSesiones = useCallback(async () => {
    const res = await fetch('/api/sesiones');
    const data = await res.json();
    setSesiones(data);
  }, []);

  const cargarAlumnos = useCallback(async () => {
    const res = await fetch('/api/alumnos');
    const data = await res.json();
    setAlumnos(data);
  }, []);

  useEffect(() => {
    cargarSesiones();
    cargarAlumnos();
  }, [cargarSesiones, cargarAlumnos]);

  const generarSesion = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/sesiones', { method: 'POST' });
      const data = await res.json();
      setSesionActual(data);
      const url = `${baseUrl}/asistencia/${data.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      setQrImagen(qrDataUrl);
      cargarSesiones();
    } catch {
      alert('Error al generar la sesión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!sesionActual) return;
    const intervalo = setInterval(() => {
      const restante = new Date(sesionActual.expira_en) - new Date();
      if (restante <= 0) {
        setTiempoRestante(0);
        clearInterval(intervalo);
      } else {
        setTiempoRestante(Math.floor(restante / 1000));
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [sesionActual]);

  const formatearTiempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  };

  const verDetalle = async (id) => {
    if (detalleAbierto === id) {
      setDetalleAbierto(null);
      return;
    }
    const res = await fetch(`/api/sesiones/${id}`);
    const data = await res.json();
    setAsistentesDetalle(data.asistencias);
    setDetalleAbierto(id);
    await cargarSesiones();
  };

  const exportarCSV = (sesion, asistentes) => {
    const fecha = new Date(sesion.creada_en).toLocaleString('es-MX');
    let csv = 'Nombre,Fecha de registro\n';
    asistentes.forEach((a) => {
      csv += `${a.nombre},${new Date(a.registrado_en).toLocaleString('es-MX')}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `asistencia_${fecha.replace(/[/:, ]/g, '_')}.csv`;
    link.click();
  };

  const eliminarSesion = async (id) => {
    const confirmar = window.confirm('¿Seguro que quieres eliminar esta sesión y toda su asistencia? Esta acción no se puede deshacer.');
    if (!confirmar) return;
    await fetch(`/api/sesiones/${id}`, { method: 'DELETE' });
    await cargarSesiones();
    if (detalleAbierto === id) setDetalleAbierto(null);
  };

  const agregarAlumno = async () => {
    if (!nuevoNombre.trim()) return;
    setAgregando(true);
    try {
      await fetch('/api/alumnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre }),
      });
      setNuevoNombre('');
      await cargarAlumnos();
    } catch {
      alert('Error al agregar alumno');
    } finally {
      setAgregando(false);
    }
  };

  const toggleAlumno = async (id, activoActual) => {
    await fetch(`/api/alumnos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !activoActual }),
    });
    await cargarAlumnos();
  };

  const alumnosActivos = alumnos.filter((a) => a.activo);
  const alumnosInactivos = alumnos.filter((a) => !a.activo);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Asistencia QR — Taller</h1>
        <p className="text-gray-500 mb-6">Panel del instructor</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTabActiva('sesiones')}
            className={`pb-3 px-4 text-sm font-medium transition border-b-2 ${
              tabActiva === 'sesiones'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sesiones
          </button>
          <button
            onClick={() => setTabActiva('alumnos')}
            className={`pb-3 px-4 text-sm font-medium transition border-b-2 ${
              tabActiva === 'alumnos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Alumnos ({alumnosActivos.length})
          </button>
        </div>

        {/* Tab: Sesiones */}
        {tabActiva === 'sesiones' && (
          <>
            {/* Generador de QR */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              {!sesionActual || tiempoRestante <= 0 ? (
                <button
                  onClick={generarSesion}
                  disabled={cargando}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {cargando ? 'Generando...' : '+ Generar QR de hoy'}
                </button>
              ) : (
                <div className="text-center">
                  <img src={qrImagen} alt="QR de asistencia" className="mx-auto mb-4 rounded-lg" />
                  <p className="text-lg font-mono text-gray-700">
                    Expira en: <span className="font-bold text-red-600">{formatearTiempo(tiempoRestante)}</span>
                  </p>
                  <button
                    onClick={generarSesion}
                    className="mt-4 text-sm text-blue-600 hover:underline"
                  >
                    Generar uno nuevo
                  </button>
                </div>
              )}
            </div>

            {/* Historial */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Historial de clases</h2>
              {sesiones.length === 0 && (
                <p className="text-gray-400">Aún no hay sesiones registradas.</p>
              )}
              <div className="space-y-3">
                {sesiones.map((s) => (
                  <div key={s.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(s.creada_en).toLocaleString('es-MX', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}
                        </p>
                        <p className="text-sm text-gray-500">{s.total_asistencias} asistente(s)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => verDetalle(s.id)}
                          className="text-blue-600 text-sm font-medium hover:underline"
                        >
                          {detalleAbierto === s.id ? 'Ocultar' : 'Ver detalle'}
                        </button>
                        <button
                          onClick={() => eliminarSesion(s.id)}
                          className="text-red-500 text-sm font-medium hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {detalleAbierto === s.id && (
                      <div className="mt-4 border-t pt-4">
                        {asistentesDetalle.length === 0 ? (
                          <p className="text-gray-400 text-sm">Nadie registró asistencia.</p>
                        ) : (
                          <>
                            <ul className="space-y-1 mb-3">
                              {asistentesDetalle.map((a, i) => (
                                <li key={i} className="text-sm text-gray-700 flex justify-between">
                                  <span>{a.nombre}</span>
                                  <span className="text-gray-400">
                                    {new Date(a.registrado_en).toLocaleTimeString('es-MX')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <button
                              onClick={() => exportarCSV(s, asistentesDetalle)}
                              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded border border-gray-300"
                            >
                              Exportar a CSV
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tab: Alumnos */}
        {tabActiva === 'alumnos' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Gestión de alumnos</h2>

            {/* Agregar alumno */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && agregarAlumno()}
                placeholder="NOMBRE DEL ALUMNO"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm uppercase font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={agregarAlumno}
                disabled={agregando || !nuevoNombre.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
              >
                {agregando ? 'Agregando...' : 'Agregar'}
              </button>
            </div>

            {/* Alumnos activos */}
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Activos ({alumnosActivos.length})
            </h3>
            {alumnosActivos.length === 0 ? (
              <p className="text-gray-400 text-sm mb-4">No hay alumnos activos.</p>
            ) : (
              <ul className="space-y-2 mb-6">
                {alumnosActivos.map((a) => (
                  <li key={a.id} className="flex justify-between items-center border rounded-lg px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">{a.nombre}</span>
                    <button
                      onClick={() => toggleAlumno(a.id, a.activo)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Desactivar
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Alumnos inactivos */}
            {alumnosInactivos.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Inactivos ({alumnosInactivos.length})
                </h3>
                <ul className="space-y-2">
                  {alumnosInactivos.map((a) => (
                    <li key={a.id} className="flex justify-between items-center border border-dashed rounded-lg px-4 py-3 opacity-60">
                      <span className="text-sm font-medium text-gray-500">{a.nombre}</span>
                      <button
                        onClick={() => toggleAlumno(a.id, a.activo)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Reactivar
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}