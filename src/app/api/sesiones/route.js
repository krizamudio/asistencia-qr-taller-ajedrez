import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

// Crear una nueva sesión (cuando el instructor genera el QR)
export async function POST() {
  try {
    const id = uuidv4();
    const minutosExpiracion = 20;

    const result = await pool.query(
      `INSERT INTO sesiones (id, expira_en)
       VALUES ($1, NOW() + INTERVAL '${minutosExpiracion} minutes')
       RETURNING id, creada_en, expira_en`,
      [id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al crear sesión' }, { status: 500 });
  }
}

// Listar todas las sesiones con su conteo de asistencias (para el panel)
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.creada_en, 
        s.expira_en,
        COUNT(a.id) AS total_asistencias
      FROM sesiones s
      LEFT JOIN asistencias a ON a.sesion_id = s.id
      GROUP BY s.id
      ORDER BY s.creada_en DESC
    `);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al listar sesiones' }, { status: 500 });
  }
}