require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sesiones (
        id UUID PRIMARY KEY,
        creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expira_en TIMESTAMPTZ NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id SERIAL PRIMARY KEY,
        sesion_id UUID NOT NULL REFERENCES sesiones(id),
        nombre TEXT NOT NULL,
        registrado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Tablas creadas correctamente');
  } catch (err) {
    console.error('❌ Error creando tablas:', err);
  } finally {
    await pool.end();
  }
}

setup();