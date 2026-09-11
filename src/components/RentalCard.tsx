import React from 'react';
import { Rental } from '../types';
import { MapPin, BedDouble, Bath, Maximize2, ShieldAlert, Key, Calendar } from 'lucide-react';

interface Props {
  rental: Rental;
}

export const RentalCard: React.FC<Props> = ({ rental }) => {
  const hasLocalityMismatch = rental.title.toLowerCase().includes('in ') &&
    !rental.title.toLowerCase().includes(rental.locality.toLowerCase());

  const formatRent = (price: number) => `₹${price.toLocaleString('en-IN')}/mo`;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: hasLocalityMismatch ? 'rgba(245,158,11,0.4)' : undefined }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span className="badge badge-info">{rental.website}</span>
          <span className="badge badge-success" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>For Rent</span>
        </div>

        <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: '0.35rem' }}>
          {rental.title || `${rental.bedroom} BHK in ${rental.locality}`}
        </h3>
        
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
          <MapPin size={14} color="#10b981" /> {rental.apartment_name || 'Apartment'}, {rental.locality.toUpperCase()}
        </p>

        {hasLocalityMismatch && (
          <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={14} /> Title locality mismatch (Field: {rental.locality})
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#0f172a', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
            <BedDouble size={16} color="#3b82f6" /> {rental.bedroom} BHK
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
            <Bath size={16} color="#3b82f6" /> {rental.bathroom} Bath
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
            <Maximize2 size={16} color="#3b82f6" /> {rental.carpet_area} sq ft
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span>Deposit: ₹{(rental.deposit || 0).toLocaleString('en-IN')}</span>
          <span>Maint: ₹{(rental.maintenance || 0).toLocaleString('en-IN')}/mo</span>
        </div>
      </div>

      <div style={{ paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6' }}>
            {formatRent(rental.price)}
          </span>
        </div>
        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
          {rental.furnishing}
        </span>
      </div>
    </div>
  );
};
