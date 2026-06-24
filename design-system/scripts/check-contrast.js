#!/usr/bin/env node
// Checks WCAG AA contrast (4.5:1) for all semantic bg/fg token pairs.
// Exit 1 if any pair fails — used as a CI gate on every PR.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(__dirname, rel), 'utf8'));
}

const core     = readJson('../tokens/core.json');
const semantic = readJson('../tokens/semantic.json');

// Load all brand files automatically
const brandsDir = resolve(__dirname, '../tokens/brands');
const brands = readdirSync(brandsDir)
  .filter(f => f.endsWith('.json'))
  .map(f => ({ name: basename(f, '.json').replace('brand-', ''), file: readJson(`../tokens/brands/${f}`) }));

// Flatten core to a hex map: "color.blue.600" -> "#2563EB"
function flattenCoreColors(obj, prefix = '') {
  const map = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && '$value' in v && v.$type === 'color') {
      map[path] = v.$value;
    } else if (typeof v === 'object' && v !== null) {
      Object.assign(map, flattenCoreColors(v, path));
    }
  }
  return map;
}
const coreColors = flattenCoreColors(core);

// Follow one level of alias: "{color.blue.600}" -> "#2563EB"
function resolveHex(raw) {
  if (typeof raw === 'string' && raw.startsWith('{') && raw.endsWith('}')) {
    return coreColors[raw.slice(1, -1)] ?? null;
  }
  return raw ?? null;
}

// Dig a dotted path into a nested object
function dig(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

// Get the resolved hex for a token path, checking brand override first
function getHex(tokenPath, brandFile) {
  const brandRaw = dig(brandFile, tokenPath)?.$value;
  if (brandRaw) return resolveHex(brandRaw);
  const semRaw = dig(semantic, tokenPath)?.$value;
  if (semRaw) return resolveHex(semRaw);
  return null;
}

// WCAG relative luminance
function linearise(c) {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}
function contrast(h1, h2) {
  const [l1, l2] = [luminance(h1), luminance(h2)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Pairs: [bg token path, fg token path, label]
const PAIRS = [
  ['action.primary.bg',  'action.primary.fg',  'Button primary'],
  ['badge.default.bg',   'badge.default.fg',   'Badge default'],
  ['badge.success.bg',   'badge.success.fg',   'Badge success'],
  ['badge.error.bg',     'badge.error.fg',     'Badge error'],
  ['status.success.bg',  'status.success.fg',  'Status success'],
  ['status.error.bg',    'status.error.fg',    'Status error'],
];

const THRESHOLD = 4.5; // WCAG AA normal text
let failures = 0;

for (const brand of brands) {
  console.log(`\nBrand: ${brand.name}`);
  for (const [bgPath, fgPath, label] of PAIRS) {
    const bg = getHex(bgPath, brand.file);
    const fg = getHex(fgPath, brand.file);
    if (!bg || !fg) {
      console.warn(`  ⚠  ${label}: could not resolve hex (${bgPath}, ${fgPath})`);
      continue;
    }
    const ratio = contrast(bg, fg);
    const pass  = ratio >= THRESHOLD;
    console.log(`  ${pass ? '✓' : '✗'}  ${label}: ${ratio.toFixed(2)}:1 (WCAG AA ${pass ? 'PASS' : `FAIL — min ${THRESHOLD}:1`})`);
    if (!pass) failures++;
  }
}

console.log(`\n${failures === 0
  ? '✓  All contrast checks passed.'
  : `✗  ${failures} failure(s) — fix contrast before merging.`}`);
process.exit(failures > 0 ? 1 : 0);
