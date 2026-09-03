const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('login_form.html', 'utf8');
const $ = cheerio.load(html);
const form = $('form[name="parameterform"]');
const data = {};

form.find('input, select, textarea').each((i, el) => {
  const name = $(el).attr('name');
  let value = $(el).val();

  // If it's a checkbox/radio, only get value if it's checked (unless we want all defaults)
  if ($(el).attr('type') === 'checkbox' || $(el).attr('type') === 'radio') {
    if (!$(el).prop('checked')) {
      return; // skip unchecked
    }
  }

  if (name && value !== undefined) {
    if (data[name]) {
      if (Array.isArray(data[name])) data[name].push(value);
      else data[name] = [data[name], value];
    } else {
      data[name] = value;
    }
  }
});
console.log(JSON.stringify(data, null, 2));
