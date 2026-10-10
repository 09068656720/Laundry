import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  PackageCheck,
  Scale
} from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: Search,
      title: 'Browse & Select a Kano Laundry',
      desc: 'Explore vetted local laundry partners across Nasarawa, Sabon Gari, Bompai, Tarauni, Fagge, and Kano Municipal. Compare ratings, real turnaround days, and native wear pricing.',
    },
    {
      num: '02',
      icon: Truck,
      title: 'Choose Pickup or Drop-off',
      desc: 'Select doorstep pickup (where you pay the standard delivery fee) or drop-off directly at the laundry branch. Choose your garment checklist and see your exact estimated return date.',
    },
    {
      num: '03',
      icon: PackageCheck,
      title: 'Intake Inspection & Chain of Custody',
      desc: 'When your clothes arrive, the laundry partner inspects every garment. They log counts and condition notes (such as existing tears, missing buttons, or stains). You see this exact verified record.',
    },
    {
      num: '04',
      icon: Scale,
      title: 'Price Protection & Approval',
      desc: 'If the laundry discovers heavy grease or palm oil stains requiring specialized solvent treatment, they must submit a price change request. You approve the updated total before washing begins.',
    },
    {
      num: '05',
      icon: Sparkles,
      title: 'Cleaning, Pressing & Quality Check',
      desc: 'Garments undergo professional dry cleaning, traditional Hausa starching, or steam pressing. You can follow live progress through every status milestone.',
    },
    {
      num: '06',
      icon: CheckCircle2,
      title: 'Doorstep Return & Sign-Off',
      desc: 'Clothes are bagged and returned to your address on or before the promised turnaround date. The platform verifies completion and releases the partner payout.',
    },
  ];

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--primary-light)',
            color: 'var(--primary-dark)',
            padding: '0.3rem 0.8rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={16} />
            Two-Sided Accountability
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How Kano Laundry Platform Works</h1>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            A dependable system designed specifically to eliminate disputes, protect valuable Northern fabrics, and bring steady customers to trusted Kano laundries.
          </p>
        </div>

        {/* Steps Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="card" style={{ padding: '2rem', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: 'var(--border-light)',
                  lineHeight: 1
                }}>
                  {s.num}
                </div>

                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <Icon size={24} />
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Comparison Table / Problem Solver */}
        <div className="card" style={{ padding: '2.5rem', marginBottom: '4rem', background: '#f8fafc' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Traditional Kano Laundry vs. Kano Laundry Platform</h2>

          <div className="table-responsive">
            <table className="table" style={{ background: 'white', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Experience Factor</th>
                  <th style={{ width: '35%', color: '#dc2626' }}>Traditional Way (Paper / WhatsApp)</th>
                  <th style={{ width: '35%', color: 'var(--primary)' }}>Kano Laundry Platform</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Garment Inventory</strong></td>
                  <td style={{ color: '#991b1b' }}>Scribbled on paper; "he said, she said" disputes when items go missing.</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Digital chain of custody verified at intake with condition notes.</td>
                </tr>
                <tr>
                  <td><strong>Price Transparency</strong></td>
                  <td style={{ color: '#991b1b' }}>Unannounced price increases when collecting finished clothes.</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Upfront pricing; changes require customer approval in-app.</td>
                </tr>
                <tr>
                  <td><strong>Return Dates</strong></td>
                  <td style={{ color: '#991b1b' }}>Uncertain promises; customer repeatedly calls for updates.</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Calculated turnaround date displayed before booking.</td>
                </tr>
                <tr>
                  <td><strong>Partner Quality</strong></td>
                  <td style={{ color: '#991b1b' }}>Unverified shops with no accountability for damage.</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Only admin-vetted partners with verified track records.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '1rem' }}>
            Ready for Worry-Free Laundry in Kano?
          </h2>
          <p style={{ color: '#d1fae5', maxWidth: 600, margin: '0 auto 2rem', fontSize: '1.05rem' }}>
            Book your first pickup today or register your laundry shop to start receiving verified bookings.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/browse" className="btn btn-secondary btn-lg" style={{ background: 'white', color: 'var(--primary-dark)', borderColor: 'white' }}>
              Browse Kano Laundries <ArrowRight size={18} />
            </Link>
            <Link to="/register?role=partner" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.4)' }}>
              Register as Partner Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
