// utils/loader.ts
import { readFileSync } from 'fs';

export function loadConfig() {
  const client = process.env.CLIENT;
  return JSON.parse(readFileSync(`configs/${client}.json`, 'utf-8'));
}
