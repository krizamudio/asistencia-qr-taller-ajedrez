require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alumnos (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        creado_en TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Tabla alumnos creada correctamente');
  } catch (err) {
    console.error('❌ Error creando tabla:', err);
  } finally {
    await pool.end();
  }
}

setup();