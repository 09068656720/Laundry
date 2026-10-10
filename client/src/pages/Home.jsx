import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  Truck,
  CheckCircle2,
  Star,
  MapPin,
  ArrowRight,
  Shirt,
  Store
} from 'lucide-react';

export default function Home() {
  const [laundries, setLaundries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await api.getLaundries();
        setLaundries(data.laundries.slice(0, 3));
      } catch (err) {
        console.error('Failed to load featured laundries:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/browse?search=${encodeURIComponent(searchTerm)}`);
  };

  const areas = ['Nasarawa', 'Sabon Gari', 'Bompai', 'Tarauni', 'Fagge', 'Kano Municipal'];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        color: 'white',
        padding: '4.5rem 0 5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative background circle */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              padding: '0.35rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#a7f3d0',
              marginBottom: '1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Sparkles size={15} />
              Kano's Two-Sided Fabric Care & Dry Cleaning Marketplace
            </div>

            <h1 style={{ color: 'white', fontSize: '2.75rem', fontWeight: 800, marginBottom: '1.25rem', lineHeight: 1.15 }}>
              Effortless Laundry in Kano with Guaranteed Chain of Custody
            </h1>

            <p style={{ color: '#d1fae5', fontSize: '1.15rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
              No more misplaced clothes, unexpected price hikes, or delayed pickups. Browse verified local Kano laundries, schedule doorstep pickup, inspect garment intake records, and track your clothes from wash to delivery.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              maxWidth: '620px',
              margin: '0 auto 1.5rem',
              gap: '0.5rem'
            }}>
              <div style={{ padding: '0 0.75rem', color: 'var(--text-muted)' }}>
                <Search size={22} />
              </div>
              <input
                type="text"
                placeholder="Search by laundry name, Babbar Riga, Kaftan, Suits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  color: 'var(--text-main)'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                Find Laundries
              </button>
            </form>

            {/* Quick Area Tags */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.825rem', color: '#a7f3d0', fontWeight: 600 }}>Popular Kano Areas:</span>
              {areas.map((area) => (
                <Link
                  key={area}
                  to={`/browse?area=${encodeURIComponent(area)}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Cards */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>Why Kano Trusts Our Platform</h2>
            <p>We built the safeguards missing from paper receipts and informal messaging.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
              }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Garment Chain of Custody</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every clothing item is verified upon intake. Condition notes like stains, loose buttons, or fabric tears are documented so both you and the laundry share an indisputable record.
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--secondary)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px', background: 'var(--secondary-light)', color: 'var(--secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
              }}>
                <CheckCircle2 size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Price Change Approval</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                If deep stain extraction or special starch treatment is needed, the laundry must request your approval before proceeding. No surprise bills on delivery.
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
              }}>
                <Clock size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Guaranteed Turnaround Dates</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                Each laundry provides verified turnaround times. You see the exact estimated return date before booking, with milestone alerts at every step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Laundries */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-page)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Vetted Partners
              </div>
              <h2>Featured Laundries in Kano</h2>
            </div>
            <Link to="/browse" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              View All Laundries <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading top laundries...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {laundries.map((laundry) => (
                <div key={laundry.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="badge badge-verified">
                      <ShieldCheck size={12} /> Verified Kano Partner
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontWeight: 700, fontSize: '0.9rem' }}>
                      <Star size={16} fill="#f59e0b" color="#f59e0b" />
                      {laundry.rating || '4.8'}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{laundry.business_name}</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <MapPin size={14} />
                    <span>{laundry.area}, Kano</span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', flex: 1, lineHeight: 1.5 }}>
                    {laundry.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderTop: '1px solid var(--border-light)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Turnaround</span>
                      <strong>{laundry.turnaround_days} Days</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Pickup</span>
                      <strong>{laundry.offers_pickup ? `₦${parseFloat(laundry.delivery_fee).toLocaleString()}` : 'Drop-off only'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Starts at</span>
                      <strong style={{ color: 'var(--primary)' }}>₦{parseFloat(laundry.min_price || 600).toLocaleString()}</strong>
                    </div>
                  </div>

                  <Link to={`/laundries/${laundry.id}`} className="btn btn-primary btn-block">
                    View Services & Book
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Northern Cultural Garment Care Focus */}
      <section style={{ padding: '4rem 0', background: 'white' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Kano Garment Expertise
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                Specialized Care for Traditional Northern Attire
              </h2>
              <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                We understand the investment and pride in authentic Nigerian textiles. Our onboarded Kano laundry partners specialize in:
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '2px' }}><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>Royal Babbar Riga & Agbada Dry Cleaning:</strong> Gentle hand-finishing, gold thread embroidery protection, and crisp traditional starching.
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '2px' }}><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>Kaftans & Shadda / Guinea Brocade:</strong> Anti-fade treatment and razor-sharp crease pressing.
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '2px' }}><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>Traditional Hula (Cap) Starching:</strong> Authentic hand-starching and shaping.
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '2px' }}><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>Executive Suits & Everyday Family Laundry:</strong> Gentle fabric washing, drying and neat packaging.
                  </div>
                </li>
              </ul>

              <Link to="/browse" className="btn btn-primary btn-lg">
                Book Native Wear Care <ArrowRight size={18} />
              </Link>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#064e3b' }}>Are You a Kano Laundry Business?</h3>
              <p style={{ color: '#065f46', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Join our network of verified laundry partners. Stop relying solely on walk-ins and paper receipts. Get steady digital bookings, automated garment inventory tracking, and direct payouts.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> Free onboarding & business profile
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> Digital chain of custody eliminates disputes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> Transparent 90% payout on every completed order
                </div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Link to="/register?role=partner" className="btn btn-primary btn-block">
                  <Store size={18} /> Register as Partner Shop
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
