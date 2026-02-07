const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@10.0.1.155:5432/nextmavens',
  max: 20,
});

async function checkSchema() {
  try {
    // Check control_plane schema tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'control_plane'
      ORDER BY table_name;
    `);

    console.log('Tables in control_plane schema:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if public schema has relevant tables
    const publicResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('projects', 'tenants', 'api_keys', 'users', 'audit_logs', 'webhooks', 'background_jobs', 'usage_stats', 'usage_metrics')
      ORDER BY table_name;
    `);

    console.log('\nRelevant tables in public schema:');
    publicResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Get table details for key tables
    const tablesToCheck = [...result.rows.map(r => r.table_name), ...publicResult.rows.map(r => r.table_name)];

    for (const table of tablesToCheck) {
      console.log(`\nTable: ${table}`);
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = CASE
          WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'control_plane' AND table_name = $1) THEN 'control_plane'
          ELSE 'public'
        END
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ''}`);
      });
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
