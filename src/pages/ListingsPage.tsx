import React, { useState, useEffect, useMemo } from 'react';
import { fetchListingsFromApi, filterAndSortListings } from '../api/listings';
import { Listing, FilterOptions } from '../types';
import { ListingCard } from '../components/ListingCard';
import { FilterBar } from '../components/FilterBar';
import { Home, Loader2, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export const ListingsPage: React.FC = () => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [totalServer, setTotalServer] = useState(3736);

  const [filters, setFilters] = useState<FilterOptions>({
    locality: '',
    bedroom: 'all',
    minPrice: '',
    maxPrice: '',
    furnishing: 'all',
    showLiveOnly: false,
    excludeCorrupt: true,
    excludeFake: true,
    sortBy: 'posted_at',
    sortOrder: 'desc'
  });

  const [pageSize, setPageSize] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch initial batch or full set sequentially
      const firstBatch = await fetchListingsFromApi(0, 50);
      setTotalServer(firstBatch.total || 3736);
      
      let items: Listing[] = [...firstBatch.results];

      // Automatically accumulate remaining pages up to 500 items for instant fast client UI filtering
      // or background fetch
      setAllListings(items);

      // Fetch more in background for full client filtering
      const p2 = await fetchListingsFromApi(50, 50);
      const p3 = await fetchListingsFromApi(100, 50);
      const p4 = await fetchListingsFromApi(150, 50);
      const p5 = await fetchListingsFromApi(200, 50);

      items = [...items, ...p2.results, ...p3.results, ...p4.results, ...p5.results];
      setAllListings(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load property listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract unique localities from loaded data
  const localities = useMemo(() => {
    const locs = new Set(allListings.map(l => l.locality).filter(Boolean));
    return Array.from(locs).sort();
  }, [allListings]);

  // Apply filters & sorting
  const filteredListings = useMemo(() => {
    return filterAndSortListings(allListings, filters);
  }, [allListings, filters]);

  // Client pagination
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize));
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredListings.slice(start, start + pageSize);
  }, [filteredListings, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#f8fafc', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Home color="#10b981" /> Property Sale Listings
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Explore active & verified residential properties across Chennai
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
          <RefreshCw size={16} /> Refresh API Data
        </button>
      </div>

      {/* Filter Control Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        localities={localities}
        totalResults={filteredListings.length}
      />

      {/* Error View */}
      {error && (
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: '#f43f5e', marginBottom: '1.5rem' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
          <p>{error}</p>
          <button onClick={loadData} className="btn-primary" style={{ marginTop: '1rem' }}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && allListings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Loader2 size={40} className="animate-spin" color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#94a3b8' }}>Fetching live listing records from solve.ivy.homes...</p>
        </div>
      ) : paginatedListings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Home size={48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: '0.5rem' }}>No Listings Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Try clearing filters or adjusting your price/BHK search options.</p>
        </div>
      ) : (
        <>
          {/* Listings Grid */}
          <div className="grid-cards" style={{ marginBottom: '2rem' }}>
            {paginatedListings.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                Showing Page <strong style={{ color: '#f8fafc' }}>{currentPage}</strong> of <strong style={{ color: '#f8fafc' }}>{totalPages}</strong> ({filteredListings.length} total properties)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
