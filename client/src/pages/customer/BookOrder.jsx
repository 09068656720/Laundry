import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Calendar,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function BookOrder() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [laundries, setLaundries] = useState([]);
  const [selectedLaundryId, setSelectedLaundryId] = useState(searchParams.get('laundryId') || '');
  const [selectedLaundry, setSelectedLaundry] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);

  // Booking Form State
  const [serviceType, setServiceType] = useState('pickup');
  const [pickupAddress, setPickupAddress] = useState(user?.customerAddress || '14 Zoo Road, Tarauni, Kano');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('simulated_card');

  // Garment Checklist: Array of { serviceId, itemName, category, unitPrice, quantity, conditionNotes }
  const [selectedItems, setSelectedItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch all approved laundries
  useEffect(() => {
    async function loadLaundries() {
      try {
        const data = await api.getLaundries();
        setLaundries(data.laundries || []);

        // If laundryId preselected
        const preselected = searchParams.get('laundryId');
        if (preselected) {
          setSelectedLaundryId(preselected);
        } else if (data.laundries?.length > 0) {
          setSelectedLaundryId(data.laundries[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load laundries:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLaundries();
  }, [searchParams]);

  // 2. Fetch selected laundry details and services
  useEffect(() => {
    async function loadLaundryDetails() {
      if (!selectedLaundryId) return;
      try {
        const data = await api.getLaundryById(selectedLaundryId);
        setSelectedLaundry(data.laundry);
        const services = data.laundry.services || [];
        setAvailableServices(services);

        // Prepopulate 1-2 popular items if selectedItems is empty
        if (selectedItems.length === 0 && services.length > 0) {
          setSelectedItems([
            {
              serviceId: services[0].id,
              itemName: services[0].name,
              category: services[0].category,
              unitPrice: parseFloat(services[0].unit_price),
              quantity: 1,
              conditionNotes: '',
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load laundry services:', err);
      }
    }
    loadLaundryDetails();
  }, [selectedLaundryId]);

  // Calculation logic
  const itemSubtotal = selectedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const deliveryFee = serviceType === 'pickup' ? parseFloat(selectedLaundry?.delivery_fee || 1000) : 0;
  const serviceFee = 300.00;
  const totalAmount = itemSubtotal + deliveryFee + serviceFee;

  // Calculate estimated return date
  const turnaroundDays = selectedLaundry?.turnaround_days || 2;
  const estDateObj = new Date(pickupDate || new Date());
  estDateObj.setDate(estDateObj.getDate() + turnaroundDays);
  const estimatedReturnDateFormatted = estDateObj.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleAddItem = (service) => {
    const existingIndex = selectedItems.findIndex((it) => it.serviceId === service.id);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          serviceId: service.id,
          itemName: service.name,
          category: service.category,
          unitPrice: parseFloat(service.unit_price),
          quantity: 1,
          conditionNotes: '',
        },
      ]);
    }
  };

  const handleUpdateQuantity = (index, delta) => {
    const updated = [...selectedItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setSelectedItems(updated);
  };

  const handleConditionNotesChange = (index, notes) => {
    const updated = [...selectedItems];
    updated[index].conditionNotes = notes;
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedItems.length === 0) {
      setError('Please add at least one garment to your booking checklist.');
      return;
    }

    if (serviceType === 'pickup' && !pickupAddress.trim()) {
      setError('Please provide your pickup address in Kano.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        laundryId: parseInt(selectedLaundryId),
        serviceType,
        pickupAddress: serviceType === 'pickup' ? pickupAddress : null,
        deliveryAddress: serviceType === 'pickup' ? pickupAddress : null,
        pickupDate,
        items: selectedItems,
        customerNotes,
        paymentMethod,
      };

      const res = await api.createOrder(payload);
      navigate(`/customer/orders/${res.order.id}`);
    } catch (err) {
      setError(err.message || 'Failed to place booking. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading booking portal...
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1050px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Book Laundry Service</h1>
          <p>Select your Kano laundry partner, itemise your garments, and see exact upfront pricing.</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
            
            {/* Left Column: Form Details & Garment Checklist */}
            <div style={{ gridColumn: 'span 2' }}>
              
              {/* Step 1: Select Laundry Partner */}
              <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                  Select Kano Laundry Partner
                </h3>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Choose Laundry</label>
                  <select
                    className="form-select"
                    value={selectedLaundryId}
                    onChange={(e) => setSelectedLaundryId(e.target.value)}
                  >
                    {laundries.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.business_name} ({l.area}, Kano) • {l.turnaround_days} Days Turnaround
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLaundry && (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Location:</span>{' '}
                      <strong>{selectedLaundry.address}, {selectedLaundry.area}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Turnaround:</span>{' '}
                      <strong style={{ color: 'var(--primary)' }}>{selectedLaundry.turnaround_days} Days</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Pickup Fee:</span>{' '}
                      <strong>{selectedLaundry.offers_pickup ? `₦${parseFloat(selectedLaundry.delivery_fee).toLocaleString()}` : 'Drop-off only'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Service Type & Scheduling */}
              <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                  Service Logistics & Schedule
                </h3>

                {/* Service Type Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <label style={{
                    border: '1.5px solid',
                    borderColor: serviceType === 'pickup' ? 'var(--primary)' : 'var(--border-light)',
                    background: serviceType === 'pickup' ? 'var(--primary-light)' : 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    cursor: selectedLaundry?.offers_pickup ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    opacity: selectedLaundry?.offers_pickup ? 1 : 0.5
                  }}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="pickup"
                      disabled={!selectedLaundry?.offers_pickup}
                      checked={serviceType === 'pickup'}
                      onChange={() => setServiceType('pickup')}
                      style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        Doorstep Pickup & Return
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Delivery fee: ₦{parseFloat(selectedLaundry?.delivery_fee || 1000).toLocaleString()}
                      </span>
                    </div>
                  </label>

                  <label style={{
                    border: '1.5px solid',
                    borderColor: serviceType === 'dropoff' ? 'var(--primary)' : 'var(--border-light)',
                    background: serviceType === 'dropoff' ? 'var(--primary-light)' : 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="dropoff"
                      checked={serviceType === 'dropoff'}
                      onChange={() => setServiceType('dropoff')}
                      style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        Self Drop-off & Collection
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                        ₦0 (No delivery fee)
                      </span>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{serviceType === 'pickup' ? 'Pickup Date' : 'Drop-off Date'}</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={pickupDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setPickupDate(e.target.value)}
                    />
                  </div>

                  {serviceType === 'pickup' && (
                    <div className="form-group">
                      <label className="form-label">Pickup & Delivery Address in Kano</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. 14 Zoo Road, Tarauni, Kano"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Special Customer Instructions (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Please pick up between 10am-12pm, call on arrival"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Step 3: Garment Item Checklist */}
              <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</span>
                    Garment Checklist & Condition Notes
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
                  </span>
                </div>

                {/* Quick Add Buttons from Available Services */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Click to add items from {selectedLaundry?.business_name}'s menu:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {availableServices.map((service) => (
                      <button
                        type="button"
                        key={service.id}
                        onClick={() => handleAddItem(service)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.8rem', background: 'white' }}
                      >
                        <Plus size={13} /> {service.name} (₦{parseFloat(service.unit_price).toLocaleString()})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Items List */}
                {selectedItems.length === 0 ? (
                  <div style={{ background: '#f8fafc', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                    No garments added yet. Click items above to add them to your checklist.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          background: 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.itemName}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              ₦{item.unitPrice.toLocaleString()} each
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(index, -1)}
                                style={{ border: 'none', background: 'none', padding: '0.3rem 0.5rem', cursor: 'pointer' }}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ padding: '0 0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(index, 1)}
                                style={{ border: 'none', background: 'none', padding: '0.3rem 0.5rem', cursor: 'pointer' }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <span style={{ fontWeight: 800, color: 'var(--primary)', minWidth: '70px', textAlign: 'right' }}>
                              ₦{(item.quantity * item.unitPrice).toLocaleString()}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Customer Condition / Care Notes */}
                        <div>
                          <input
                            type="text"
                            placeholder="Add condition note: e.g. Pre-existing stain on collar, delicate embroidery, heavy starch"
                            value={item.conditionNotes}
                            onChange={(e) => handleConditionNotesChange(index, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.75rem',
                              fontSize: '0.8rem',
                              border: '1px dashed var(--border-light)',
                              borderRadius: 'var(--radius-sm)',
                              background: '#f8fafc'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 4: Simulated Payment Method */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>4</span>
                  Payment Method (Phase 1 Simulated)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <label style={{
                    border: '1.5px solid',
                    borderColor: paymentMethod === 'simulated_card' ? 'var(--primary)' : 'var(--border-light)',
                    background: paymentMethod === 'simulated_card' ? 'var(--primary-light)' : 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="simulated_card"
                      checked={paymentMethod === 'simulated_card'}
                      onChange={() => setPaymentMethod('simulated_card')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <CreditCard size={18} color="var(--primary)" />
                      <strong style={{ display: 'block', fontSize: '0.85rem' }}>Debit Card</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simulated instant pay</span>
                    </div>
                  </label>

                  <label style={{
                    border: '1.5px solid',
                    borderColor: paymentMethod === 'simulated_transfer' ? 'var(--primary)' : 'var(--border-light)',
                    background: paymentMethod === 'simulated_transfer' ? 'var(--primary-light)' : 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="simulated_transfer"
                      checked={paymentMethod === 'simulated_transfer'}
                      onChange={() => setPaymentMethod('simulated_transfer')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <Building2 size={18} color="var(--secondary)" />
                      <strong style={{ display: 'block', fontSize: '0.85rem' }}>Bank Transfer</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Instant verification</span>
                    </div>
                  </label>

                  <label style={{
                    border: '1.5px solid',
                    borderColor: paymentMethod === 'cash_on_delivery' ? 'var(--primary)' : 'var(--border-light)',
                    background: paymentMethod === 'cash_on_delivery' ? 'var(--primary-light)' : 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <Wallet size={18} color="#d97706" />
                      <strong style={{ display: 'block', fontSize: '0.85rem' }}>Pay on Return</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pay upon delivery</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column: Checkout Breakdown & Guarantee */}
            <div>
              <div className="card" style={{ position: 'sticky', top: '90px', padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Order Price Breakdown</h3>

                {/* Estimated Return Date Banner */}
                <div style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Calendar size={22} color="var(--primary)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Estimated Return Date
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                      {estimatedReturnDateFormatted}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Based on {turnaroundDays} days turnaround
                    </span>
                  </div>
                </div>

                {/* Price Breakdown Line Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Garments Subtotal ({selectedItems.reduce((a, b) => a + b.quantity, 0)} items)</span>
                    <strong>₦{itemSubtotal.toLocaleString()}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Delivery Fee ({serviceType === 'pickup' ? 'Doorstep' : 'Self Drop-off'})
                    </span>
                    <strong>₦{deliveryFee.toLocaleString()}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Platform Service Fee</span>
                    <strong>₦{serviceFee.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total Amount</span>
                  <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* Confirm Button */}
                <button
                  type="submit"
                  disabled={submitting || selectedItems.length === 0}
                  className="btn btn-primary btn-block btn-lg"
                >
                  {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.4 }}>
                  🔒 Garments are protected by our Chain of Custody Guarantee. Any physical condition changes or price modifications require your explicit approval.
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
