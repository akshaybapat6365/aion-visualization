#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const baselinePath = path.resolve('.performance-baseline.json');
const baseline = fs.existsSync(baselinePath)
  ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  : { javascriptBytes: 0, cssBytes: 0 };

const sizeOf = file => fs.existsSync(file) ? fs.statSync(file).size : 0;

const current = {
  javascriptBytes: sizeOf('assets/js/bundle.min.js'),
  cssBytes: sizeOf('assets/css/bundle.min.css')
};

const delta = {
  javascriptBytes: current.javascriptBytes - baseline.javascriptBytes,
  cssBytes: current.cssBytes - baseline.cssBytes
};

const limits = {
  javascriptBytes: 30 * 1024,
  cssBytes: 15 * 1024
};

console.log('Bundle size delta check');
console.log({ baseline, current, delta, limits });

const failures = Object.entries(delta)
  .filter(([key, value]) => value > limits[key]);

if (failures.length > 0) {
  console.error('Bundle size delta exceeded limits:', failures);
  process.exit(1);
}
