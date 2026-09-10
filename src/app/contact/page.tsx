'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { sanitizeText, sanitizeEmail, sanitizePhone, LIMITS } from '@/lib/security';

export default function ContactPage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = sanitizeText(form.name, LIMITS.NAME);
    const cleanEmail = sanitizeEmail(form.email);
    const cleanPhone = sanitizePhone(form.phone);
    const cleanCompany = sanitizeText(form.company, LIMITS.COMPANY);
    const cleanMessage = sanitizeText(form.message, LIMITS.MESSAGE);

    if (!cleanName) { setFormError('Please enter a valid name.'); return; }
    if (!cleanEmail) { setFormError('Please enter a valid email address.'); return; }
    if (!cleanMessage || cleanMessage.length < 5) { setFormError('Please enter a message.'); return; }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, phone: cleanPhone, company: cleanCompany, message: cleanMessage }),
      });

      if (res.status === 429) {
        setFormError(t.contact.name === 'Emri Juaj'
          ? 'Shumë kërkesa. Ju lutem provoni përsëri më vonë.'
          : 'Too many submissions. Please try again later.');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError((data as Record<string, string>).error ?? 'Something went wrong. Please try again.');
        return;
      }

      alert(t.contact.name === 'Emri Juaj'
        ? 'Mesazhi u dërgua! Do t\'ju kontaktojmë së shpejti.'
        : 'Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch {
      setFormError('Connection error. Please check your internet and try again.');
    }
  };

  return (
    <>
      <Header />

      {/* Page Header */}
      <div style={{
        background: '#f7f3ee',
        padding: '48px 40px',
        textAlign: 'center',
        borderBottom: '1px solid #e8e0d4',
      }}>
        <h1 className="section-title">{t.nav.contact}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '16px auto 0' }} />
      </div>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }} className="contact-grid">

          {/* Contact Form */}
          <div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.8rem',
              fontWeight: 400,
              color: '#1a0a0a',
              marginBottom: 32,
              letterSpacing: '0.04em',
            }}>
              {t.contact.title}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="text"
                placeholder={t.contact.name}
                className="ds-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                maxLength={LIMITS.NAME}
                required
              />
              <input
                type="email"
                placeholder={t.contact.email}
                className="ds-input"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                maxLength={LIMITS.EMAIL}
                required
              />
              <input
                type="tel" inputMode="tel" pattern="[0-9+\-\s()]+"
                placeholder={t.contact.phone}
                className="ds-input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9+\-\s()]/g, '') })}
                maxLength={LIMITS.PHONE}
              />
              <input
                type="text"
                placeholder={t.contact.company}
                className="ds-input"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                maxLength={LIMITS.COMPANY}
              />
              <textarea
                placeholder={t.contact.message}
                className="ds-textarea"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                maxLength={LIMITS.MESSAGE}
                required
              />
              {formError && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c0392b' }}>{formError}</p>
              )}
              <button type="submit" className="btn-dark" style={{ alignSelf: 'flex-start' }}>
                {t.contact.send}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.8rem',
              fontWeight: 400,
              color: '#1a0a0a',
              marginBottom: 32,
              letterSpacing: '0.04em',
            }}>
              {t.contact.contactTitle}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 48 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: '#1a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
                    {t.contact.phoneLabel}
                  </p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#1a0a0a' }}>987-654-3210</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#1a0a0a' }}>info@desuisse.com</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: '#1a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
                    {t.contact.addressLabel}
                  </p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#1a0a0a' }}>Eliot Engjell, 55</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#1a0a0a' }}>Pejë 30000</p>
                  <a
                    href="https://maps.app.goo.gl/fN3hvrF5KonRYa966"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c9a84c', marginTop: 4, display: 'inline-block' }}
                  >
                    View on map →
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 400,
              marginBottom: 20,
              letterSpacing: '0.04em',
            }}>
              {t.contact.faqTitle}
            </h3>
            <div>
              {t.contact.faq.map((item, i) => (
                <div key={i} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {item.q}
                    <span style={{ color: '#c9a84c', fontSize: 18, lineHeight: 1 }}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <p className="faq-answer">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
