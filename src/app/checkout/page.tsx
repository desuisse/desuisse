'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { useCart } from '@/lib/CartContext';
import { sanitizeText, sanitizeEmail, sanitizePhone, LIMITS } from '@/lib/security';
import { materialLabel } from '@/data/products';

type Step = 'info' | 'shipping' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const { language } = useLanguage();
  const { items, total: cartTotal, clearCart } = useCart();
  const [step, setStep] = useState<Step>('info');
  const [submitted, setSubmitted] = useState(false);
  const [stepError, setStepError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [shipping, setShipping] = useState({ address: '', city: '', zip: '', country: '', method: 'standard' });
  // deSuisse settles by bank transfer or cash on delivery, so the checkout
  // never handles card data — there is no card form to leak or mis-handle.
  const [payment, setPayment] = useState({ method: 'transfer' });

  const t = {
    title: language === 'sq' ? 'Arkëtimi' : 'Checkout',
    steps: {
      info: language === 'sq' ? 'Informacioni' : 'Information',
      shipping: language === 'sq' ? 'Dërgesa' : 'Shipping',
      payment: language === 'sq' ? 'Pagesa' : 'Payment',
      confirm: language === 'sq' ? 'Konfirmimi' : 'Confirm',
    },
    next: language === 'sq' ? 'Vazhdo' : 'Continue',
    back: language === 'sq' ? 'Kthehu' : 'Back',
    place: language === 'sq' ? 'Konfirmo Porosinë' : 'Place Order',
    firstName: language === 'sq' ? 'Emri' : 'First Name',
    lastName: language === 'sq' ? 'Mbiemri' : 'Last Name',
    email: 'Email',
    phone: language === 'sq' ? 'Telefon' : 'Phone',
    address: language === 'sq' ? 'Adresa' : 'Address',
    city: language === 'sq' ? 'Qyteti' : 'City',
    zip: language === 'sq' ? 'Kodi Postar' : 'ZIP / Postal Code',
    country: language === 'sq' ? 'Shteti' : 'Country',
    shippingMethod: language === 'sq' ? 'Metoda e Dërgimit' : 'Shipping Method',
    standard: language === 'sq' ? 'Standard (5–10 ditë pune) — Falas' : 'Standard (5–10 business days) — Free',
    express: language === 'sq' ? 'Express (2–3 ditë pune) — 9.99€' : 'Express (2–3 business days) — 9.99€',
    paymentMethod: language === 'sq' ? 'Metoda e Pagesës' : 'Payment Method',
    transfer: language === 'sq' ? 'Transfertë Bankare' : 'Bank Transfer',
    cash: language === 'sq' ? 'Para në dorëzim' : 'Cash on Delivery',
    cashNote: language === 'sq'
      ? 'Paguani në dorë kur ta merrni porosinë. Stafi ynë ju kontakton për të konfirmuar dorëzimin.'
      : 'Pay in cash when your order arrives. Our staff will contact you to confirm delivery.',
    reviewTitle: language === 'sq' ? 'Shqyrto Porosinë' : 'Review Your Order',
    infoLabel: language === 'sq' ? 'Informacioni Personal' : 'Personal Info',
    shippingLabel: language === 'sq' ? 'Adresa e Dërgimit' : 'Shipping Address',
    paymentLabel: language === 'sq' ? 'Pagesa' : 'Payment',
    edit: language === 'sq' ? 'Ndrysho' : 'Edit',
    thankYou: language === 'sq' ? 'Faleminderit për porosinë tuaj!' : 'Thank you for your order!',
    thankYouSub: language === 'sq' ? 'Do të merrni një email konfirmimi së shpejti.' : 'You will receive a confirmation email shortly.',
    continueShopping: language === 'sq' ? 'Vazhdo me blerjet' : 'Continue Shopping',
    orderSummary: language === 'sq' ? 'Përmbledhja e Porosisë' : 'Order Summary',
    emptyCart: language === 'sq' ? 'Shporta juaj është bosh.' : 'Your cart is empty.',
    browseCta: language === 'sq' ? 'Shfleto dyqanin' : 'Browse the shop',
    subtotal: language === 'sq' ? 'Nëntotali' : 'Subtotal',
    shippingCost: language === 'sq' ? 'Dërgesa' : 'Shipping',
    total: language === 'sq' ? 'Totali' : 'Total',
    free: language === 'sq' ? 'Falas' : 'Free',
  };

  const stepList: Step[] = ['info', 'shipping', 'payment', 'confirm'];
  const currentIdx = stepList.indexOf(step);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e8e0d4',
    fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none',
    transition: 'border-color 0.2s', background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
    letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999',
    display: 'block', marginBottom: 6,
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#c9a84c';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#e8e0d4';
  };

  if (submitted) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f7f3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 16 }}>{t.thankYou}</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#888', marginBottom: 36, lineHeight: 1.8 }}>{t.thankYouSub}</p>
          <Link href="/shop" className="btn-dark">{t.continueShopping}</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div style={{ background: '#f7f3ee', padding: '48px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <h1 className="section-title">{t.title}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '16px auto 0' }} />
      </div>

      {/* Step indicator */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e0d4', padding: '0 40px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex' }}>
          {stepList.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', borderBottom: step === s ? '2px solid #c9a84c' : '2px solid transparent', cursor: i <= currentIdx ? 'pointer' : 'default' }}
                onClick={() => { if (i < currentIdx) setStep(s); }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < currentIdx ? '#c9a84c' : i === currentIdx ? '#1a0a0a' : '#e8e0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, transition: 'background 0.2s' }}>
                  {i < currentIdx ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a0a0a" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: i === currentIdx ? '#fff' : '#999' }}>{i + 1}</span>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: i === currentIdx ? '#1a0a0a' : i < currentIdx ? '#c9a84c' : '#bbb' }}>
                  {t.steps[s]}
                </span>
              </div>
              {i < stepList.length - 1 && <div style={{ width: 1, height: 20, background: '#e8e0d4', margin: '0 4px' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 40px 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }} className="checkout-grid">

        {/* Main form */}
        <div>

          {/* STEP 1: Personal Info */}
          {step === 'info' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 28 }}>{t.steps.info}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>{t.firstName} *</label>
                  <input style={inputStyle} value={info.firstName} onChange={e => setInfo({ ...info, firstName: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="Jane" required />
                </div>
                <div>
                  <label style={labelStyle}>{t.lastName} *</label>
                  <input style={inputStyle} value={info.lastName} onChange={e => setInfo({ ...info, lastName: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="Smith" required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t.email} *</label>
                <input type="email" style={inputStyle} value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="jane@example.com" required />
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>{t.phone}</label>
                <input type="tel" inputMode="tel" pattern="[0-9+\-\s()]+" style={inputStyle} value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value.replace(/[^0-9+\-\s()]/g, '') })} onFocus={onFocus} onBlur={onBlur} placeholder="+383 44 000 000" />
              </div>
              <button className="btn-dark" onClick={() => {
                setStepError('');
                const cleanFirst = sanitizeText(info.firstName, LIMITS.NAME);
                const cleanLast = sanitizeText(info.lastName, LIMITS.NAME);
                const cleanEmail = sanitizeEmail(info.email);
                if (!cleanFirst || !cleanLast) { setStepError(language === 'sq' ? 'Ju lutem shkruani emrin tuaj.' : 'Please enter your name.'); return; }
                if (!cleanEmail) { setStepError(language === 'sq' ? 'Ju lutem shkruani një email të vlefshëm.' : 'Please enter a valid email address.'); return; }
                setInfo({ ...info, firstName: cleanFirst, lastName: cleanLast, email: cleanEmail, phone: sanitizePhone(info.phone) });
                setStep('shipping');
              }} style={{ minWidth: 180, textAlign: 'center' }}>
                {t.next} →
              </button>
              {stepError && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c0392b', marginTop: 12 }}>{stepError}</p>}
            </div>
          )}

          {/* STEP 2: Shipping */}
          {step === 'shipping' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 28 }}>{t.steps.shipping}</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t.address} *</label>
                <input style={inputStyle} value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="Eliot Engjell, 55" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>{t.city} *</label>
                  <input style={inputStyle} value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="Pejë" required />
                </div>
                <div>
                  <label style={labelStyle}>{t.zip} *</label>
                  <input style={inputStyle} value={shipping.zip} onChange={e => setShipping({ ...shipping, zip: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="30000" required />
                </div>
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>{t.country} *</label>
                <select style={{ ...inputStyle }} value={shipping.country} onChange={e => setShipping({ ...shipping, country: e.target.value })} onFocus={onFocus} onBlur={onBlur} required>
                  <option value="">—</option>
                  {['Kosovo', 'Albania', 'North Macedonia', 'Serbia', 'Czech Republic', 'Germany', 'Switzerland', 'Austria', 'United Kingdom', 'United States', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>{t.shippingMethod}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(['standard', 'express'] as const).map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', border: `1px solid ${shipping.method === m ? '#c9a84c' : '#e8e0d4'}`, cursor: 'pointer', transition: 'border-color 0.2s', background: shipping.method === m ? '#fdf9f0' : '#fff' }}>
                      <input type="radio" name="shippingMethod" value={m} checked={shipping.method === m} onChange={() => setShipping({ ...shipping, method: m })} style={{ accentColor: '#c9a84c' }} />
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#444' }}>{m === 'standard' ? t.standard : t.express}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('info')} style={{ padding: '14px 28px', background: 'transparent', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', color: '#888' }}>← {t.back}</button>
                <button className="btn-dark" onClick={() => {
                  setStepError('');
                  const cleanAddr = sanitizeText(shipping.address, LIMITS.ADDRESS);
                  const cleanCity = sanitizeText(shipping.city, LIMITS.CITY);
                  const cleanZip = sanitizeText(shipping.zip, LIMITS.ZIP);
                  if (!cleanAddr || !cleanCity || !cleanZip || !shipping.country) {
                    setStepError(language === 'sq' ? 'Ju lutem plotësoni adresën.' : 'Please fill in your full address.');
                    return;
                  }
                  setShipping({ ...shipping, address: cleanAddr, city: cleanCity, zip: cleanZip });
                  setStep('payment');
                }} style={{ minWidth: 180, textAlign: 'center' }}>{t.next} →</button>
              </div>
              {stepError && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c0392b', marginTop: 12 }}>{stepError}</p>}
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 'payment' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 28 }}>{t.steps.payment}</h2>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>{t.paymentMethod}</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['transfer', 'cash'] as const).map(m => (
                    <label key={m} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', border: `1px solid ${payment.method === m ? '#c9a84c' : '#e8e0d4'}`, cursor: 'pointer', transition: 'border-color 0.2s', background: payment.method === m ? '#fdf9f0' : '#fff' }}>
                      <input type="radio" name="paymentMethod" value={m} checked={payment.method === m} onChange={() => setPayment({ ...payment, method: m })} style={{ accentColor: '#c9a84c' }} />
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#444' }}>{m === 'transfer' ? t.transfer : t.cash}</span>
                    </label>
                  ))}
                </div>
              </div>

              {payment.method === 'transfer' && (
                <div style={{ background: '#f7f3ee', padding: '20px', border: '1px solid #e8e0d4', marginBottom: 32 }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666', lineHeight: 1.9 }}>
                    {language === 'sq' ? 'Llogaria bankare' : 'Bank Account'}: <strong>deSuisse SH.P.K.</strong><br />
                    IBAN: <strong>XK05 1212 0123 4567 8901 2</strong><br />
                    BIC: <strong>RBKOXKPR</strong><br />
                    {language === 'sq' ? 'Referenca: numri i porosisë suaj' : 'Reference: your order number'}
                  </p>
                </div>
              )}

              {payment.method === 'cash' && (
                <div style={{ background: '#f7f3ee', padding: '20px', border: '1px solid #e8e0d4', marginBottom: 32 }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666', lineHeight: 1.9 }}>
                    {t.cashNote}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('shipping')} style={{ padding: '14px 28px', background: 'transparent', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', color: '#888' }}>← {t.back}</button>
                <button className="btn-dark" onClick={() => {
                  setStepError('');
                  setStep('confirm');
                }} style={{ minWidth: 180, textAlign: 'center' }}>{t.next} →</button>
              </div>
              {stepError && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c0392b', marginTop: 12 }}>{stepError}</p>}
            </div>
          )}

          {/* STEP 4: Confirm */}
          {step === 'confirm' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 28 }}>{t.reviewTitle}</h2>
              {[
                { label: t.infoLabel, lines: [`${info.firstName} ${info.lastName}`, info.email, info.phone].filter(Boolean), editStep: 'info' as Step },
                { label: t.shippingLabel, lines: [shipping.address, `${shipping.city} ${shipping.zip}`, shipping.country, shipping.method === 'express' ? (language === 'sq' ? 'Express' : 'Express') : (language === 'sq' ? 'Standard' : 'Standard')].filter(Boolean), editStep: 'shipping' as Step },
                { label: t.paymentLabel, lines: [payment.method === 'transfer' ? t.transfer : t.cash].filter(Boolean), editStep: 'payment' as Step },
              ].map(section => (
                <div key={section.label} style={{ border: '1px solid #e8e0d4', padding: '20px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>{section.label}</p>
                    {section.lines.map((l, i) => <p key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444', marginBottom: 3 }}>{l}</p>)}
                  </div>
                  <button onClick={() => setStep(section.editStep)} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#c9a84c', cursor: 'pointer', letterSpacing: '0.05em', textDecoration: 'underline', flexShrink: 0 }}>{t.edit}</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button onClick={() => setStep('payment')} style={{ padding: '14px 28px', background: 'transparent', border: '1px solid #e8e0d4', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', color: '#888' }}>← {t.back}</button>
                <button className="btn-dark" disabled={isSubmitting} onClick={async () => {
                  setIsSubmitting(true);
                  setStepError('');
                  try {
                    const res = await fetch('/api/order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        firstName: info.firstName,
                        lastName: info.lastName,
                        email: info.email,
                        phone: info.phone,
                        address: shipping.address,
                        city: shipping.city,
                        zip: shipping.zip,
                        country: shipping.country,
                        shippingMethod: shipping.method,
                        paymentMethod: payment.method,
                        // The cart itself. Prices are re-derived server-side
                        // from the catalogue; these are sent only so the server
                        // can flag a disagreement (stale cart, edited request).
                        items: items.map(it => ({
                          productId: it.product.id,
                          qty: it.qty,
                          material: it.selectedMaterial,
                          size: it.selectedSize,
                          stone: it.selectedStone,
                          width: it.selectedWidth,
                          unitPrice: it.unitPrice,
                        })),
                        // For real payments, send a Stripe Payment Intent ID here instead
                      }),
                    });
                    if (res.status === 429) { setStepError('Too many requests. Please wait a moment.'); return; }
                    if (!res.ok) {
                      const detail = await res.json().catch(() => null) as { error?: string } | null;
                      setStepError(detail?.error || 'Something went wrong. Please try again.');
                      return;
                    }
                    clearCart();
                    setSubmitted(true);
                  } catch { setStepError('Connection error. Please check your internet.'); }
                  finally { setIsSubmitting(false); }
                }} style={{ minWidth: 200, textAlign: 'center', opacity: isSubmitting ? 0.6 : 1 }}>
                  {isSubmitting ? '...' : `✓ ${t.place}`}
                </button>
              </div>
              {stepError && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c0392b', marginTop: 12 }}>{stepError}</p>}
            </div>
          )}
        </div>

        {/* Order summary sidebar — reads from the actual cart */}
        <div style={{ background: '#f7f3ee', border: '1px solid #e8e0d4', padding: '28px', position: 'sticky', top: 24, alignSelf: 'start' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e8e0d4' }}>{t.orderSummary}</h3>

          {items.length === 0 ? (
            <>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#999', textAlign: 'center', padding: '16px 0' }}>{t.emptyCart}</p>
              <Link href="/shop" style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#c9a84c', letterSpacing: '0.08em', marginTop: 8, textDecoration: 'underline' }}>{t.browseCta}</Link>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12, borderBottom: '1px solid #ece4d6' }}>
                  <div style={{ width: 56, height: 56, position: 'relative', background: '#fff', flexShrink: 0, border: '1px solid #ece4d6' }}>
                    {it.product.image && (
                      <Image src={it.product.image} alt={it.product.name} fill style={{ objectFit: 'contain', padding: 4 }} unoptimized />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#1a0a0a', fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.product.name}
                    </p>
                    {(it.selectedMaterial || it.selectedStone || it.selectedSize) && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#888', marginBottom: 3, letterSpacing: '0.04em' }}>
                        {[materialLabel(it.selectedMaterial, language), it.selectedStone, it.selectedWidth, it.selectedSize].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#666' }}>
                      {it.qty} × {it.unitPrice.toLocaleString('de-DE')}.00€
                    </p>
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#1a0a0a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {(it.unitPrice * it.qty).toLocaleString('de-DE')}.00€
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid #e8e0d4', marginTop: 20, paddingTop: 16 }}>
            {(() => {
              const shippingFee = shipping.method === 'express' ? 9.99 : 0;
              const subtotal = cartTotal;
              const grandTotal = subtotal + shippingFee;
              const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
              return [
                { label: t.subtotal, value: fmt(subtotal) },
                { label: t.shippingCost, value: shippingFee === 0 ? t.free : fmt(shippingFee) },
                { label: t.total, value: fmt(grandTotal), bold: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: row.bold ? '#1a0a0a' : '#666', fontWeight: row.bold ? 600 : 400 }}>{row.value}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr !important; padding: 32px 20px 60px !important; }
        }
      `}</style>
    </>
  );
}
