import React from 'react';
import { Project } from '../types';
import { formatProjectPriceInr } from '../api/projects';
import { Building2, MapPin, Layers, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  project: Project;
  actualListingsCount?: number;
}

export const ProjectCard: React.FC<Props> = ({ project, actualListingsCount }) => {
  const minInr = formatProjectPriceInr(project.price_min);
  const maxInr = formatProjectPriceInr(project.price_max);

  const formatInrStr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const hasMismatch = actualListingsCount !== undefined && actualListingsCount !== project.total_listings;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: hasMismatch ? 'rgba(245,158,11,0.4)' : undefined }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{project.project_status}</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>RERA: {project.rera_number || 'Approved'}</span>
        </div>

        <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', marginBottom: '0.2rem' }}>
          {project.apartment_name}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginBottom: '0.4rem' }}>
          By {project.developer_name}
        </p>

        <p style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
          <MapPin size={14} color="#10b981" /> {project.locality.toUpperCase()}, Chennai
        </p>

        {hasMismatch && (
          <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={14} /> Reported {project.total_listings} listings vs actual {actualListingsCount} in live listings API
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#0f172a', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Total Units</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{project.total_units}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Towers/Floors</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{project.total_towers}T / {project.total_floors}F</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Area Range</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{project.min_area_sqft}-{project.max_area_sqft} sqft</span>
          </div>
        </div>

        {project.amenities && project.amenities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
            {project.amenities.slice(0, 4).map((am, i) => (
              <span key={i} style={{ background: '#1e293b', color: '#cbd5e1', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'capitalize' }}>
                ✓ {am}
              </span>
            ))}
            {project.amenities.length > 4 && (
              <span style={{ color: '#64748b', fontSize: '0.7rem', alignSelf: 'center' }}>+{project.amenities.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      <div style={{ paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Price Range (Lakhs/Crores Verified)</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
            {formatInrStr(minInr)} - {formatInrStr(maxInr)}
          </span>
        </div>
      </div>
    </div>
  );
};
