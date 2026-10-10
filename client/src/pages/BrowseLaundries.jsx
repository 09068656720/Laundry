import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Truck,
  Filter,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function BrowseLaundries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [laundries, setLaundries] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [offersPickup, setOffersPickup] = useState(searchParams.get('pickup') === 'true');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    async function loadAreas() {
      try {
        const data = await api.getAreas();
        setAreas(data.areas || []);
      } catch (err) {
        console.error('Failed to load areas:', err);
      }
    }
    loadAreas();
  }, []);

  useEffect(() => {
    async function fetchLaundries() {
      setLoading(true);
      try {
        const queryParams = {
          search,
          area: selectedArea,
          serviceCategory: selectedCategory,
          offersPickup: offersPickup ? 'true' : undefined,
          sort: sortBy,
        };
        const data = await api.getLaundries(queryParams);
        setLaundries(data.laundries || []);
      } catch (err) {
        console.error('Failed to fetch laundries:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchLaundries();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, selectedArea, selectedCategory, offersPickup, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedArea('all');
    setSelectedCategory('all');
    setOffersPickup(false);
    setSortBy('rating');
  };

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Page Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Verified Laundries in Kano</h1>
          <p>Find trusted local dry cleaners and wash specialists with transparent pricing and intake inspection.</p>
        </div>

        {/* Filter Toolbar */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            {/* Search */}
            <div>
              <label className="form-label">Search</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Laundry name or specialty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Area Filter */}
            <div>
              <label className="form-label">Kano Area</label>
              <select
                className="form-select"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="all">All Areas in Kano</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="form-label">Garment Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Service Categories</option>
                <option value="native_wear">Native Wear (Babbar Riga / Kaftan)</option>
                <option value="dry_clean">Dry Cleaning</option>
                <option value="wash_fold">Everyday Wash & Fold</option>
                <option value="ironing">Steam Press & Ironing</option>
                <option value="suits">Suits & Formal Wear</option>
                <option value="bedding">Bedding & Duvets</option>
              </select>
            </div>

            {/* Sort by */}
            <div>
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Top Rated</option>
                <option value="turnaround">Fastest Turnaround</option>
                <option value="price_asc">Lowest Starting Price</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={offersPickup}
                onChange={(e) => setOffersPickup(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
              />
              <Truck size={16} color="var(--primary)" />
              Home Pickup & Delivery Available Only
            </label>

            <button
              onClick={handleResetFilters}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing <strong>{laundries.length}</strong> verified laundry {laundries.length === 1 ? 'partner' : 'partners'} in Kano
          </span>
        </div>

        {/* Laundries Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Loading laundries...
          </div>
        ) : laundries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-muted)' }}>
              <Search size={28} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>No laundries found matching your filters</h3>
            <p style={{ maxWidth: 450, margin: '0 auto 1.5rem' }}>
              Try loosening your search terms, selecting a broader Kano area, or clearing the garment filter.
            </p>
            <button onClick={handleResetFilters} className="btn btn-primary">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
            {laundries.map((laundry) => (
              <div key={laundry.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-verified">
                    <ShieldCheck size={12} /> Verified Partner
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    {laundry.rating || '4.8'}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>
                  <Link to={`/laundries/${laundry.id}`} style={{ color: 'inherit' }}>
                    {laundry.business_name}
                  </Link>
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span>{laundry.area}, Kano</span>
                  <span>•</span>
                  <span>{laundry.address}</span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', flex: 1, lineHeight: 1.5 }}>
                  {laundry.description}
                </p>

                {/* Info row */}
                <div style={{
                  background: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.5rem',
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                  fontSize: '0.825rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Turnaround</span>
                    <strong>{laundry.turnaround_days} Days</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Pickup Fee</span>
                    <strong>{laundry.offers_pickup ? `₦${parseFloat(laundry.delivery_fee).toLocaleString()}` : 'Drop-off only'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>From</span>
                    <strong style={{ color: 'var(--primary)' }}>₦{parseFloat(laundry.min_price || 600).toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to={`/laundries/${laundry.id}`} className="btn btn-outline" style={{ flex: 1 }}>
                    View Services
                  </Link>
                  <Link to={`/customer/book?laundryId=${laundry.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
