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

  const possiblePaths = [
    path.join(process.cwd(), 'src', 'data', 'lsp_data_cache.json'),
    path.join(process.cwd(), 'server', 'lsp_data_cache.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const fileData = fs.readFileSync(p, 'utf8');
        return res.status(200).json(JSON.parse(fileData));
      } catch (err) {
        console.error('[Vercel lsp] Read error:', err);
      }
    }
  }

  return res.status(404).json({ success: false, error: 'LSP cache not found' });
}