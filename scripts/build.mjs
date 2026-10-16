import { cpSync, mkdirSync, rmSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'about.html', 'experience.html', 'certifications.html', 'style.css', 'script.js', 'images']) {
  cpSync(new URL(file, root), new URL(file, output), { recursive: true });
}
console.log('Static portfolio built in dist/');
