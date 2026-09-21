'use client';

import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

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
        <h1 className="section-title">{t.about.title}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '16px auto 0' }} />
      </div>

      {/* Content */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="about-grid">
          <div>
            {t.about.content.split('\n\n').map((para, i) => (
              <p key={i} style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: '#444',
                lineHeight: 1.9,
                marginBottom: 24,
              }}>
                {para}
              </p>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            {/* Served from /public, not the old WordPress site. The previous
                src pointed at https://desuisse.com/wp-content/... which stopped
                existing the moment the domain moved to this app — the About
                page has been showing a broken image ever since. */}
            <Image
              src="/images/about-founders.webp"
              alt={t.about.title}
              width={1000}
              height={1000}
              sizes="(max-width: 900px) 100vw, 560px"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {/* Gold accent line */}
            <div style={{
              position: 'absolute',
              top: -20,
              left: -20,
              right: 20,
              bottom: 20,
              border: '1px solid #c9a84c',
              zIndex: -1,
            }} />
          </div>
        </div>
      </section>

      {/* Values strip */}
      <section style={{ background: '#1a0a0a', padding: '60px 40px' }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 40,
          textAlign: 'center',
        }}>
          {[
            { icon: '◆', title: '1865', sub: 'Est.' },
            { icon: '◆', title: 'Kosovo', sub: 'Origin' },
            { icon: '◆', title: 'Karlovy Vary', sub: 'Boutique' },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ color: '#c9a84c', fontSize: 20, marginBottom: 12 }}>{item.icon}</p>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                fontWeight: 400,
                color: '#fff',
                marginBottom: 6,
              }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
