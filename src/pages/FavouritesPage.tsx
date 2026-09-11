import React, { useState, useEffect } from 'react';
import { useFavourites } from '../context/FavouritesContext';
import { fetchListingsFromApi } from '../api/listings';
import { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { Heart, Loader2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FavouritesPage: React.FC = () => {
  const { savedIds } = useFavourites();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSaved = async () => {
      setLoading(true);
      try {
        if (savedIds.length === 0) {
          setSavedListings([]);
          setLoading(false);
          return;
        }

        // Fetch listings batch to resolve saved IDs
        const res = await fetchListingsFromApi(0, 200);
        const matches = res.results.filter(l => savedIds.includes(l.listing_id));
        setSavedListings(matches);
      } catch (err) {
        console.error('Error loading favourites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [savedIds]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: '#f8fafc', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Heart color="#f43f5e" fill="#f43f5e" /> Saved Properties
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Personalized saved listings (isolated per logged-in user account)
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Loader2 size={40} className="animate-spin" color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#94a3b8' }}>Loading saved properties...</p>
        </div>
      ) : savedListings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Heart size={48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: '0.5rem' }}>No Saved Properties Yet</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Click the heart icon on any property card to save it for quick reference.
          </p>
          <Link to="/listings" className="btn-primary">
            <Home size={16} /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid-cards">
          {savedListings.map(listing => (
            <ListingCard key={listing.listing_id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};
