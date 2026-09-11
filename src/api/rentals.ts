import { apiFetch } from './client';
import { Rental } from '../types';

export interface RentalsResponse {
  limit: number;
  offset: number;
  count: number;
  total: number;
  has_more: boolean;
  results: Rental[];
}

export async function fetchRentalsFromApi(offset = 0, limit = 50): Promise<RentalsResponse> {
  return apiFetch<RentalsResponse>('/v1/rentals', {
    params: { offset, limit }
  });
}

export async function fetchRentalById(rentalId: string): Promise<Rental> {
  return apiFetch<Rental>(`/v1/rentals/${rentalId}`);
}
