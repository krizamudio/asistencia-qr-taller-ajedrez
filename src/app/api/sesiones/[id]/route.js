import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Obtener info de una sesión específica + su lista de asistentes
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const sesion = await pool.query(
      `SELECT id, creada_en, expira_en FROM sesiones WHERE id = $1`,
      [id]
    );

    if (sesion.rows.length === 0) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const asistencias = await pool.query(
      `SELECT nombre, registrado_en FROM asistencias WHERE sesion_id = $1 ORDER BY registrado_en ASC`,
      [id]
    );

    return NextResponse.json({
      sesion: sesion.rows[0],
      asistencias: asistencias.rows,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener sesión' }, { status: 500 });
  }
}

// Registrar asistencia de un alumno a esta sesión
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { nombre } = await request.json();

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Verificar que la sesión existe y no ha expirado
    const sesion = await pool.query(
      `SELECT id, expira_en FROM sesiones WHERE id = $1`,
      [id]
    );

    if (sesion.rows.length === 0) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const expirada = new Date(sesion.rows[0].expira_en) < new Date();
    if (expirada) {
      return NextResponse.json({ error: 'expirada' }, { status: 410 });
    }

    await pool.query(
      `INSERT INTO asistencias (sesion_id, nombre) VALUES ($1, $2)`,
      [id, nombre.trim().toUpperCase()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al registrar asistencia' }, { status: 500 });
  }
}

// Eliminar una sesión y sus asistencias
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Primero borramos las asistencias (por la restricción de foreign key)
    await pool.query(
      `DELETE FROM asistencias WHERE sesion_id = $1`,
      [id]
    );

    // Luego borramos la sesión
    await pool.query(
      `DELETE FROM sesiones WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar sesión' }, { status: 500 });
  }
}