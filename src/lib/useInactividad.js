import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useInactividad(minutosLimite = 3) {
  const router = useRouter();
  const timerRef = useRef(null);

  const cerrarSesion = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/sesion-expirada');
  }, [router]);

  const resetearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(cerrarSesion, minutosLimite * 60 * 1000);
  }, [cerrarSesion, minutosLimite]);

  useEffect(() => {
    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    eventos.forEach((evento) => window.addEventListener(evento, resetearTimer));
    resetearTimer(); // iniciar el timer al montar

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, resetearTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetearTimer]);
}