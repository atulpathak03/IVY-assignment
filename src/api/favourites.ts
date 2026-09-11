import { getStoredUser } from './client';

function getStorageKey(): string {
  const user = getStoredUser();
  const email = user?.email || 'guest';
  return `ivy_favourites_${email}`;
}

export function getSavedListingIds(): string[] {
  const key = getStorageKey();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export function addSavedListingId(listingId: string): string[] {
  const key = getStorageKey();
  const current = getSavedListingIds();
  if (!current.includes(listingId)) {
    const updated = [...current, listingId];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeSavedListingId(listingId: string): string[] {
  const key = getStorageKey();
  const current = getSavedListingIds();
  const updated = current.filter(id => id !== listingId);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export function isListingSaved(listingId: string): boolean {
  const current = getSavedListingIds();
  return current.includes(listingId);
}
