import React, { useState, useEffect } from 'react';
import { fetchProjectsFromApi } from '../api/projects';
import { fetchListingsFromApi } from '../api/listings';
import { Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { Building2, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [listingCounts, setListingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(460);
  const limit = 24;

  const loadProjects = async (off = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectsFromApi(off, limit);
      setProjects(data.results);
      setTotal(data.total || 460);
      setOffset(off);

      // Fetch sample listings to calculate actual project listing counts
      const listingsRes = await fetchListingsFromApi(0, 200);
      const counts: Record<string, number> = {};
      listingsRes.results.forEach(l => {
        if (l.project_id) {
          counts[l.project_id] = (counts[l.project_id] || 0) + 1;
        }
      });
      setListingCounts(counts);
    } catch (err: any) {
      setError(err.message || 'Failed to load builder projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(0);
  }, []);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#f8fafc', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Building2 color="#10b981" /> Builder Projects Directory
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Explore builder developments in Chennai with verified Lakhs/Crores price range conversions
          </p>
        </div>
        <button onClick={() => loadProjects(offset)} className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
          <RefreshCw size={16} /> Refresh Projects
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Loader2 size={40} className="animate-spin" color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#94a3b8' }}>Fetching builder project records from API...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#f43f5e' }}>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="grid-cards" style={{ marginBottom: '2rem' }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                actualListingsCount={listingCounts[project.project_id] ?? project.total_listings}
              />
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              Page <strong style={{ color: '#f8fafc' }}>{currentPage}</strong> of <strong style={{ color: '#f8fafc' }}>{totalPages}</strong> ({total} total builder projects)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                disabled={offset === 0}
                onClick={() => loadProjects(Math.max(0, offset - limit))}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', opacity: offset === 0 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                disabled={offset + limit >= total}
                onClick={() => loadProjects(offset + limit)}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', opacity: offset + limit >= total ? 0.5 : 1 }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
