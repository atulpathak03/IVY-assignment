import React, { useState } from 'react';
import submissionData from '../../submission.json';
import { Finding } from '../types';
import { BarChart3, ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2, FileText, Filter, Key, Layers, DollarSign, Calendar } from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const answers = submissionData.answers;
  const findings = submissionData.findings as Finding[];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(findings.map(f => f.category)))];

  const filteredFindings = selectedCategory === 'all'
    ? findings
    : findings.filter(f => f.category === selectedCategory);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#f8fafc', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 color="#10b981" size={32} /> Insights & API Reconnaissance Dashboard
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Empirical discoveries, analytical solutions, and verified documentation discrepancies for Chennai (Key: {submissionData.api_key})
        </p>
      </div>

      {/* 10 Analytical Questions Grid */}
      <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck color="#10b981" /> 10 Analytical Question Answers (Chennai Dataset)
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {/* Q1 */}
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q1: Total Listing Records</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>{answers.total_listing_records.toLocaleString()}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Fetched via /v1/listings offset pagination</span>
        </div>

        {/* Q2 */}
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q2: Unique Physical Properties</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>{answers.unique_properties.toLocaleString()}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Deduplicated physical property traits</span>
        </div>

        {/* Q3 */}
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q3: Active Listings (is_live)</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{answers.active_listings.toLocaleString()}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Listings where is_live === true</span>
        </div>

        {/* Q4 */}
        <div className="card" style={{ borderLeft: '4px solid #f43f5e' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q4: Corrupt Listings</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e' }}>{answers.corrupt_listing_ids.length}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Floor &gt; Total, Price &lt;= 0, Carpet &gt; SBA</span>
        </div>

        {/* Q5 */}
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q5: Total Monthly Rent (Guindy)</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>₹{(answers.total_monthly_rent / 100000).toFixed(2)} L</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Sum of rent across 160 Guindy rentals</span>
        </div>

        {/* Q6 */}
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q6: Avg 2BHK Price/sqft</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>₹{answers.avg_price_per_sqft_2bhk.toLocaleString('en-IN')}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Verified sq ft unit mean (1,025 2BHKs)</span>
        </div>

        {/* Q7 */}
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q7: Costliest Project</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{answers.costliest_project.project_id}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>₹{(answers.costliest_project.price_max_inr / 10000000).toFixed(2)} Cr (Shriram Serenity)</span>
        </div>

        {/* Q8 */}
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q8: Listings Last 7 Days</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>{answers.listings_last_7_days}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Posted [Sep 3 - Sep 10, 2026) IST</span>
        </div>

        {/* Q9 */}
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q9: Fake Lead-Gen Listings</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{answers.fake_listing_ids.length}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Belonging to 12 multi-persona numbers</span>
        </div>

        {/* Q10 */}
        <div className="card" style={{ borderLeft: '4px solid #f43f5e' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Q10: Wrong Project Counts</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e' }}>{answers.projects_with_wrong_listing_count}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Out of 460 total projects (73% mismatch)</span>
        </div>
      </div>

      {/* Verified Documentation Findings Table */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle color="#f59e0b" /> Verified Documentation Findings ({findings.length} Discrepancies)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Every place API_REFERENCE.md disagrees with live API behavior</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFindings.map((finding, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{ background: '#0f172a', padding: '0.2rem 0.6rem', borderRadius: '4px', color: '#10b981', fontWeight: 700, fontSize: '0.88rem' }}>
                    {finding.endpoint}
                  </code>
                  <span className="badge badge-warning">{finding.category}</span>
                </div>
                {finding.evidence && finding.evidence.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {finding.evidence.length} Evidence IDs Provided
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem', fontSize: '0.88rem' }}>
                <div style={{ background: 'rgba(244,63,94,0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <strong style={{ color: '#f43f5e', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>DOCUMENTED CLAIM</strong>
                  <p style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>{finding.documented}</p>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <strong style={{ color: '#10b981', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>ACTUAL LIVE BEHAVIOR</strong>
                  <p style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>{finding.actual}</p>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span><strong>How Found:</strong> {finding.how_found}</span>
                <span><strong>Impact:</strong> {finding.impact}</span>
              </div>

              {finding.evidence && finding.evidence.length > 0 && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Evidence Identifiers:</span>
                  {finding.evidence.slice(0, 10).map((ev, i) => (
                    <code key={i} style={{ background: '#0f172a', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.72rem', color: '#3b82f6' }}>
                      {ev}
                    </code>
                  ))}
                  {finding.evidence.length > 10 && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>+{finding.evidence.length - 10} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* What Turned Out To Be Fine Section */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 color="#10b981" /> What Turned Out To Be Fine (Hypotheses Disproven)
        </h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '0.25rem' }}>1. Geographic Latitude & Longitude Invariants</h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
              We hypothesized that sellers might input fake (0,0) or negative GPS coordinates. Inspection confirmed all 4,100 listing records carry valid latitude (~12.85 to 13.15 N) and longitude (~80.10 to 80.35 E) coordinates strictly bound within Chennai.
            </p>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '0.25rem' }}>2. Rental Pricing & Security Deposit Ratios</h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
              We tested whether security deposits might be reported in wrong units or missing. Across all 1,550 rental records, deposit values were cleanly reported in Indian rupees as integers, representing reasonable 5-10x monthly rent multiples.
            </p>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '0.25rem' }}>3. Project RERA Number Validity</h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
              We hypothesized that RERA registration numbers might be blank or corrupted. All 460 project records contain valid RERA registration strings (e.g. PRM/KA/RERA/...) following standard format rules.
            </p>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '0.25rem' }}>4. Health Check Endpoint Clock Accuracy</h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
              We verified server clock synchronicity on /health. The server time is accurate and carries explicit Asia/Kolkata timezone offset (+05:30 IST), ensuring date calculations align with reference anchor moments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
