const fs = require('fs');
const js = fs.readFileSync(__dirname + '/node_modules/.prisma/client/index.js', 'utf8');

// Extract runtimeDataModel JSON
const idx = js.indexOf('config.runtimeDataModel = JSON.parse("');
if (idx === -1) { console.log('NOT FOUND'); process.exit(1); }

let start = idx + 'config.runtimeDataModel = JSON.parse("'.length;
let depth = 0;
let end = start;
let escaped = false;
for (let i = start; i < js.length; i++) {
  if (escaped) { escaped = false; continue; }
  if (js[i] === '\\') { escaped = true; continue; }
  if (js[i] === '"') { end = i; break; }
}
const raw = JSON.parse(js.slice(start, end));
const so = raw.models.SalesOrder;
if (!so) { console.log('SalesOrder not found'); process.exit(1); }

console.log('=== RAW runtimeDataModel for SalesOrder ===');
console.log('Table (dbName):', so.dbName);
console.log('Schema:', so.schema);
console.log('');
console.log('Fields:');
so.fields.forEach(function(f) {
  var isStatus = f.name === 'status';
  var marker = isStatus ? ' <=======' : '';
  console.log(
    '  name:', f.name,
    'dbName:', f.dbName,
    'kind:', f.kind,
    'type:', f.type,
    marker
  );
});
