import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Listar todos los alumnos
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, nombre, activo
      FROM alumnos
      ORDER BY nombre ASC
    `);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al listar alumnos' }, { status: 500 });
  }
}

// Agregar alumno
export async function POST(request) {
  try {
    const { nombre } = await request.json();

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO alumnos (nombre) VALUES ($1) RETURNING id, nombre, activo`,
      [nombre.trim().toUpperCase()]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al agregar alumno' }, { status: 500 });
  }
}