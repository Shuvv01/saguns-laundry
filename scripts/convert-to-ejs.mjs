import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const viewsDir = path.join(root, 'views');
fs.mkdirSync(path.join(viewsDir, 'admin'), { recursive: true });

const files = [
  ['index.php', 'index.ejs'],
  ['pricing.php', 'pricing.ejs'],
  ['login.php', 'login.ejs'],
  ['register.php', 'register.ejs'],
  ['forgot-password.php', 'forgot-password.ejs'],
  ['dashboard.php', 'dashboard.ejs'],
  ['admin/login.php', 'admin/login.ejs'],
  ['admin/index.php', 'admin/index.ejs']
];

function expr(input) {
  let out = input.trim();
  out = out.replace(/\s*\/\*[\s\S]*?\*\/\s*/g, '');
  out = out.replace(/htmlspecialchars\(strip_tags\(\$([a-zA-Z_][\w]*)\)\)/g, 'stripTags($1)');
  out = out.replace(/htmlspecialchars\(\$([a-zA-Z_][\w]*)\)/g, '$1');
  out = out.replace(/date\('Y-m-d'\)/g, 'today');
  out = out.replace(/date\('Y'\)/g, 'year');
  out = out.replace(/\$([a-zA-Z_][\w]*)/g, '$1');
  out = out.replace(/===/g, '===');
  return out;
}

function convertEchos(source) {
  return source.replace(/<\?=\s*([\s\S]*?)\s*\?>/g, (_, raw) => {
    const js = expr(raw);
    const rawNames = ['icon', 'ico', 'price', 'unit', 'desc', 'a'];
    const rawOutput = rawNames.some((name) => js === name);
    return rawOutput ? `<%- ${js} %>` : `<%= ${js} %>`;
  });
}

function convertConditionals(source) {
  return source
    .replace(/<\?php\s+if \(\$isLoggedIn\):\s*\?>/g, '<% if (isLoggedIn) { %>')
    .replace(/<\?php\s+if \(!\$isLoggedIn\):\s*\?>/g, '<% if (!isLoggedIn) { %>')
    .replace(/<\?php\s+if \(\$activeTab === '([^']+)'\):\s*\?>/g, "<% if (activeTab === '$1') { %>")
    .replace(/<\?php\s+elseif \(\$activeTab === '([^']+)'\):\s*\?>/g, "<% } else if (activeTab === '$1') { %>")
    .replace(/<\?php\s+else:\s*\?>/g, '<% } else { %>')
    .replace(/<\?php\s+endif;\s*\?>/g, '<% } %>');
}

function convertLoops(source) {
  return source
    .replace(/<\?php\s*\$services = \[[\s\S]*?foreach \(\$services as \$i => \[\$icon,\$name,\$price,\$unit,\$desc,\$tags\]\):\s*\?>/g, '<% pricingServices.forEach(([icon, name, price, unit, desc, tags], i) => { %>')
    .replace(/<\?php\s*\$services = \[[\s\S]*?foreach \(\$services as \$i => \[\$icon,\s*\$name,\s*\$price,\s*\$unit,\s*\$desc,\s*\$tags\]\):\s*\?>/g, '<% homeServices.forEach(([icon, name, price, unit, desc, tags], i) => { %>')
    .replace(/<\?php\s*\$features = \[[\s\S]*?foreach \(\$features as \[\$icon,\s*\$title,\s*\$desc\]\):\s*\?>/g, '<% features.forEach(([icon, title, desc]) => { %>')
    .replace(/<\?php\s*\$rows = \[[\s\S]*?foreach \(\$rows as \[\$svc,\$rate\]\):\s*\?>/g, '<% pricingRows.forEach(([svc, rate]) => { %>')
    .replace(/<\?php\s*\$faqs = \[[\s\S]*?foreach \(\$faqs as \$i => \[\$q,\s*\$a\]\):\s*\?>/g, '<% faqs.forEach(([q, a], i) => { %>')
    .replace(/<\?php\s*\$statDefs = \[[\s\S]*?foreach \(\$statDefs as \[\$ico,\$lbl\]\):\s*\?>/g, '<% adminStatDefs.forEach(([ico, lbl]) => { %>')
    .replace(/<\?php\s+foreach \(\['Total Orders','In Progress','Delivered','Total Spent'\] as \$label\):\s*\?>/g, "<% ['Total Orders','In Progress','Delivered','Total Spent'].forEach((label) => { %>")
    .replace(/<\?php\s+foreach \(\$tags as \$tag\):\s*\?>/g, '<% tags.forEach((tag) => { %>')
    .replace(/<\?php\s+endforeach;\s*\?>/g, '<% }); %>');
}

function stripPreamble(source) {
  return source.replace(/^<\?php[\s\S]*?\?>\s*/, '');
}

for (const [input, output] of files) {
  let source = fs.readFileSync(path.join(root, input), 'utf8');
  source = stripPreamble(source);
  source = convertLoops(source);
  source = convertConditionals(source);
  source = convertEchos(source);
  source = source.replace(/<\?php[\s\S]*?\?>/g, '');
  fs.writeFileSync(path.join(viewsDir, output), source);
}
