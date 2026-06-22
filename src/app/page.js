'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

export default function Home() {
  const [sesionActual, setSesionActual] = useState(null);
  const [qrImagen, setQrImagen] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [sesiones, setSesiones] = useState([]);
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [asistentesDetalle, setAsistentesDetalle] = useState([]);
  const [cargando, setCargando] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const cargarSesiones = useCallback(async () => {
    const res = await fetch('/api/sesiones');
    const data = await res.json();
    setSesiones(data);
  }, []);

  useEffect(() => {
    cargarSesiones();
  }, [cargarSesiones]);

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
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Asistencia QR — Taller</h1>
        <p className="text-gray-500 mb-8">Panel del instructor</p>

        {/* Generador de QR */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
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

        {/* Historial de sesiones */}
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
                    <p className="text-sm text-gray-500">
                      {s.total_asistencias} asistente(s)
                    </p>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}