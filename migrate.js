/**
 * Migrates all schema + data from Neon (source) to local PostgreSQL (target).
 * Run: node migrate.js
 */

const { Client } = require('pg');

const SOURCE = 'postgresql://neondb_owner:npg_pyVGoCkL40sn@ep-icy-field-a4fiygmi-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const TARGET = 'postgresql://meetingagenda:123456789@localhost:5432/toastmaster_backend';

// pg may return array_agg results as strings; this normalizes them to JS arrays
function toArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val.replace(/^\{|\}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  }
  return val ? [val] : [];
}

async function run() {
  const src = new Client({ connectionString: SOURCE });
  const tgt = new Client({ connectionString: TARGET });

  await src.connect();
  console.log('Connected to Neon (source).');
  await tgt.connect();
  console.log('Connected to local PostgreSQL (target).\n');

  // ── 0. EXTENSIONS ─────────────────────────────────────────────────────────
  console.log('Enabling extensions...');
  const { rows: exts } = await src.query(`
    SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql')
  `);
  for (const ext of exts) {
    try {
      await tgt.query(`CREATE EXTENSION IF NOT EXISTS "${ext.extname}"`);
      console.log(`  Enabled extension: ${ext.extname}`);
    } catch (err) {
      console.warn(`  Extension warning (${ext.extname}): ${err.message}`);
    }
  }

  // ── 1. ENUM TYPES ──────────────────────────────────────────────────────────
  console.log('Creating enum types...');
  const { rows: enumRows } = await src.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `);
  // group by typname
  const enumMap = {};
  for (const row of enumRows) {
    if (!enumMap[row.typname]) enumMap[row.typname] = [];
    enumMap[row.typname].push(row.enumlabel);
  }
  const enums = Object.entries(enumMap).map(([typname, labels]) => ({ typname, labels }));
  for (const e of enums) {
    const labels = e.labels.map(l => `'${l}'`).join(', ');
    try {
      await tgt.query(`CREATE TYPE "${e.typname}" AS ENUM (${labels})`);
      console.log(`  Created enum: ${e.typname}`);
    } catch (err) {
      if (err.code === '42710') console.log(`  Enum already exists: ${e.typname}`);
      else throw err;
    }
  }

  // ── 1b. SEQUENCES ──────────────────────────────────────────────────────────
  console.log('Creating sequences...');
  const { rows: seqs } = await src.query(`
    SELECT sequence_name, start_value, minimum_value, maximum_value, increment, cycle_option
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  `);
  for (const s of seqs) {
    const cycle = s.cycle_option === 'YES' ? 'CYCLE' : 'NO CYCLE';
    try {
      await tgt.query(
        `CREATE SEQUENCE IF NOT EXISTS "${s.sequence_name}" ` +
        `START ${s.start_value} MINVALUE ${s.minimum_value} MAXVALUE ${s.maximum_value} ` +
        `INCREMENT ${s.increment} ${cycle}`
      );
      console.log(`  Created sequence: ${s.sequence_name}`);
    } catch (err) {
      console.warn(`  Sequence warning (${s.sequence_name}): ${err.message}`);
    }
  }

  // ── 2. TABLES (schema) ─────────────────────────────────────────────────────
  console.log('\nCreating tables...');
  const { rows: tables } = await src.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  for (const { tablename } of tables) {
    const { rows: cols } = await src.query(`
      SELECT column_name, data_type, character_maximum_length,
             numeric_precision, numeric_scale, is_nullable,
             column_default, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tablename]);

    const colDefs = cols.map(col => {
      let type = col.data_type;
      if (type === 'character varying') type = col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
      else if (type === 'character') type = `CHAR(${col.character_maximum_length || 1})`;
      else if (type === 'numeric') type = col.numeric_precision ? `NUMERIC(${col.numeric_precision},${col.numeric_scale ?? 0})` : 'NUMERIC';
      else if (type === 'USER-DEFINED') type = `"${col.udt_name}"`;
      else if (type === 'ARRAY') type = col.udt_name.replace(/^_/, '') + '[]';
      else type = type.toUpperCase();

      let def = `  "${col.column_name}" ${type}`;
      if (col.column_default) def += ` DEFAULT ${col.column_default}`;
      if (col.is_nullable === 'NO') def += ' NOT NULL';
      return def;
    });

    try {
      await tgt.query(`CREATE TABLE IF NOT EXISTS "${tablename}" (\n${colDefs.join(',\n')}\n)`);
      console.log(`  Created table: ${tablename}`);
    } catch (err) {
      console.error(`  Error creating ${tablename}: ${err.message}`);
      throw err;
    }
  }

  // ── 3. PRIMARY KEYS ────────────────────────────────────────────────────────
  console.log('\nAdding primary keys...');
  const { rows: pks } = await src.query(`
    SELECT tc.table_name, tc.constraint_name,
           array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
    GROUP BY tc.table_name, tc.constraint_name
  `);
  for (const pk of pks) {
    const cols = toArray(pk.columns).map(c => `"${c}"`).join(', ');
    try {
      await tgt.query(`ALTER TABLE "${pk.table_name}" ADD CONSTRAINT "${pk.constraint_name}" PRIMARY KEY (${cols})`);
    } catch (err) {
      if (err.code !== '42710' && err.code !== '23505' && !err.message.includes('already exists')) throw err;
    }
  }

  // ── 4. DATA ────────────────────────────────────────────────────────────────
  console.log('\nMigrating data...');
  await tgt.query('SET session_replication_role = replica');

  for (const { tablename } of tables) {
    const { rows: data } = await src.query(`SELECT * FROM "${tablename}"`);
    if (data.length === 0) { console.log(`  ${tablename}: 0 rows`); continue; }

    await tgt.query(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`);

    const colNames = Object.keys(data[0]);
    const cols = colNames.map(c => `"${c}"`).join(', ');

    let inserted = 0;
    for (const row of data) {
      const values = colNames.map((_, i) => `$${i + 1}`).join(', ');
      const vals = colNames.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return null;
        if (typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
        return v;
      });
      try {
        await tgt.query(`INSERT INTO "${tablename}" (${cols}) VALUES (${values})`, vals);
        inserted++;
      } catch (err) {
        console.error(`  Row insert error in ${tablename}: ${err.message}`);
      }
    }
    console.log(`  ${tablename}: ${inserted}/${data.length} rows migrated`);
  }

  await tgt.query('SET session_replication_role = DEFAULT');

  // ── 5. FOREIGN KEYS ────────────────────────────────────────────────────────
  console.log('\nAdding foreign keys...');
  const { rows: fks } = await src.query(`
    SELECT tc.table_name, tc.constraint_name,
           array_agg(kcu.column_name ORDER BY kcu.position_in_unique_constraint) AS columns,
           ccu.table_name AS foreign_table,
           array_agg(ccu.column_name ORDER BY kcu.position_in_unique_constraint) AS foreign_columns,
           rc.update_rule, rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name AND rc.unique_constraint_schema = ccu.table_schema
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
    GROUP BY tc.table_name, tc.constraint_name, ccu.table_name, rc.update_rule, rc.delete_rule
  `);
  for (const fk of fks) {
    const cols = toArray(fk.columns).map(c => `"${c}"`).join(', ');
    const fCols = toArray(fk.foreign_columns).map(c => `"${c}"`).join(', ');
    try {
      await tgt.query(
        `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" ` +
        `FOREIGN KEY (${cols}) REFERENCES "${fk.foreign_table}" (${fCols}) ` +
        `ON UPDATE ${fk.update_rule} ON DELETE ${fk.delete_rule}`
      );
    } catch (err) {
      if (!err.message.includes('already exists')) console.warn(`  FK warning: ${err.message}`);
    }
  }

  // ── 6. UNIQUE CONSTRAINTS ──────────────────────────────────────────────────
  console.log('\nAdding unique constraints...');
  const { rows: uqs } = await src.query(`
    SELECT tc.table_name, tc.constraint_name,
           array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'UNIQUE'
    GROUP BY tc.table_name, tc.constraint_name
  `);
  for (const uq of uqs) {
    const cols = toArray(uq.columns).map(c => `"${c}"`).join(', ');
    try {
      await tgt.query(`ALTER TABLE "${uq.table_name}" ADD CONSTRAINT "${uq.constraint_name}" UNIQUE (${cols})`);
    } catch (err) {
      if (!err.message.includes('already exists')) console.warn(`  Unique constraint warning: ${err.message}`);
    }
  }

  // ── 7. INDEXES ─────────────────────────────────────────────────────────────
  console.log('\nCreating indexes...');
  const { rows: indexes } = await src.query(`
    SELECT indexdef FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT IN (
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_schema = 'public'
      )
  `);
  for (const idx of indexes) {
    try { await tgt.query(idx.indexdef); }
    catch (err) { if (!err.message.includes('already exists')) console.warn(`  Index warning: ${err.message}`); }
  }

  await src.end();
  await tgt.end();
  console.log('\nMigration complete! Local database is ready.');
}

run().catch(err => { console.error('\nFatal error:', err.message); process.exit(1); });
