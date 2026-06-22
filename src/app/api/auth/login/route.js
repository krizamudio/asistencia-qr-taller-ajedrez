import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (password !== process.env.PANEL_PASSWORD) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Guardar sesión en cookie (dura 8 horas)
    response.cookies.set('panel_auth', process.env.PANEL_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}