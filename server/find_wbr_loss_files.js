const fs = require('fs');
const path = require('path');

const baseDir = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026';

console.log('Checking directory:', baseDir);
if (fs.existsSync(baseDir)) {
  const files = fs.readdirSync(baseDir);
  console.log('Files found:', files);
} else {
  console.log('Directory does not exist! Searching parent directories...');
  const parent = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR';
  if (fs.existsSync(parent)) {
    console.log('Parent contents:', fs.readdirSync(parent));
  } else {
    console.log('Parent does not exist!');
  }
}
