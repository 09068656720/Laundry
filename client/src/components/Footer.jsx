import React from 'react';
import { Link } from 'react-router-dom';
import { Shirt, MapPin, Shield, CheckCircle, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '3.5rem 0 2rem', marginTop: 'auto', borderTop: '1px solid #1e293b' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          {/* Brand info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px' }}>
                <Shirt size={20} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                Kano<span style={{ color: 'var(--primary)' }}>Laundry</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#94a3b8' }}>
              The trusted two-sided laundry and dry-cleaning marketplace connecting Kano residents and businesses with vetted, reliable local fabric care specialists.
            </p>
          </div>

          {/* Kano Coverage Areas */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>
              <MapPin size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />
              Coverage Areas in Kano
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Nasarawa & GRA</li>
              <li>Sabon Gari & France Road</li>
              <li>Bompai Industrial Area</li>
              <li>Tarauni & Court Road</li>
              <li>Fagge Commercial District</li>
              <li>Kano Municipal & Gidan Murtala</li>
            </ul>
          </div>

          {/* Value props & Trust */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>
              <Shield size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />
              Chain of Custody Guarantee
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> Physical intake condition audit
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> No surprise fees without customer approval
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> Strict 100% verified partner onboarding
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} color="#10b981" /> Guaranteed turnaround date estimates
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><Link to="/browse" style={{ color: '#94a3b8' }}>Browse Kano Laundries</Link></li>
              <li><Link to="/how-it-works" style={{ color: '#94a3b8' }}>How It Works</Link></li>
              <li><Link to="/register?role=partner" style={{ color: '#94a3b8' }}>Register as Laundry Partner</Link></li>
              <li><Link to="/login" style={{ color: '#94a3b8' }}>Sign In to Portal</Link></li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem' }}>
          <div>
            © {new Date().getFullYear()} Kano Laundry Platform. Built for Kano, Nigeria. All rights reserved.
          </div>
          <div>
            Fabric care with accountability, transparent pricing & peace of mind.
          </div>
        </div>
      </div>
    </footer>
  );
}
