const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\Alaa Mohamed\\erp-system\\dist\\assets';
const files = fs.readdirSync(dir).filter(f => f.includes('SalesRepPortal'));
const buf = fs.readFileSync(path.join(dir, files[0]));
const txt = buf.toString('utf8');
const lookups = ['العملاء', 'المخزن', 'العهدة', 'البيع', 'الطلبات'];
for (const s of lookups) {
  const idx = txt.indexOf(s);
  if (idx >= 0) {
    console.log('FOUND: "' + s + '" at offset ' + idx);
  } else {
    console.log('NOT FOUND: "' + s + '"');
  }
}
// Also search for the mojibake equivalents
const mojibake = ['Ø', 'Ù', 'Øª', 'Ø§', 'Ù\u008A'];
for (const m of mojibake) {
  if (txt.includes(m)) {
    console.log('MOJIBAKE FOUND: "' + m + '" at index ' + txt.indexOf(m));
  } else {
    console.log('no mojibake: ' + m);
  }
}
// Show a sample of what's around where we'd expect text
const idx = txt.indexOf('items');
if (idx >= 0) {
  console.log('Context around "items":');
  console.log(txt.substring(Math.max(0, idx-10), idx+50));
}
