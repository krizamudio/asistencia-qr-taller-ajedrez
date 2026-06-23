'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SesionExpirada() {
  const router = useRouter();

  const volverALogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sesión bloqueada</h1>
        <p className="text-gray-500 mb-6">
          El panel se bloqueó por inactividad. Vuelve a ingresar tu contraseña para continuar.
        </p>
        <button
          onClick={volverALogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
}