function getCanonicalMachineName(raw) {
  let s = String(raw).trim();
  if (!s) return 'Unknown';
  
  // Replace multiple spaces and remove '#'
  let norm = s.replace(/#/g, '').replace(/\s+/g, ' ').toLowerCase();

  // Common aliases
  if (norm.match(/^(mix|mixer)\s*1$/)) return 'Mixer 1';
  if (norm.match(/^(mix|mixer)\s*2$/)) return 'Mixer 2';
  if (norm.match(/^hot\s*apex\s*2$/)) return 'Hot Apex 2';
  if (norm.match(/^bead\s*flapping\s*1$/) || norm === 'bead flap') return 'Bead Flapping 1';
  if (norm.match(/^4\s*roll\s*1$/)) return '4 Roll 1';
  if (norm.match(/^4\s*roll\s*2$/)) return '4 Roll 2';
  if (norm.match(/^3\s*roll$/)) return '3 Roll';
  if (norm.match(/^tuber\s*6"?x8"?$/)) return 'Tuber 6"x8"';
  if (norm.match(/^auto\s*pigment$/)) return 'Auto Pigment';
  if (norm.match(/^loading\s*carbon\s*1$/)) return 'Loading Carbon 1';

  // Capitalize words nicely
  return s.replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Test canonical names
['Mix 1', 'MIx 1', 'Mixer1', 'mix 1', 'Mix 2', 'MIx 2', 'Mixer2', 'mix2', 'Hot apex 2', 'Hot apex#2', 'Bead flapping # 1', 'bead flap', '4 Roll 1', '4roll1'].forEach(name => {
  console.log(`${name} => ${getCanonicalMachineName(name)}`);
});
