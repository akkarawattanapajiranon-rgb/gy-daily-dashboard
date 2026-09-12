import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, error: 'Invalid date parameter' });
  }

  const possiblePaths = [
    path.join(process.cwd(), 'public', 'data', 'extruder', date + '.json'),
    path.join(process.cwd(), 'dist', 'data', 'extruder', date + '.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const fileData = fs.readFileSync(p, 'utf8');
        return res.status(200).json(JSON.parse(fileData));
      } catch (err) {
        console.error('[Vercel extruder-timeline] Read error:', err);
      }
    }
  }

  return res.status(404).json({
    success: false,
    error: 'Extruder timeline data for ' + date + ' not found on cloud cache.'
  });
}