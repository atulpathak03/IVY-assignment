import { apiFetch } from './client';
import { Listing, FilterOptions } from '../types';

// List of corrupt IDs identified in Question 4
export const CORRUPT_LISTING_IDS = new Set([
  "100-4000397", "100-4000449", "100-4000457", "100-4000491", "100-4000738", "100-4002961",
  "DWE-4000412", "DWE-4001424", "DWE-4001442", "DWE-4002247", "DWE-4002374", "DWE-4002712",
  "DWE-4003067", "MAG-4000145", "MAG-4000283", "MAG-4001981", "MAG-4002776", "MAG-4003100",
  "SQU-4000308", "SQU-4000583", "SQU-4001225", "SQU-4002483", "ZER-4000021", "ZER-4001161",
  "ZER-4001287", "ZER-4001669", "ZER-4001686"
]);

// List of 12 fake lead-gen phone numbers identified in Question 9
export const FAKE_CONTACT_NUMBERS = new Set([
  "+912006984574", "+912002229898", "+912000054434", "+912003276866",
  "+912008628348", "+912000159466", "+912003940107", "+912005820728",
  "+912005246883", "+912005640249", "+912000545441", "+912005587027"
]);

export interface ListingsResponse {
  limit: number;
  offset: number;
  count: number;
  total: number;
  has_more: boolean;
  results: Listing[];
}

export async function fetchListingsFromApi(offset = 0, limit = 50): Promise<ListingsResponse> {
  return apiFetch<ListingsResponse>('/v1/listings', {
    params: { offset, limit }
  });
}

// Notice plural route /v1/listings/{id} since singular /v1/listing/{id} returns 404!
export async function fetchListingById(listingId: string): Promise<Listing> {
  return apiFetch<Listing>(`/v1/listings/${listingId}`);
}

export function filterAndSortListings(
  listings: Listing[],
  filters: FilterOptions
): Listing[] {
  let result = [...listings];

  // 1. Locality Filter
  if (filters.locality && filters.locality.trim() !== '') {
    const targetLoc = filters.locality.trim().toLowerCase();
    result = result.filter(l => l.locality && l.locality.toLowerCase() === targetLoc);
  }

  // 2. Bedroom Filter
  if (filters.bedroom && filters.bedroom !== 'all') {
    const bhk = parseInt(filters.bedroom, 10);
    result = result.filter(l => l.bedroom === bhk);
  }

  // 3. Min Price Filter
  if (filters.minPrice) {
    const minP = parseInt(filters.minPrice, 10);
    if (!isNaN(minP)) {
      result = result.filter(l => l.price >= minP);
    }
  }

  // 4. Max Price Filter
  if (filters.maxPrice) {
    const maxP = parseInt(filters.maxPrice, 10);
    if (!isNaN(maxP)) {
      result = result.filter(l => l.price <= maxP);
    }
  }

  // 5. Furnishing Filter
  if (filters.furnishing && filters.furnishing !== 'all') {
    const furn = filters.furnishing.toLowerCase();
    result = result.filter(l => l.furnishing && l.furnishing.toLowerCase() === furn);
  }

  // 6. Live Status Filter
  if (filters.showLiveOnly) {
    result = result.filter(l => l.is_live === true);
  }

  // 7. Exclude Corrupt Listings Filter
  if (filters.excludeCorrupt) {
    result = result.filter(l => !CORRUPT_LISTING_IDS.has(l.listing_id));
  }

  // 8. Exclude Fake Lead-Gen Listings Filter
  if (filters.excludeFake) {
    result = result.filter(l => !FAKE_CONTACT_NUMBERS.has(l.posted_by_contact));
  }

  // 9. Sorting
  const sortBy = filters.sortBy || 'posted_at';
  const sortOrder = filters.sortOrder || 'desc';

  result.sort((a, b) => {
    let valA: any = (a as any)[sortBy];
    let valB: any = (b as any)[sortBy];

    if (valA === undefined || valA === null) valA = 0;
    if (valB === undefined || valB === null) valB = 0;

    if (typeof valA === 'string') {
      const cmp = valA.localeCompare(valB);
      return sortOrder === 'asc' ? cmp : -cmp;
    }

    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  return result;
}

export function getSimilarListings(target: Listing, allListings: Listing[]): Listing[] {
  return allListings
    .filter(l => l.listing_id !== target.listing_id)
    .filter(l => l.locality.toLowerCase() === target.locality.toLowerCase() && l.bedroom === target.bedroom)
    .filter(l => Math.abs(l.price - target.price) / target.price <= 0.20)
    .slice(0, 8);
}
