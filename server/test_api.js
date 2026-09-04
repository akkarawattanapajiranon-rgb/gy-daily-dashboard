const http = require('http');
http.get('http://localhost:3001/api/breakdown?date=2026-08-14', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Body:', d.substring(0, 300));
  });
}).on('error', e => console.error('Error:', e.message));
