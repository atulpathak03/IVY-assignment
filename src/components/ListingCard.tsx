import React from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '../types';
import { useFavourites } from '../context/FavouritesContext';
import { CORRUPT_LISTING_IDS, FAKE_CONTACT_NUMBERS } from '../api/listings';
import { Heart, MapPin, BedDouble, Bath, Maximize2, ShieldCheck, AlertTriangle, Layers, Calendar } from 'lucide-react';

interface Props {
  listing: Listing;
}

export const ListingCard: React.FC<Props> = ({ listing }) => {
  const { isSaved, toggleFavourite } = useFavourites();
  const saved = isSaved(listing.listing_id);

  const isCorrupt = CORRUPT_LISTING_IDS.has(listing.listing_id);
  const isFake = FAKE_CONTACT_NUMBERS.has(listing.posted_by_contact);
  const isSqMeters = listing.website === 'magichomes' || listing.carpet_area < 300;

  // Format price in Indian Rupee format (Lakhs / Crores)
  const formatPrice = (price: number) => {
    if (price <= 0) return 'Impossible Price (Negative/Zero)';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Convert carpet area if in sq m
  const carpetAreaSqFt = isSqMeters ? Math.round(listing.carpet_area * 10.7639) : listing.carpet_area;
  const pricePerSqFt = carpetAreaSqFt > 0 && listing.price > 0 ? Math.round(listing.price / carpetAreaSqFt) : 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: isCorrupt ? 'rgba(244,63,94,0.4)' : isFake ? 'rgba(245,158,11,0.4)' : undefined }}>
      <div>
        {/* Card Header & Badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span className="badge badge-info">{listing.website}</span>
            {listing.is_verified && <span className="badge badge-success"><ShieldCheck size={12} /> Verified</span>}
            {listing.is_live ? (
              <span className="badge badge-success" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Live</span>
            ) : (
              <span className="badge badge-warning" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Inactive</span>
            )}
            {isCorrupt && <span className="badge badge-danger"><AlertTriangle size={12} /> Corrupt Data</span>}
            {isFake && <span className="badge badge-warning"><AlertTriangle size={12} /> Lead-Gen Scam</span>}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavourite(listing.listing_id);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: saved ? '#f43f5e' : '#64748b',
              padding: '4px',
              transition: 'transform 0.2s'
            }}
            title={saved ? 'Remove from Saved' : 'Save Property'}
          >
            <Heart size={22} fill={saved ? '#f43f5e' : 'none'} />
          </button>
        </div>

        {/* Title & Locality */}
        <Link to={`/listings/${listing.listing_id}`}>
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.35rem', lineHeight: '1.3' }}>
            {listing.apartment_name || 'Independent Residence'}
          </h3>
        </Link>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.85rem' }}>
          <MapPin size={14} color="#10b981" /> {listing.locality.toUpperCase()}, Chennai
        </p>

        {/* Property Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#0f172a', padding: '0.65rem', borderRadius: '8px', marginBottom: '0.85rem', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
            <BedDouble size={16} color="#3b82f6" /> {listing.bedroom} BHK
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
            <Bath size={16} color="#3b82f6" /> {listing.bathroom} Bath
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
            <Layers size={16} color="#3b82f6" /> Fl {listing.floor}/{listing.total_floors}
          </div>
        </div>

        {/* Carpet Area Info */}
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Maximize2 size={14} color="#10b981" />
            {carpetAreaSqFt} sq ft
            {isSqMeters && <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>({listing.carpet_area} sq m)</span>}
          </span>
          {pricePerSqFt > 0 && <span style={{ color: '#64748b' }}>₹{pricePerSqFt.toLocaleString('en-IN')}/sq ft</span>}
        </div>
      </div>

      {/* Footer: Price & View Link */}
      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
            {formatPrice(listing.price)}
          </span>
        </div>
        <Link to={`/listings/${listing.listing_id}`} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          Details &rarr;
        </Link>
      </div>
    </div>
  );
};
