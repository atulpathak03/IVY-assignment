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

console.log('=== FULL API INVESTIGATION (Authenticated) ===');

async function requestApi(apiPath, options = {}) {
  const { method = 'GET', body = null, token = null, params = null } = options;
  let url = `${BASE_URL}${apiPath}`;
  if (params) {
    const query = new URLSearchParams(params).toString();
    url += `?${query}`;
  }

  const headers = { 'X-API-Key': API_KEY };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const opts = { method, headers };
  if (body !== null) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: err.message };
  }
}

// 1. Login
const loginRes = await requestApi('/auth/login', {
  method: 'POST',
  body: { email: LOGIN_EMAIL, password: LOGIN_PASSWORD }
});
console.log(`1. Login Status: ${loginRes.status}`);
const token = typeof loginRes.data === 'object' ? loginRes.data.access_token : null;
console.log(`Token acquired: ${token ? `${token.slice(0, 20)}...` : 'NO TOKEN'}`);

// 2. Test Listings
console.log('\n--- 2. GET /v1/listings ---');
const listingsRes = await requestApi('/v1/listings', { token, params: { page: 1, limit: 5 } });
console.log(`Status: ${listingsRes.status}`);
if (listingsRes.status === 200 && typeof listingsRes.data === 'object') {
  console.log(`Total: ${listingsRes.data.total}, Page: ${listingsRes.data.page}, PageSize: ${listingsRes.data.page_size}`);
  const results = listingsRes.data.results || [];
  console.log(`Results len: ${results.length}`);
  if (results.length > 0) {
    console.log('Sample Listing Object:', JSON.stringify(results[0], null, 2));
  }
}

// 3. Test Filters
console.log('\n--- 3. Testing Filters on /v1/listings ---');
const f1 = await requestApi('/v1/listings', { token, params: { locality: 'guindy', limit: 10 } });
console.log(`Filter locality=guindy: total=${typeof f1.data === 'object' ? f1.data.total : f1.data}`);

const f2 = await requestApi('/v1/listings', { token, params: { bhk: 2, limit: 10 } });
console.log(`Filter bhk=2: total=${typeof f2.data === 'object' ? f2.data.total : f2.data}`);

// 4. Test Single Listing Routes
const sampleLid = (typeof listingsRes.data === 'object' && listingsRes.data.results?.[0]?.listing_id) || 'MAG-4001518';
console.log(`\n--- 4. Single Listing Routes for ID ${sampleLid} ---`);

const singRes = await requestApi(`/v1/listing/${sampleLid}`, { token });
console.log(`GET /v1/listing/${sampleLid} (singular): status ${singRes.status}`);

const plurRes = await requestApi(`/v1/listings/${sampleLid}`, { token });
console.log(`GET /v1/listings/${sampleLid} (plural): status ${plurRes.status}`);

const simRes = await requestApi(`/v1/listings/${sampleLid}/similar`, { token });
console.log(`GET /v1/listings/${sampleLid}/similar: status ${simRes.status}`);

// 5. Test Favourites & Analytics Probes
console.log('\n--- 5. Probing Endpoint Paths ---');
for (const p of ['/v1/favourites', '/v1/analytics/summary']) {
  const r = await requestApi(p, { token });
  console.log(`GET ${p}: status ${r.status}`);
}

console.log('\n=== INVESTIGATION COMPLETE ===');
