import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Truck,
  Star,
  ShieldCheck,
  Check,
  Calendar,
  ArrowRight,
  Shirt,
  Sparkles
} from 'lucide-react';

export default function LaundryDetails() {
  const { id } = useParams();
  const [laundry, setLaundry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    async function loadLaundry() {
      try {
        const data = await api.getLaundryById(id);
        setLaundry(data.laundry);
      } catch (err) {
        setError('Laundry not found or currently unavailable.');
      } finally {
        setLoading(false);
      }
    }
    loadLaundry();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading laundry profile...
      </div>
    );
  }

  if (error || !laundry) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: '3rem 2rem' }}>
          <h2>Laundry Not Found</h2>
          <p style={{ margin: '1rem 0' }}>{error || 'This laundry partner could not be located.'}</p>
          <Link to="/browse" className="btn btn-primary">
            Browse All Laundries
          </Link>
        </div>
      </div>
    );
  }

  const services = laundry.services || [];
  const reviews = laundry.reviews || [];

  // Group services by category
  const categories = ['all', ...new Set(services.map((s) => s.category))];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const categoryLabels = {
    all: 'All Services',
    native_wear: 'Native Wear & Kaftans',
    suits: 'Suits & Formal Wear',
    wash_fold: 'Wash & Fold',
    ironing: 'Steam Press & Ironing',
    bedding: 'Bedding & Duvets',
    dry_clean: 'Dry Cleaning',
  };

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <Link to="/">Home</Link> &gt; <Link to="/browse">Laundries</Link> &gt; <span>{laundry.business_name}</span>
        </div>

        {/* Hero Header */}
        <div className="card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-verified">
                  <ShieldCheck size={13} /> Verified Kano Partner
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  {laundry.rating || '4.8'} ({reviews.length} reviews)
                </div>
              </div>

              <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>{laundry.business_name}</h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} color="var(--primary)" />
                  <strong>{laundry.area}, Kano:</strong> {laundry.address}
                </div>
                {laundry.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={16} color="var(--primary)" />
                    {laundry.phone}
                  </div>
                )}
              </div>

              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '750px' }}>
                {laundry.description}
              </p>
            </div>

            {/* Quick Action Booking Card */}
            <div style={{
              background: 'var(--bg-muted)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '300px',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Turnaround Time</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={18} color="var(--primary)" />
                  {laundry.turnaround_days} Business Days
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pickup Availability</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={18} color={laundry.offers_pickup ? 'var(--primary)' : 'var(--text-muted)'} />
                  {laundry.offers_pickup ? `Doorstep (₦${parseFloat(laundry.delivery_fee).toLocaleString()})` : 'Drop-off only'}
                </div>
              </div>

              <Link to={`/customer/book?laundryId=${laundry.id}`} className="btn btn-primary btn-block btn-lg">
                Book This Laundry
              </Link>
            </div>
          </div>
        </div>

        {/* Content Layout: Services Menu on Left, Details & Reviews on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {/* Services Section */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2>Services & Pricing (₦)</h2>
              
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      border: '1px solid',
                      borderColor: selectedCategory === cat ? 'var(--primary)' : 'var(--border-light)',
                      background: selectedCategory === cat ? 'var(--primary-light)' : 'white',
                      color: selectedCategory === cat ? 'var(--primary-dark)' : 'var(--text-secondary)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    {categoryLabels[cat] || cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No services listed in this category.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {filteredServices.map((service) => (
                  <div key={service.id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', flex: 1, paddingRight: '0.5rem' }}>
                        {service.name}
                      </h4>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ₦{parseFloat(service.unit_price).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {categoryLabels[service.category] || service.category} • {service.unit_type?.replace(/_/g, ' ')}
                    </div>

                    {service.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Customer Reviews Section */}
            <div style={{ marginTop: '3.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
                Customer Reviews & Verification ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customer reviews yet. Book an order and be the first to review!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviews.map((rev) => (
                    <div key={rev.id} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rev.customer_name || 'Kano Customer'}</span>
                        <div style={{ display: 'flex', gap: '0.15rem', color: '#f59e0b' }}>
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                        "{rev.comment || 'Excellent handling of garments and fast turnaround!'}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Platform Safeguards Summary */}
          <div>
            <div className="card" style={{ background: '#f8fafc', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Chain of Custody Guarantee</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', gap: '0.6rem' }}>
                  <Check size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Mandatory Intake Audit:</strong> When your clothes arrive at {laundry.business_name}, every item and condition note is documented.
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.6rem' }}>
                  <Check size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Zero Surprise Fees:</strong> If the laundry discovers tough stains requiring extra treatment, you must approve the new total first.
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.6rem' }}>
                  <Check size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Direct Platform Escrow:</strong> Platform holds simulated payment and only releases payout upon completed return.
                  </div>
                </li>
              </ul>

              <div style={{ marginTop: '1.75rem' }}>
                <Link to={`/customer/book?laundryId=${laundry.id}`} className="btn btn-primary btn-block">
                  Start Order with {laundry.business_name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
