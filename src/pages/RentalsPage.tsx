import React, { useState, useEffect } from 'react';
import { fetchRentalsFromApi } from '../api/rentals';
import { Rental } from '../types';
import { RentalCard } from '../components/RentalCard';
import { Key, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export const RentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(1412);
  const limit = 24;

  const loadRentals = async (off = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRentalsFromApi(off, limit);
      setRentals(data.results);
      setTotal(data.total || 1412);
      setOffset(off);
    } catch (err: any) {
      setError(err.message || 'Failed to load rental properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals(0);
  }, []);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#f8fafc', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Key color="#3b82f6" /> Rental Properties
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Browse verified rental homes in Chennai with verified monthly rent & deposit units
          </p>
        </div>
        <button onClick={() => loadRentals(offset)} className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
          <RefreshCw size={16} /> Refresh Rentals
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Loader2 size={40} className="animate-spin" color="#3b82f6" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#94a3b8' }}>Fetching rental listings from API...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#f43f5e' }}>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="grid-cards" style={{ marginBottom: '2rem' }}>
            {rentals.map((rental) => (
              <RentalCard key={rental.listing_id} rental={rental} />
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              Page <strong style={{ color: '#f8fafc' }}>{currentPage}</strong> of <strong style={{ color: '#f8fafc' }}>{totalPages}</strong> ({total} total rental records)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                disabled={offset === 0}
                onClick={() => loadRentals(Math.max(0, offset - limit))}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', opacity: offset === 0 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                disabled={offset + limit >= total}
                onClick={() => loadRentals(offset + limit)}
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
