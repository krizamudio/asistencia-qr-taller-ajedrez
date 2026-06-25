import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Activar o desactivar alumno
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { activo } = await request.json();

    const result = await pool.query(
      `UPDATE alumnos SET activo = $1 WHERE id = $2 RETURNING id, nombre, activo`,
      [activo, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al actualizar alumno' }, { status: 500 });
  }
}