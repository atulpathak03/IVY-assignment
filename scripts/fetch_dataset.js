import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const BASE_URL = (process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'https://solve.ivy.homes').replace(/\/+$/, '');
const API_KEY = process.env.VITE_API_KEY || process.env.API_KEY || 'IVY26-05FB73DA5767';
const LOGIN_EMAIL = process.env.VITE_LOGIN_EMAIL || process.env.LOGIN_EMAIL || 'demo1@ivy.homes';
const LOGIN_PASSWORD = process.env.VITE_LOGIN_PASSWORD || process.env.LOGIN_PASSWORD || 'password123';

const dataDir = path.join(rootDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function getToken() {
  const url = `${BASE_URL}/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed with status ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

let token = await getToken();
console.log('Token acquired successfully!');

async function fetchAll(endpointName, apiPath) {
  console.log(`\n--- Fetching complete dataset for ${endpointName} (${apiPath}) ---`);
  const allRecords = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `${BASE_URL}${apiPath}?offset=${offset}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      console.log('Token expired! Re-authenticating...');
      token = await getToken();
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(`HTTP Error ${res.status}: ${text}`);
      break;
    }

    const data = await res.json();
    const results = data.results || [];
    const total = data.total;
    const hasMore = data.has_more || false;

    allRecords.push(...results);
    console.log(`Offset ${String(offset).padStart(4, ' ')}: fetched ${results.length} items (Total accumulated: ${allRecords.length} / ${total})`);

    if (!hasMore || results.length === 0) {
      break;
    }
    offset += results.length;
  }

  const outFile = path.join(dataDir, `${endpointName}.json`);
  fs.writeFileSync(outFile, JSON.stringify(allRecords, null, 2), 'utf-8');
  console.log(`Saved ${allRecords.length} records to ${outFile}`);
  return allRecords;
}

const listings = await fetchAll('listings', '/v1/listings');
const rentals = await fetchAll('rentals', '/v1/rentals');
const projects = await fetchAll('projects', '/v1/projects');

console.log('\n=== DATASET DOWNLOAD COMPLETE ===');
console.log(`Total Listings: ${listings.length}`);
console.log(`Total Rentals:  ${rentals.length}`);
console.log(`Total Projects: ${projects.length}`);
