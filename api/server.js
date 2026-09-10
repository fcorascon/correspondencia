const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgres://postgres:postgres@db:5432/correspondencia'
});
const PORT = parseInt(process.env.PORT || '3001', 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/uploads';

app.use(express.json({ limit: '50mb' }));

/* ── helpers ─────────────────────────────────────────── */

function buildWhere(filters, startIdx = 1) {
  const parts = [];
  const params = [];
  let idx = startIdx;
  for (const [key, value] of Object.entries(filters)) {
    const m = /^eq\.(.*)$/.exec(value);
    if (m) {
      parts.push(`"${key}" = $${idx++}`);
      params.push(m[1]);
    }
  }
  return { clause: parts.length ? 'WHERE ' + parts.join(' AND ') : '', params, nextIdx: idx };
}

function isSingle(req) {
  const a = req.get('Accept') || '';
  return a.includes('application/vnd.pgrst.object+json');
}

/* ── Storage (must come before /:table routes) ───────── */

const upload = multer({ storage: multer.memoryStorage() });

app.post('/object/attachments/*', upload.any(), (req, res) => {
  const filePath = req.params[0];
  const file = req.files && req.files[0];
  if (!file) return res.status(400).json({ error: 'No file provided' });
  const fullPath = path.join(UPLOAD_DIR, 'attachments', filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.buffer);
  res.status(200).json({ Id: Date.now().toString(), Key: `attachments/${filePath}`, path: filePath });
});

app.get('/object/public/attachments/*', (req, res) => {
  const filePath = req.params[0];
  const fullPath = path.join(UPLOAD_DIR, 'attachments', filePath);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(fullPath);
});

/* ── REST API (PostgREST-compatible subset) ──────────── */

// GET /:table  — select, order, eq filters
app.get('/:table', async (req, res) => {
  const { table } = req.params;
  const { select, order, ...filters } = req.query;

  const selectCols = select === '*' ? '*' :
    select.split(',').map(c => `"${c.trim()}"`).join(',');

  const { clause, params } = buildWhere(filters);

  let orderClause = '';
  if (order) {
    const [col, dir] = order.split('.');
    orderClause = `ORDER BY "${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  }

  try {
    const sql = `SELECT ${selectCols} FROM "${table}" ${clause} ${orderClause}`;
    const result = await pool.query(sql, params);

    if (isSingle(req)) {
      if (result.rows.length === 0)
        return res.status(406).json({ code: 'PGRST116', message: 'JSON object requested,with result of 0 rows' });
      if (result.rows.length > 1)
        return res.status(406).json({ code: 'PGRST116', message: 'JSON object requested,with result of multiple rows' });
      return res.json(result.rows[0]);
    }

    const total = result.rows.length;
    res.set('Content-Range', `0-${total ? total - 1 : 0}/${total}`);
    res.set('Range-Unit', 'items');
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:table — insert (body is array or single object)
app.post('/:table', async (req, res) => {
  const { table } = req.params;
  const body = Array.isArray(req.body) ? req.body[0] : req.body;
  if (!body || typeof body !== 'object')
    return res.status(400).json({ message: 'Invalid body' });

  const cols = Object.keys(body);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const params = cols.map(c => body[c]);

  try {
    const colList = cols.map(c => `"${c}"`).join(',');
    const sql = `INSERT INTO "${table}" (${colList}) VALUES (${vals.join(',')}) RETURNING *`;
    const result = await pool.query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /:table — update with eq filters
app.patch('/:table', async (req, res) => {
  const { table } = req.params;
  const body = req.body;
  const { ...filters } = req.query;

  const cols = Object.keys(body);
  const setParts = [];
  const params = [];
  let idx = 1;
  for (const c of cols) {
    setParts.push(`"${c}" = $${idx++}`);
    params.push(body[c]);
  }

  const w = buildWhere(filters, idx);

  try {
    const sql = `UPDATE "${table}" SET ${setParts.join(',')} ${w.clause} RETURNING *`;
    const result = await pool.query(sql, [...params, ...w.params]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /:table — delete with eq filters
app.delete('/:table', async (req, res) => {
  const { table } = req.params;
  const { ...filters } = req.query;
  const w = buildWhere(filters);

  try {
    const sql = `DELETE FROM "${table}" ${w.clause}`;
    await pool.query(sql, w.params);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => console.log(`API+Storage server on port ${PORT}`));
