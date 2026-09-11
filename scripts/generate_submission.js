import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

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

const API_KEY = process.env.VITE_API_KEY || process.env.API_KEY || 'IVY26-05FB73DA5767';
const CANDIDATE_NAME = process.env.CANDIDATE_NAME || 'Atul';
const CANDIDATE_EMAIL = process.env.CANDIDATE_EMAIL || 'atul@mnnit.ac.in';
const CANDIDATE_REPO_URL = process.env.CANDIDATE_REPO_URL || 'https://github.com/atul/ivy-homes-assignment';
const CANDIDATE_DEMO_URL = process.env.CANDIDATE_DEMO_URL || 'https://ivy-homes-assignment.vercel.app';

const listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'));
const rentals = JSON.parse(fs.readFileSync(path.join(dataDir, 'rentals.json'), 'utf-8'));
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf-8'));

// 1. total_listing_records
const total_listing_records = listings.length;

// 2. unique_properties
function cleanAptName(name) {
  if (!name) return '';
  let s = String(name).toLowerCase();
  s = s.replace(/[\-_,.]/g, ' ');
  s = s.replace(/\b(phase|phase\s*\d+|apartments?|towers?)\b/g, '');
  return s.split(/\s+/).filter(Boolean).join(' ');
}

const groupsUnique = new Map();
for (const l of listings) {
  const k = [
    String(l.locality || '').trim().toLowerCase(),
    cleanAptName(l.apartment_name),
    l.bedroom,
    l.bathroom,
    l.floor,
    l.total_floors,
    l.carpet_area
  ].join('|');
  if (!groupsUnique.has(k)) groupsUnique.set(k, []);
  groupsUnique.get(k).push(l);
}
const unique_properties = groupsUnique.size;

// 3. active_listings
const active_listings = listings.filter(l => l.is_live === true).length;

// 4. corrupt_listing_ids
const cFl = listings.filter(l => (l.floor || 0) > (l.total_floors || 0)).map(l => l.listing_id);
const cPr = listings.filter(l => (l.price || 0) <= 0).map(l => l.listing_id);
const cAr = listings.filter(l => (l.carpet_area || 0) > (l.super_built_up_area || 0)).map(l => l.listing_id);
const corrupt_listing_ids = Array.from(new Set([...cFl, ...cPr, ...cAr])).sort();

// 5. total_monthly_rent (guindy)
const guindyRentals = rentals.filter(r => String(r.locality || '').trim().toLowerCase() === 'guindy');
const total_monthly_rent = guindyRentals.reduce((sum, r) => sum + (r.price || 0), 0);

// 9. fake_listing_ids
const byContact = new Map();
for (const l of listings) {
  const c = l.posted_by_contact;
  if (c) {
    if (!byContact.has(c)) byContact.set(c, []);
    byContact.get(c).push(l);
  }
}

const fakeSet = new Set();
const fakeContacts = [];
for (const [c, items] of byContact.entries()) {
  const names = new Set(items.map(i => i.posted_by_name).filter(Boolean));
  if (names.size >= 3) {
    fakeContacts.push(c);
    for (const item of items) {
      fakeSet.add(item.listing_id);
    }
  }
}
const fake_listing_ids = Array.from(fakeSet).sort();

// 6. avg_price_per_sqft_2bhk
const corruptSet = new Set(corrupt_listing_ids);
const qualifyingRates = [];
for (const l of listings) {
  const lid = l.listing_id;
  if (l.is_live === true && l.bedroom === 2) {
    if (!corruptSet.has(lid) && !fakeSet.has(lid)) {
      const ca = l.carpet_area || 0;
      const p = l.price || 0;
      if (ca > 0 && p > 0) {
        const caSqft = (l.website === 'magichomes' || ca < 300) ? ca * 10.76391041671 : ca;
        qualifyingRates.push(p / caSqft);
      }
    }
  }
}
const avg_price_per_sqft_2bhk = qualifyingRates.length > 0
  ? Math.round((qualifyingRates.reduce((a, b) => a + b, 0) / qualifyingRates.length) * 100) / 100
  : 0;

// 7. costliest_project
let maxPInr = -1;
let costliestPid = '';
for (const p of projects) {
  const pmax = p.price_max;
  if (pmax !== undefined && pmax !== null) {
    const inr = pmax < 15.0 ? Math.round(pmax * 10000000) : Math.round(pmax * 100000);
    if (inr > maxPInr) {
      maxPInr = inr;
      costliestPid = p.project_id;
    }
  }
}
const costliest_project = {
  project_id: costliestPid,
  price_max_inr: maxPInr
};

// 8. listings_last_7_days
const refMs = new Date('2026-09-09T18:30:00Z').getTime();
const startMs = new Date('2026-09-02T18:30:00Z').getTime();
let listings_last_7_days = 0;

for (const l of listings) {
  const ts = l.posted_at;
  if (!ts) continue;
  const cleanTs = ts.replace(/Z$/, '');
  const ms = new Date(`${cleanTs}+05:30`).getTime();
  if (ms >= startMs && ms < refMs) {
    listings_last_7_days++;
  }
}

// 10. projects_with_wrong_listing_count
const actualProjCounts = new Map();
for (const l of listings) {
  const pid = l.project_id;
  if (pid) {
    actualProjCounts.set(pid, (actualProjCounts.get(pid) || 0) + 1);
  }
}
let projects_with_wrong_listing_count = 0;
for (const p of projects) {
  const pid = p.project_id;
  const rep = p.total_listings || 0;
  const act = actualProjCounts.get(pid) || 0;
  if (rep !== act) {
    projects_with_wrong_listing_count++;
  }
}

// Findings
const findings = [
  {
    endpoint: "*",
    category: "auth",
    documented: "Every request must carry the API key as a query parameter: GET /v1/listings?api_key=IVY26-XXXXXXXXXXXX",
    actual: "Passing api_key as a query parameter returns HTTP 401 with detail 'send your key in the X-API-Key request header, not as a query parameter'. The API key is strictly required in the X-API-Key HTTP header.",
    how_found: "Issued GET /v1/listings?api_key=... and received HTTP 401 error message.",
    impact: "All API calls fail with HTTP 401 unless the X-API-Key header is sent.",
    evidence: []
  },
  {
    endpoint: "/v1/listings",
    category: "auth",
    documented: "Query parameter api_key is required; Bearer token is documented as optional and only needed for favourites.",
    actual: "Collection endpoints /v1/listings, /v1/rentals, and /v1/projects require BOTH the X-API-Key header AND an Authorization: Bearer <token> header from /auth/login. Calls without a Bearer token return 401 Unauthorized.",
    how_found: "Called GET /v1/listings with X-API-Key header alone and received HTTP 401.",
    impact: "Users cannot view listings, rentals, or projects without authenticating via /auth/login first.",
    evidence: []
  },
  {
    endpoint: "/auth/login",
    category: "auth",
    documented: "Returns 'token', 'token_type': 'Bearer', 'expires_in': 86400 (24h), and states 'There is no refresh flow.'",
    actual: "Returns 'access_token' (not 'token'), 'refresh_token', 'refresh_url': '/auth/refresh', and 'expires_in': 900 (15 minutes). Session refresh flow exists via POST /auth/refresh taking {'refresh_token': '...'}.",
    how_found: "Inspected POST /auth/login response object keys and verified POST /auth/refresh endpoint.",
    impact: "Access tokens expire after 15 minutes instead of 24 hours. Applications must handle session refresh via /auth/refresh.",
    evidence: []
  },
  {
    endpoint: "/v1/listings",
    category: "pagination",
    documented: "Every collection endpoint takes page (1-indexed) and limit (default 20, max 200). Response returns total, page, page_size, results.",
    actual: "Collection endpoints accept offset (0-indexed record offset) and limit (capped at max 50 items per page). The page parameter is ignored when limit is passed. Response metadata returns limit, offset, count, total, has_more, results.",
    how_found: "Tested page=2&limit=50 which returned offset 0 items repeatedly, whereas offset=50&limit=50 paginated correctly.",
    impact: "Clients using page parameter get stuck on page 1. Pagination must use offset parameter.",
    evidence: []
  },
  {
    endpoint: "/v1/listings",
    category: "completeness",
    documented: "The endpoint total response field reports the exact number of records matching filters.",
    actual: "The total field in response metadata reports 3736 records, but paging to the end yields 4100 retrievable listing records.",
    how_found: "Paged through /v1/listings with offset += 50 until has_more was False.",
    impact: "Relying on the total metadata field truncates pagination math by 364 records.",
    evidence: []
  },
  {
    endpoint: "/v1/listing/{id}",
    category: "missing_endpoint",
    documented: "GET /v1/listing/{listing_id} returns a single listing object.",
    actual: "GET /v1/listing/{listing_id} (singular) returns 404 Not Found. The working endpoint is GET /v1/listings/{listing_id} (plural).",
    how_found: "Called GET /v1/listing/MAG-4001518 (singular 404) vs GET /v1/listings/MAG-4001518 (plural 200).",
    impact: "Single listing lookup using documented singular route fails.",
    evidence: ["MAG-4001518"]
  },
  {
    endpoint: "/v1/listings/{id}/similar",
    category: "missing_endpoint",
    documented: "GET /v1/listings/{listing_id}/similar returns up to ten comparable listings.",
    actual: "GET /v1/listings/{listing_id}/similar returns 404 Not Found on the live server.",
    how_found: "Called GET /v1/listings/MAG-4001518/similar and received 404 Not Found.",
    impact: "Similar listings feature cannot rely on server endpoint.",
    evidence: ["MAG-4001518"]
  },
  {
    endpoint: "/v1/favourites",
    category: "missing_endpoint",
    documented: "GET /v1/favourites, POST /v1/favourites, and DELETE /v1/favourites/{id} manage saved listings.",
    actual: "GET/POST/DELETE /v1/favourites returns 404 Not Found.",
    how_found: "Called /v1/favourites with valid Bearer token and received 404 Not Found.",
    impact: "Favourites must be maintained client-side in localStorage or application state.",
    evidence: []
  },
  {
    endpoint: "/v1/analytics/summary",
    category: "missing_endpoint",
    documented: "GET /v1/analytics/summary returns pre-computed aggregates for your city.",
    actual: "GET /v1/analytics/summary returns 404 Not Found.",
    how_found: "Called GET /v1/analytics/summary with valid headers and received 404 Not Found.",
    impact: "Analytics dashboard metrics must be calculated directly from raw listing/project datasets.",
    evidence: []
  },
  {
    endpoint: "/v1/projects",
    category: "units",
    documented: "price_min and price_max are in Indian rupees (integer).",
    actual: "price_min and price_max are reported as floats in Crores (for values < 15.0) or Lakhs (for values >= 15.0), rather than integer Rupees.",
    how_found: "Inspected project objects, e.g. P40224 reports price_max: 3.78 (3.78 Cr = 37,800,000 INR).",
    impact: "Displaying project prices without unit conversion displays ₹3.78 instead of ₹3.78 Cr.",
    evidence: ["P40224", "P40441", "P40071"]
  },
  {
    endpoint: "/v1/listings",
    category: "units",
    documented: "carpet_area is in square feet everywhere in the API.",
    actual: "Listings from website magichomes report carpet_area and super_built_up_area in square meters (sq m) instead of square feet (e.g. 111 sq m for 3 BHK).",
    how_found: "Identified 3 BHK listings with carpet_area = 111 sq m.",
    impact: "Price per sqft calculations for magichomes listings are skewed unless converted to square feet.",
    evidence: ["MAG-4003885", "MAG-4002264", "MAG-4003492"]
  },
  {
    endpoint: "/v1/listings",
    category: "timestamps",
    documented: "Timestamps are ISO 8601, UTC, Z suffix, everywhere in the API.",
    actual: "posted_at in /v1/listings is an ISO string without Z suffix or timezone offset (e.g. '2026-01-19T12:56:00'), representing local server time (IST).",
    how_found: "Inspected posted_at values across all 4100 listing objects.",
    impact: "Parsing naive string as UTC shifts posted dates by -5:30 hours.",
    evidence: ["MAG-4001518"]
  },
  {
    endpoint: "/v1/listings",
    category: "data_quality",
    documented: "Every listing_id is globally unique and corresponds to exactly one physical property.",
    actual: "A set of 27 listing records contains physically impossible data (floor > total_floors, negative/zero prices, or carpet_area > super_built_up_area).",
    how_found: "Ran validation rules on floor vs total_floors, price, and carpet_area vs super_built_up_area.",
    impact: "Displays physically impossible properties unless filtered out.",
    evidence: corrupt_listing_ids.slice(0, 20)
  },
  {
    endpoint: "/v1/listings",
    category: "fraud",
    documented: "Every listing is an active sale listing in your city.",
    actual: "228 listing records belong to 12 lead-generation phone numbers that re-use 3 to 6 fake contact names across 7 to 10 localities to generate inquiries.",
    how_found: "Analyzed contact number multi-persona name distribution and locality geographic spread.",
    impact: "Distorts real estate marketplace pricing and availability.",
    evidence: fakeContacts.slice(0, 12)
  },
  {
    endpoint: "/v1/projects",
    category: "consistency",
    documented: "total_listings in /v1/projects always agrees with what GET /v1/listings?project_id=... returns.",
    actual: "total_listings in project records disagrees with the actual number of listing records referencing that project for 336 out of 460 projects.",
    how_found: "Compared project.total_listings against count of listings referencing each project_id.",
    impact: "Project cards display inaccurate listing inventory counts.",
    evidence: ["P40001", "P40003", "P40004", "P40005", "P40006", "P40008", "P40009", "P40010", "P40011", "P40014"]
  },
  {
    endpoint: "/v1/rentals",
    category: "consistency",
    documented: "Rental listing title and locality represent property location.",
    actual: "Rental listings contain contradictory locality information (e.g. title says '1 BHK for rent in Velachery' while locality field says 't nagar').",
    how_found: "Cross-referenced title string against locality attribute in rental objects.",
    impact: "Confuses users searching for rentals in specific localities.",
    evidence: ["R4000001"]
  }
];

const submissionData = {
  api_key: API_KEY,
  candidate: {
    name: CANDIDATE_NAME,
    email: CANDIDATE_EMAIL,
    repo_url: CANDIDATE_REPO_URL,
    demo_url: CANDIDATE_DEMO_URL
  },
  answers: {
    total_listing_records,
    unique_properties,
    active_listings,
    corrupt_listing_ids,
    total_monthly_rent,
    avg_price_per_sqft_2bhk,
    costliest_project,
    listings_last_7_days,
    fake_listing_ids,
    projects_with_wrong_listing_count
  },
  findings
};

const submissionFile = path.join(rootDir, 'submission.json');
fs.writeFileSync(submissionFile, JSON.stringify(submissionData, null, 2), 'utf-8');

console.log('\n=== SUBMISSION.JSON GENERATED SUCCESSFULLY ===');
console.log('Answers Summary:');
for (const [k, v] of Object.entries(submissionData.answers)) {
  if (Array.isArray(v)) {
    console.log(`  ${k.padEnd(35, ' ')}: count=${v.length}`);
  } else if (typeof v === 'object' && v !== null) {
    console.log(`  ${k.padEnd(35, ' ')}: ${JSON.stringify(v)}`);
  } else {
    console.log(`  ${k.padEnd(35, ' ')}: ${v}`);
  }
}
console.log(`Total findings: ${findings.length}`);
