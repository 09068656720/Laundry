import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  Clock,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function PartnerServices() {
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Add Service Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('native_wear');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('per_piece');
  const [newDesc, setNewDesc] = useState('');

  // Profile Edit State
  const [turnaroundDays, setTurnaroundDays] = useState('2');
  const [offersPickup, setOffersPickup] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState('1000');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const loadData = async () => {
    try {
      const [profRes, servRes] = await Promise.all([
        api.getPartnerProfile(),
        api.getPartnerServices(),
      ]);
      setProfile(profRes.laundry);
      setServices(servRes.services || []);

      if (profRes.laundry) {
        setTurnaroundDays(profRes.laundry.turnaround_days?.toString() || '2');
        setOffersPickup(profRes.laundry.offers_pickup);
        setDeliveryFee(profRes.laundry.delivery_fee?.toString() || '1000');
        setPhone(profRes.laundry.phone || '');
        setAddress(profRes.laundry.address || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.updatePartnerProfile({
        turnaroundDays: parseInt(turnaroundDays) || 2,
        offersPickup,
        deliveryFee: parseFloat(deliveryFee) || 0,
        phone,
        address,
      });
      setMessage('Shop settings updated successfully!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update shop profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.createPartnerService({
        name: newName,
        category: newCategory,
        unitPrice: parseFloat(newPrice),
        unitType: newType,
        description: newDesc,
      });
      setShowAddModal(false);
      setNewName('');
      setNewPrice('');
      setNewDesc('');
      setMessage('New service added to your laundry menu!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to remove this service from your public menu?')) return;
    try {
      await api.deletePartnerService(serviceId);
      setMessage('Service deactivated.');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete service.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading services & pricing...
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1050px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Services, Pricing & Operations</h1>
            <p>Customize your service catalog, prices in Naira (₦), turnaround days, and delivery fees.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add New Service
          </button>
        </div>

        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} /> {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Left Column: Services & Prices Menu */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Your Laundry Price Menu ({services.length})</h2>
              </div>

              {services.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  No services configured. Click "Add New Service" to create your menu.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Service Name</th>
                        <th>Category</th>
                        <th>Unit Price</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.name}</strong>
                            {s.description && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.description}</div>
                            )}
                          </td>
                          <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                            {s.category?.replace(/_/g, ' ')}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                              ₦{parseFloat(s.unit_price).toLocaleString()}
                            </strong>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {s.unit_type?.replace(/_/g, ' ')}
                          </td>
                          <td>
                            <span className={s.is_active ? 'badge badge-completed' : 'badge badge-rejected'}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(s.id)}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                              title="Delete service"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Operational Settings */}
          <div>
            <div className="card" style={{ padding: '1.75rem', position: 'sticky', top: '90px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={20} color="var(--primary)" /> Operational Settings
              </h2>

              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label className="form-label">Promised Turnaround (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    required
                    className="form-input"
                    value={turnaroundDays}
                    onChange={(e) => setTurnaroundDays(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Shown to customers at booking to calculate return date.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Pickup & Delivery Fee (₦)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    className="form-input"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Paid by customer and disbursed directly to you.
                  </span>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={offersPickup}
                      onChange={(e) => setOffersPickup(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                    />
                    Enable Customer Doorstep Pickup
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Shop Street Address</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={saving} className="btn btn-primary btn-block">
                  <Save size={16} /> Save Operational Settings
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ADD SERVICE MODAL */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginBottom: '1.25rem' }}>Add Service to Menu</h3>

              <form onSubmit={handleAddService}>
                <div className="form-group">
                  <label className="form-label">Service Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Babbar Riga Extra Starch & Steam"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="native_wear">Native Wear (Kaftan / Babbar Riga)</option>
                      <option value="dry_clean">Dry Cleaning</option>
                      <option value="wash_fold">Wash & Fold</option>
                      <option value="ironing">Steam Press / Ironing</option>
                      <option value="suits">Suits & Blazers</option>
                      <option value="bedding">Bedding & Duvets</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit Price (₦)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      className="form-input"
                      placeholder="e.g. 2500"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Type</label>
                  <select
                    className="form-select"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="per_piece">Per Piece</option>
                    <option value="per_kg">Per Kg</option>
                    <option value="per_pair">Per Pair</option>
                    <option value="per_set">Per Set</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Care details, specialized solvent used, or packaging note..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Adding...' : 'Add Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
