import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

console.log('=== DEEP DATA ANALYSIS & QUESTION SOLVER ===');

const listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'));
const rentals = JSON.parse(fs.readFileSync(path.join(dataDir, 'rentals.json'), 'utf-8'));
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf-8'));

console.log(`Loaded ${listings.length} listings, ${rentals.length} rentals, ${projects.length} projects.`);

// Q1: total_listing_records
const totalListingRecords = listings.length;
console.log(`\n1. total_listing_records: ${totalListingRecords}`);

// Q2: unique_properties
function cleanAptName(name) {
  if (!name) return '';
  let s = String(name).toLowerCase();
  s = s.replace(/[\-_,.]/g, ' ');
  s = s.replace(/\b(phase|phase\s*\d+|apartments?|towers?)\b/g, '');
  return s.split(/\s+/).filter(Boolean).join(' ');
}

const uniqueGroups = new Map();
for (const l of listings) {
  const key = [
    String(l.locality || '').trim().toLowerCase(),
    cleanAptName(l.apartment_name),
    l.bedroom,
    l.bathroom,
    l.floor,
    l.total_floors,
    l.carpet_area
  ].join('|');
  
  if (!uniqueGroups.has(key)) {
    uniqueGroups.set(key, []);
  }
  uniqueGroups.get(key).push(l);
}
const uniqueProperties = uniqueGroups.size;
console.log(`2. unique_properties: ${uniqueProperties}`);

// Q3: active_listings
const activeListings = listings.filter(l => l.is_live === true).length;
console.log(`\n3. active_listings (is_live === true): ${activeListings}`);

// Q4: corrupt_listing_ids
const corruptReasons = new Map();
for (const l of listings) {
  const lid = l.listing_id;
  const reasons = [];

  const fl = l.floor;
  const totFl = l.total_floors;
  if (fl !== undefined && fl !== null && totFl !== undefined && totFl !== null) {
    if (fl > totFl) reasons.push(`floor (${fl}) > total_floors (${totFl})`);
  }

  const ca = l.carpet_area;
  const sba = l.super_built_up_area;
  if (ca !== undefined && ca !== null && sba !== undefined && sba !== null) {
    if (ca > sba) reasons.push(`carpet_area (${ca}) > super_built_up_area (${sba})`);
  }

  if (ca !== undefined && ca !== null && ca <= 0) reasons.push(`carpet_area <= 0 (${ca})`);
  if (sba !== undefined && sba !== null && sba <= 0) reasons.push(`super_built_up_area <= 0 (${sba})`);

  const price = l.price;
  if (price !== undefined && price !== null && price <= 0) reasons.push(`price <= 0 (${price})`);

  const bhk = l.bedroom;
  if (bhk !== undefined && bhk !== null && bhk <= 0) reasons.push(`bedroom <= 0 (${bhk})`);

  const bath = l.bathroom;
  if (bath !== undefined && bath !== null && bath < 0) reasons.push(`bathroom < 0 (${bath})`);

  if (fl !== undefined && fl !== null && fl < 0) reasons.push(`negative floor (${fl})`);

  if (reasons.length > 0) {
    corruptReasons.set(lid, reasons);
  }
}

const corruptListingIds = Array.from(corruptReasons.keys()).sort();
console.log(`\n4. corrupt_listing_ids count: ${corruptListingIds.length}`);

// Q5: total_monthly_rent (guindy)
const guindyRentals = rentals.filter(r => String(r.locality || '').trim().toLowerCase() === 'guindy');
const totalMonthlyRent = guindyRentals.reduce((sum, r) => sum + (r.price || 0), 0);
console.log(`\n5. total_monthly_rent (Guindy): ${totalMonthlyRent}`);

// Q9: fake_listing_ids
const byContact = new Map();
for (const l of listings) {
  const contact = l.posted_by_contact;
  if (contact) {
    if (!byContact.has(contact)) byContact.set(contact, []);
    byContact.get(contact).push(l);
  }
}

const fakeSet = new Set();
const fakeContacts = [];
for (const [contact, items] of byContact.entries()) {
  const names = new Set(items.map(i => i.posted_by_name).filter(Boolean));
  if (names.size >= 3) {
    fakeContacts.push(contact);
    for (const item of items) {
      fakeSet.add(item.listing_id);
    }
  }
}
const fakeListingIds = Array.from(fakeSet).sort();
console.log(`\n9. fake_listing_ids count: ${fakeListingIds.length}`);

// Q6: avg_price_per_sqft_2bhk
const corruptSet = new Set(corruptListingIds);
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

const avgPricePerSqft2bhk = qualifyingRates.length > 0
  ? Math.round((qualifyingRates.reduce((a, b) => a + b, 0) / qualifyingRates.length) * 100) / 100
  : 0;
console.log(`\n6. avg_price_per_sqft_2bhk: ${avgPricePerSqft2bhk}`);

// Q7: costliest_project
let maxPInr = -1;
let costliestPid = '';

for (const p of projects) {
  const pmax = p.price_max;
  if (pmax !== undefined && pmax !== null) {
    const inr = pmax < 15.0 ? Math.round(pmax * 10000000) : Math.round(pmax * 10000);
    if (inr > maxPInr) {
      maxPInr = inr;
      costliestPid = p.project_id;
    }
  }
}

const costliestProject = {
  project_id: costliestPid,
  price_max_inr: maxPInr
};
console.log('\n7. costliest_project:', costliestProject);

// Q8: listings_last_7_days
// Reference IST: 2026-09-10T00:00:00+05:30 -> UTC 2026-09-09T18:30:00Z
// Start IST: 2026-09-03T00:00:00+05:30 -> UTC 2026-09-02T18:30:00Z
const refMs = new Date('2026-09-09T18:30:00Z').getTime();
const startMs = new Date('2026-09-02T18:30:00Z').getTime();

let listingsLast7Days = 0;
for (const l of listings) {
  const ts = l.posted_at;
  if (!ts) continue;
  
  // posted_at is ISO local time in IST without offset (e.g. 2026-06-14T09:20:00)
  // Convert local IST time string to UTC timestamp
  const cleanTs = ts.replace(/Z$/, '');
  const dtLocal = new Date(`${cleanTs}+05:30`);
  const ms = dtLocal.getTime();
  
  if (ms >= startMs && ms < refMs) {
    listingsLast7Days++;
  }
}
console.log(`\n8. listings_last_7_days: ${listingsLast7Days}`);

// Q10: projects_with_wrong_listing_count
const actualProjCounts = new Map();
for (const l of listings) {
  const pid = l.project_id;
  if (pid) {
    actualProjCounts.set(pid, (actualProjCounts.get(pid) || 0) + 1);
  }
}

let projectsWithWrongListingCount = 0;
for (const p of projects) {
  const pid = p.project_id;
  const reported = p.total_listings || 0;
  const actual = actualProjCounts.get(pid) || 0;
  if (reported !== actual) {
    projectsWithWrongListingCount++;
  }
}
console.log(`\n10. projects_with_wrong_listing_count: ${projectsWithWrongListingCount}`);

console.log('\n=== ANALYSIS COMPLETE ===');
