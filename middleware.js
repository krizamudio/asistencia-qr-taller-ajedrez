import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Rutas públicas — no requieren autenticación
  const esPublica =
    pathname.startsWith('/asistencia') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/sesion-expirada') ||
    pathname.startsWith('/api/sesiones');

  if (esPublica) return NextResponse.next();

  // Verificar cookie de sesión
  const auth = request.cookies.get('panel_auth');
  const esValida = auth?.value === process.env.PANEL_PASSWORD;

  if (!esValida) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};