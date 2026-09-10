'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import PageHero from '@/components/PageHero';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>{children}</div>;
}

export default function RingSizerPage() {
  const { language } = useLanguage();

  const t = {
    title: language === 'sq' ? 'Si të Zgjidhni Madhësinë e Unazës' : 'How to Find Your Ring Size',
    method1Title: language === 'sq' ? 'Metoda 1: Testi me Fije / Letër' : 'Method 1: The String / Paper Test',
    method2Title: language === 'sq' ? 'Metoda 2: Testi me Unazë Ekzistuese' : 'Method 2: The Existing Ring Test',
    tipsTitle: language === 'sq' ? 'Këshilla të Shpejta' : 'Quick Tips',
    method1Steps: language === 'sq' ? [
      { n: '1', title: 'Mbështillni', desc: 'Mbështillni një fije të hollë ose një rrip letre rreth bazës së gishtit tuaj.' },
      { n: '2', title: 'Shënoni', desc: 'Përdorni stilolaps për të shënuar pikën ku fija apo letra mbivendoset.' },
      { n: '3', title: 'Matni', desc: 'Vendoseni shtrirë dhe matni gjatësinë në milimetra (mm). Kjo është rrethi i gishtit tuaj.' },
      { n: '4', title: 'Krahasoni', desc: 'Krahasoni matjen me tabelën standarde të madhësive të unazave.' },
    ] : [
      { n: '1', title: 'Wrap', desc: 'Take a thin piece of string or a strip of paper and wrap it snugly around the base of your finger.' },
      { n: '2', title: 'Mark', desc: 'Use a pen to mark the exact point where the string or paper overlaps.' },
      { n: '3', title: 'Measure', desc: 'Lay it flat and use a ruler to measure the length in millimeters (mm). This is your finger\'s circumference.' },
      { n: '4', title: 'Compare', desc: 'Match this measurement against a standard ring size chart.' },
    ],
    method2Steps: language === 'sq' ? [
      { n: '1', title: 'Zgjidhni', desc: 'Gjeni një unazë që keni që i përshtatet saktë gishtit të duhur.' },
      { n: '2', title: 'Matni', desc: 'Matni diametrin e brendshëm të unazës në milimetra — matni drejt përmes qendrës nga muri në mur.' },
      { n: '3', title: 'Krahasoni', desc: 'Krahasoni matjen në milimetra me tabelën e madhësive.' },
    ] : [
      { n: '1', title: 'Select', desc: 'Find a ring you already own that fits the correct finger perfectly.' },
      { n: '2', title: 'Measure', desc: 'Use a ruler to measure the inside diameter of the ring in millimeters (mm) — measure straight across the inside center from wall to wall.' },
      { n: '3', title: 'Compare', desc: 'Match the millimeter measurement to a size chart.' },
    ],
    tips: language === 'sq' ? [
      'Matni gishtat në fund të ditës kur janë më të ngrohtë.',
      'Nëse nyja juaj është dukshëm më e madhe se baza e gishtit, matni të dyja dhe zgjidhni madhësinë mes tyre.',
    ] : [
      'Measure your fingers at the end of the day when they are warmest.',
      'If your knuckle is significantly larger than the base of your finger, measure both and choose a size in between.',
    ],
    photoPlaceholder: language === 'sq' ? 'Foto ilustruese' : 'Illustrative photo',
  };

  return (
    <>
      <Header />

      <PageHero
        tone="light"
        eyebrow={language === 'sq' ? 'Udhëzues' : 'Guide'}
        title={t.title}
        subtitle={language === 'sq'
          ? 'Tre mënyra për ta matur në shtëpi, dhe tabela e plotë e madhësive EU 45–75. Nëse e gaboni, rregullimi është falas.'
          : 'Three ways to measure at home, plus the full EU 45–75 conversion table. If you get it wrong, resizing is free.'}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }} className="ringsizer-grid">

          {/* Left: methods */}
          <div>
            {/* Method 1 */}
            <Reveal>
              <div style={{ marginBottom: 56 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 28, height: 28, background: '#1a0a0a', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>1</span>
                  {t.method1Title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {t.method1Steps.map((step) => (
                    <div key={step.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px', border: '1px solid #e8e0d4', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c9a84c'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(201,168,76,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e0d4'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                    >
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#c9a84c', minWidth: 20, paddingTop: 2, letterSpacing: '0.1em' }}>{step.n}.</span>
                      <div>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#1a0a0a', marginBottom: 4, letterSpacing: '0.04em' }}>{step.title}</p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666', lineHeight: 1.7 }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Method 2 */}
            <Reveal delay={100}>
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 28, height: 28, background: '#1a0a0a', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>2</span>
                  {t.method2Title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {t.method2Steps.map((step) => (
                    <div key={step.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px', border: '1px solid #e8e0d4', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c9a84c'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(201,168,76,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e0d4'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                    >
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#c9a84c', minWidth: 20, paddingTop: 2 }}>{step.n}.</span>
                      <div>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#1a0a0a', marginBottom: 4, letterSpacing: '0.04em' }}>{step.title}</p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666', lineHeight: 1.7 }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Quick tips */}
            <Reveal delay={150}>
              <div style={{ background: '#1a0a0a', padding: '28px 32px' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 16 }}>◆ {t.tipsTitle}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {t.tips.map((tip, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ color: '#c9a84c', flexShrink: 0, marginTop: 2 }}>◆</span>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#aaa', lineHeight: 1.7 }}>{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Right: photo placeholder + size chart */}
          <div style={{ position: 'sticky', top: 100 }}>
            <Reveal delay={80}>
              {/* Photo space */}
              <div style={{ background: '#f7f3ee', border: '1px solid #e8e0d4', aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#ccc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.photoPlaceholder}</p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              {/* Size reference table */}
              <div style={{ border: '1px solid #e8e0d4', overflow: 'hidden' }}>
                <div style={{ background: '#1a0a0a', padding: '12px 20px' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a84c' }}>
                    {language === 'sq' ? 'Tabela e Madhësive' : 'Size Reference Chart'}
                  </p>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e8e0d4', background: '#f7f3ee' }}>
                      {[language === 'sq' ? 'Madhësia EU' : 'EU Size', language === 'sq' ? 'Rrethi (mm)' : 'Circumference (mm)', language === 'sq' ? 'Diametri (mm)' : 'Diameter (mm)'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['44', '44.2', '14.1'],
                      ['46', '45.5', '14.5'],
                      ['48', '48.0', '15.3'],
                      ['50', '50.2', '16.0'],
                      ['52', '52.5', '16.7'],
                      ['54', '54.4', '17.3'],
                      ['56', '56.3', '17.9'],
                      ['58', '58.3', '18.6'],
                      ['60', '60.0', '19.1'],
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0ebe3', background: i % 2 === 0 ? '#fff' : '#fdf9f6', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fdf5e8'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fdf9f6'}
                      >
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, color: j === 0 ? '#1a0a0a' : '#666', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .ringsizer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
