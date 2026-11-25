// Run by Vercel on every deploy (see vercel.json). Nothing to run by hand and
// nothing to install: keep editing index.html, css/styles.css and js/main.js.
// It copies the site into dist/, removes comments and indentation, and puts
// the CSS and JavaScript inside the page so it opens with a single request.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const dist = path.join(root, 'dist');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const write = (f, text) => {
  const to = path.join(dist, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, text);
};
// Replace exactly one occurrence, or stop so a broken page is never deployed
const swap = (text, from, to) => {
  if (text.split(from).length !== 2) throw new Error('Expected exactly one: ' + from);
  return text.replace(from, () => to);
};

// Comments and spacing only; text inside quotes is left alone
const minCss = (css) => css
  .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\//g, (m, str) => str || '')
  .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\s+/g, (m, str) => str || ' ')
  .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\s*([{};,])\s*/g, (m, str, mark) => str || mark)
  .replace(/;}/g, '}')
  .trim();

// Whole-line comments and indentation only; the code itself is not rewritten
const minJs = (js) => {
  if (/`/.test(js.replace(/^\s*\/\/.*$/gm, ''))) throw new Error('main.js uses a template literal: teach build.js about it first');
  return js.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).join('\n');
};

fs.rmSync(dist, { recursive: true, force: true });

const css = minCss(read('css/styles.css'));
write('css/styles.css', css); // the 404 page uses it

const js = minJs(read('js/main.js'));
new Function(js); // stops the deploy if the script has a syntax error
if (/<\/script|<!--/i.test(js)) throw new Error('main.js must not contain script tags or HTML comments');

let html = read('index.html');
html = swap(html, '  <link rel="stylesheet" href="css/styles.css">\n',
  '  <style>' + css.replace(/\.\.\/assets\//g, 'assets/') + '</style>\n');
html = swap(html, '  <script src="js/main.js" defer></script>\n', '');
html = swap(html, '</body>', '<script>' + js + '</script>\n</body>');

// Security rules: only the scripts written in this page may run
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => "'sha256-" + crypto.createHash('sha256').update(m[1]).digest('base64') + "'");
if (hashes.length !== (html.match(/<script(?! type="application\/ld\+json")/g) || []).length) throw new Error('A script tag was not covered by the security rules');
const csp = [
  "default-src 'self'",
  'script-src ' + hashes.join(' ') + " 'strict-dynamic'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' https://formsubmit.co",
  "form-action 'self' https://formsubmit.co",
  "object-src 'none'",
  "base-uri 'none'",
  "require-trusted-types-for 'script'"
].join('; ');
html = swap(html, '  <meta charset="utf-8">\n',
  '  <meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="' + csp + '">\n');
write('index.html', html);
write('404.html', read('404.html'));
['CREDITS.md', 'robots.txt', 'sitemap.xml'].forEach((f) => write(f, read(f)));

// Pictures and fonts, minus the original photo the site does not use
fs.cpSync(path.join(root, 'assets'), path.join(dist, 'assets'), {
  recursive: true,
  filter: (src) => path.basename(src) !== 'danil-source.jpg'
});

console.log('Built dist/: page ' + html.length + ' characters, CSS ' + css.length + ', JS ' + js.length);
