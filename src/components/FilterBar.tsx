import React from 'react';
import { FilterOptions } from '../types';
import { Filter, RotateCcw, ShieldCheck, AlertTriangle, ArrowUpDown } from 'lucide-react';

interface Props {
  filters: FilterOptions;
  onChange: (newFilters: FilterOptions) => void;
  localities: string[];
  totalResults: number;
}

export const FilterBar: React.FC<Props> = ({ filters, onChange, localities, totalResults }) => {
  const handleChange = (key: keyof FilterOptions, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onChange({
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
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#10b981" />
          <h2 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Filter & Search Properties</h2>
          <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
            {totalResults} Results
          </span>
        </div>
        <button onClick={handleReset} className="btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
          <RotateCcw size={14} /> Reset Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        {/* Locality */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
            Locality
          </label>
          <select
            className="input-field"
            value={filters.locality}
            onChange={(e) => handleChange('locality', e.target.value)}
          >
            <option value="">All Localities</option>
            {localities.map((loc) => (
              <option key={loc} value={loc}>
                {loc.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Bedrooms (BHK) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
            Bedrooms (BHK)
          </label>
          <select
            className="input-field"
            value={filters.bedroom}
            onChange={(e) => handleChange('bedroom', e.target.value)}
          >
            <option value="all">All BHK</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
            <option value="5">5+ BHK</option>
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
            Min Price (₹)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 5000000"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
          />
        </div>

        {/* Max Price */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
            Max Price (₹)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 15000000"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
          />
        </div>

        {/* Furnishing */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
            Furnishing
          </label>
          <select
            className="input-field"
            value={filters.furnishing}
            onChange={(e) => handleChange('furnishing', e.target.value)}
          >
            <option value="all">All Furnishing</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="fully-furnished">Fully-Furnished</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
            Sort By
          </label>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <select
              className="input-field"
              value={filters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value)}
            >
              <option value="posted_at">Posted Date</option>
              <option value="price">Price</option>
              <option value="carpet_area">Carpet Area</option>
              <option value="bedroom">Bedrooms</option>
            </select>
            <button
              onClick={() => handleChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary"
              style={{ padding: '0.5rem', minWidth: '40px', justifyContent: 'center' }}
              title={`Sort Order: ${filters.sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quality Toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#cbd5e1' }}>
          <input
            type="checkbox"
            checked={filters.showLiveOnly}
            onChange={(e) => handleChange('showLiveOnly', e.target.checked)}
          />
          Live Listings Only (`is_live == true`)
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#10b981' }}>
          <input
            type="checkbox"
            checked={filters.excludeCorrupt}
            onChange={(e) => handleChange('excludeCorrupt', e.target.checked)}
          />
          <ShieldCheck size={16} /> Exclude Corrupt Listings (Q4 - 27 IDs)
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#f59e0b' }}>
          <input
            type="checkbox"
            checked={filters.excludeFake}
            onChange={(e) => handleChange('excludeFake', e.target.checked)}
          />
          <AlertTriangle size={16} /> Exclude Lead-Gen Scams (Q9 - 228 IDs)
        </label>
      </div>
    </div>
  );
};
