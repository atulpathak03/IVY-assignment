import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchListingById, fetchListingsFromApi, getSimilarListings, CORRUPT_LISTING_IDS, FAKE_CONTACT_NUMBERS } from '../api/listings';
import { Listing } from '../types';
import { useFavourites } from '../context/FavouritesContext';
import { ListingCard } from '../components/ListingCard';
import { MapPin, BedDouble, Bath, Maximize2, ShieldCheck, AlertTriangle, Heart, Phone, User, Calendar, ArrowLeft, Loader2, Building, Compass } from 'lucide-react';

export const ListingDetailPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isSaved, toggleFavourite } = useFavourites();

  useEffect(() => {
    if (!listingId) return;

    const loadListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await fetchListingById(listingId);
        setListing(item);

        // Fetch similar listings fallback from client dataset
        const res = await fetchListingsFromApi(0, 50);
        if (item && res.results) {
          const sim = getSimilarListings(item, res.results);
          setSimilar(sim);
        }
      } catch (err: any) {
        setError(err.message || `Listing ${listingId} not found.`);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <Loader2 size={40} className="animate-spin" color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
        <p style={{ color: '#94a3b8' }}>Loading property details for {listingId}...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#f43f5e' }}>
          <AlertTriangle size={40} style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Listing Not Found</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/listings" className="btn-primary">
            <ArrowLeft size={16} /> Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved(listing.listing_id);
  const isCorrupt = CORRUPT_LISTING_IDS.has(listing.listing_id);
  const isFake = FAKE_CONTACT_NUMBERS.has(listing.posted_by_contact);
  const isSqMeters = listing.website === 'magichomes' || listing.carpet_area < 300;
  const carpetAreaSqFt = isSqMeters ? Math.round(listing.carpet_area * 10.7639) : listing.carpet_area;
  const pricePerSqFt = carpetAreaSqFt > 0 && listing.price > 0 ? Math.round(listing.price / carpetAreaSqFt) : 0;

  const formatPrice = (price: number) => {
    if (price <= 0) return 'Impossible Price (Negative/Zero)';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Crores`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakhs`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Back Button */}
      <Link to="/listings" className="btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
        <ArrowLeft size={16} /> Back to Property Search
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Main Listing Details */}
        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-info">{listing.website}</span>
                {listing.is_verified && <span className="badge badge-success"><ShieldCheck size={14} /> Operations Verified</span>}
                {listing.is_live ? (
                  <span className="badge badge-success" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Live Listing</span>
                ) : (
                  <span className="badge badge-warning">Inactive / Expired</span>
                )}
              </div>
              <button
                onClick={() => toggleFavourite(listing.listing_id)}
                className="btn-secondary"
                style={{ color: saved ? '#f43f5e' : undefined, borderColor: saved ? '#f43f5e' : undefined }}
              >
                <Heart size={18} fill={saved ? '#f43f5e' : 'none'} /> {saved ? 'Saved' : 'Save Property'}
              </button>
            </div>

            <h1 style={{ fontSize: '1.85rem', color: '#f8fafc', marginBottom: '0.5rem', lineHeight: '1.25' }}>
              {listing.apartment_name || 'Independent Residence'}
            </h1>
            <p style={{ color: '#10b981', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              <MapPin size={18} /> {listing.locality.toUpperCase()}, Chennai
            </p>

            {/* Warnings */}
            {isCorrupt && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', padding: '1rem', borderRadius: '10px', color: '#f43f5e', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertTriangle size={22} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Verified Corrupt Data (Assignment Q4)</strong>
                  <span style={{ fontSize: '0.85rem' }}>This property listing contains physically impossible attributes (e.g. floor exceeding total floors or non-positive pricing).</span>
                </div>
              </div>
            )}

            {isFake && (
              <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', padding: '1rem', borderRadius: '10px', color: '#f59e0b', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertTriangle size={22} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Lead-Gen Inquiry Scam (Assignment Q9)</strong>
                  <span style={{ fontSize: '0.85rem' }}>This listing originates from a multi-persona lead generation phone number ({listing.posted_by_contact}) designed to capture inquiries.</span>
                </div>
              </div>
            )}

            {/* Price Box */}
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Total Asking Price</span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{formatPrice(listing.price)}</span>
              </div>
              {pricePerSqFt > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Estimated Rate</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#cbd5e1' }}>₹{pricePerSqFt.toLocaleString('en-IN')} / sq ft</span>
                </div>
              )}
            </div>

            {/* Specifications Grid */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#f8fafc' }}>Key Specifications</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ background: '#131b2e', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Bedrooms</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BedDouble size={18} color="#3b82f6" /> {listing.bedroom} BHK
                </span>
              </div>
              <div style={{ background: '#131b2e', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Bathrooms</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bath size={18} color="#3b82f6" /> {listing.bathroom} Bath
                </span>
              </div>
              <div style={{ background: '#131b2e', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Carpet Area</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Maximize2 size={18} color="#10b981" /> {carpetAreaSqFt} sq ft
                </span>
                {isSqMeters && <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Recorded as {listing.carpet_area} sq m</span>}
              </div>
              <div style={{ background: '#131b2e', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Floor Level</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Floor {listing.floor} of {listing.total_floors}
                </span>
              </div>
              <div style={{ background: '#131b2e', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Furnishing</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', textTransform: 'capitalize' }}>
                  {listing.furnishing}
                </span>
              </div>
              <div style={{ background: '#131b2e', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Super Built-Up Area</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  {listing.super_built_up_area} sq ft
                </span>
              </div>
            </div>

            {/* Description */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.65rem', color: '#f8fafc' }}>Property Description</h3>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {listing.description || 'No description provided by seller.'}
            </div>

            {/* Coordinates */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Compass size={16} color="#10b981" /> Coordinates: {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
              </span>
              <span>Posted: {new Date(listing.posted_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Contact Card */}
        <div>
          <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User color="#10b981" /> Seller Information
            </h3>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                {listing.posted_by} Seller
              </span>
              <strong style={{ fontSize: '1.1rem', color: '#f8fafc', display: 'block', margin: '0.2rem 0' }}>
                {listing.posted_by_name || 'Verified Seller'}
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} /> {listing.posted_by_contact}
              </span>
            </div>

            <a
              href={`tel:${listing.posted_by_contact}`}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem', marginBottom: '0.75rem' }}
            >
              <Phone size={16} /> Contact Seller Now
            </a>

            {listing.listing_url && (
              <a
                href={listing.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
              >
                View on Original Site ({listing.website})
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similar.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', marginBottom: '1rem' }}>
            Similar Properties in {listing.locality.toUpperCase()}
          </h2>
          <div className="grid-cards">
            {similar.map((sim) => (
              <ListingCard key={sim.listing_id} listing={sim} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
