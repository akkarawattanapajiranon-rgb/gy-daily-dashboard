/**
 * Shared utility for month matching and sheet/file discovery across all modules
 */

const MONTH_ALIASES = {
  1: ['jan', 'january', '01', '1.'],
  2: ['feb', 'february', '02', '2.'],
  3: ['mar', 'march', '03', '3.'],
  4: ['apr', 'april', '04', '4.'],
  5: ['may', '05', '5.'],
  6: ['jun', 'june', '06', '6.'],
  7: ['jul', 'july', '07', '7.'],
  8: ['aug', 'augus', 'august', '08', '8.'],
  9: ['sep', 'september', '09', '9.'],
  10: ['oct', 'october', '10.'],
  11: ['nov', 'november', '11.'],
  12: ['dec', 'december', '12.']
};

/**
 * Returns true if filename or sheet name matches the monthNum (1..12)
 */
function matchesMonth(nameStr, monthNum) {
  if (!nameStr) return false;
  const l = String(nameStr).toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = MONTH_ALIASES[monthNum] || [];
  return aliases.some(alias => l.includes(alias.replace(/[^a-z0-9]/g, '')));
}

/**
 * Find file in folder matching monthNum and keywords
 */
function findMonthlyFile(files, monthNum, yearStr, keywords = []) {
  const mStr = String(monthNum);
  const mPad = mStr.padStart(2, '0');
  const yearShort = yearStr ? yearStr.slice(2) : '26';

  return files.find(f => {
    if (f.startsWith('~$')) return false; // Ignore temp excel files
    const l = f.toLowerCase();

    // Check year if relevant
    const hasYear = !yearStr || l.includes(yearStr) || l.includes(yearShort);

    // Check keywords if provided
    const hasKeywords = keywords.every(kw => l.includes(kw.toLowerCase()));

    // Check month
    const hasMonth = matchesMonth(l, monthNum) || l.includes(`${mStr}.`) || l.includes(`${mPad}.`) || l.includes(`${mStr} `) || l.includes(`${mPad} `);

    return hasYear && hasKeywords && hasMonth;
  });
}

/**
 * Find sheet in workbook matching monthNum and keywords
 */
function findMonthlySheet(sheetNames, monthNum, yearStr, keywords = []) {
  const yearShort = yearStr ? yearStr.slice(2) : '26';

  // 1. Try matching both year and month and keywords
  let matched = sheetNames.find(s => {
    const l = s.toLowerCase();
    const hasYear = !yearStr || l.includes(yearStr) || l.includes(yearShort);
    const hasMonth = matchesMonth(l, monthNum);
    const hasKw = keywords.every(kw => l.includes(kw.toLowerCase()));
    return hasYear && hasMonth && hasKw;
  });

  if (matched) return matched;

  // 2. Try matching month and keywords
  matched = sheetNames.find(s => {
    const l = s.toLowerCase();
    const hasMonth = matchesMonth(l, monthNum);
    const hasKw = keywords.every(kw => l.includes(kw.toLowerCase()));
    return hasMonth && hasKw;
  });

  if (matched) return matched;

  // 3. Fallback: match month only
  return sheetNames.find(s => matchesMonth(s, monthNum));
}

module.exports = {
  MONTH_ALIASES,
  matchesMonth,
  findMonthlyFile,
  findMonthlySheet
};
