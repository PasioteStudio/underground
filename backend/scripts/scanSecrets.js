#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const ignoreNames = new Set(['node_modules', '.git', 'generated', '.next', 'dist', 'build', 'scripts', 'out', 'frontend/out']);
const patterns = [
  { re: /BEGIN( RSA)? PRIVATE KEY/i, name: 'Private key header' },
  { re: /PRIVATE KEY/i, name: 'Private key' },
  { re: /(AKIA|ASIA)[A-Z0-9]{16}/, name: 'AWS access key pattern' },
  { re: /aws_secret_access_key|aws_access_key_id|AWS_SECRET_ACCESS_KEY/i, name: 'AWS env var' },
  { re: /(?:CLIENT_SECRET|JWT_SECRET|SECRET|API_KEY|PASSWORD|PASS|TOKEN)/i, name: 'Potential secret keyword' },
  { re: /AIza[0-9A-Za-z-_]{35}/, name: 'Google API key' },
  { re: /ssh-rsa|ssh-ed25519/i, name: 'SSH key' },
];

let findings = [];

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }
  for (const ent of entries) {
    if (ignoreNames.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
    } else {
      // skip binary files by extension
      const ext = path.extname(ent.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.wasm', '.exe', '.dll'].includes(ext)) continue;
      let content;
      try {
        content = fs.readFileSync(full, 'utf8');
      } catch (e) {
        continue;
      }
      for (const p of patterns) {
        const match = content.match(p.re);
        if (match) {
          findings.push({ file: full, match: match[0], pattern: p.name });
        }
      }
    }
  }
}

walk(root);
if (findings.length) {
  console.log('Potential secrets found (quick scan):');
  findings.forEach((f) => console.log(`${f.pattern} — ${f.file} — ${f.match}`));
  console.log('\nRecommendation: review the listed files, rotate any exposed secrets, and use a proper secret-scanning tool (git-secrets / truffleHog / detect-secrets) for historical commits.');
  process.exitCode = 2;
} else {
  console.log('No obvious secrets found (quick scan).');
}
