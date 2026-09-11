import { apiFetch } from './client';
import { Project } from '../types';

export interface ProjectsResponse {
  limit: number;
  offset: number;
  count: number;
  total: number;
  has_more: boolean;
  results: Project[];
}

export async function fetchProjectsFromApi(offset = 0, limit = 50): Promise<ProjectsResponse> {
  return apiFetch<ProjectsResponse>('/v1/projects', {
    params: { offset, limit }
  });
}

export async function fetchProjectById(projectId: string): Promise<Project> {
  return apiFetch<Project>(`/v1/projects/${projectId}`);
}

export function formatProjectPriceInr(val: number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (val < 15.0) {
    return Math.round(val * 10000000); // Crores -> Rupees
  } else {
    return Math.round(val * 100000); // Lakhs -> Rupees
  }
}
