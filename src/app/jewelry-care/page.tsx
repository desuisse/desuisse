'use client';

import { useEffect, useRef, useState } from 'react';
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
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function JewelryCare() {
  const { language } = useLanguage();

  const data = {
    en: {
      title: 'How to Care for Your Jewelry',
      intro: 'Follow these simple guidelines to keep your deSuisse pieces looking as beautiful as the day you received them.',
      sections: [
        {
          title: 'Daily Protection',
          icon: '◆',
          accentColor: '#c9a84c',
          items: [
            {
              title: 'Last On, First Off',
              desc: 'Always put your jewelry on after applying lotion, perfume, and hairspray to avoid chemical buildup. Take it off first before getting ready for bed.',
            },
            {
              title: 'Keep It Dry',
              desc: 'Remove rings and bracelets before washing your hands, showering, or swimming. Chlorine and saltwater can permanently damage metals and gemstones.',
            },
            {
              title: 'Skip the Gym',
              desc: 'Take off jewelry before working out or doing heavy housework to prevent scratches, bending, or lost stones.',
            },
          ],
        },
        {
          title: 'Cleaning at Home',
          icon: '◇',
          accentColor: '#1a0a0a',
          items: [
            {
              title: 'The Gentle Method',
              desc: 'Mix a few drops of mild dish soap with warm water. Soak your jewelry for 5–10 minutes, then gently scrub with a soft-bristled toothbrush.',
            },
            {
              title: 'Dry Thoroughly',
              desc: 'Rinse with clean water and pat dry with a soft, lint-free cloth. Never use paper towels, as they can scratch polished metal.',
            },
            {
              title: 'What to Avoid',
              desc: 'Skip harsh chemicals like bleach or baking soda, especially on delicate gems like pearls, opals, and turquoise.',
            },
          ],
        },
        {
          title: 'Storage Tips',
          icon: '◈',
          accentColor: '#888',
          items: [
            {
              title: 'Separate to Safe-Keep',
              desc: 'Store pieces individually in soft pouches or separate compartments of a jewelry box to keep them from scratching each other.',
            },
            {
              title: 'Anti-Tarnish',
              desc: 'Keep sterling silver in airtight bags or with anti-tarnish strips to slow down oxidation.',
            },
          ],
        },
      ],
      photoNote: 'Add photo here',
      photoPath: 'public/images/care-{n}.jpg',
    },
    sq: {
      title: 'Si të Kujdeseni për Bizhuteritë Tuaja',
      intro: 'Ndiqni këto udhëzime të thjeshta për t\'i mbajtur copat tuaja deSuisse po aq të bukura sa ditën e parë.',
      sections: [
        {
          title: 'Mbrojtja e Përditshme',
          icon: '◆',
          accentColor: '#c9a84c',
          items: [
            {
              title: 'E fundit vesh, e para hiq',
              desc: 'Veshni gjithmonë bizhuteritë pas aplikimit të losionit, parfumit dhe llakut të flokëve. Hiqini të parat para gjumit.',
            },
            {
              title: 'Mbajini të thata',
              desc: 'Hiqni unazat dhe byzylykët para se të lani duart, të bëni dush ose të notoni. Klori dhe uji i kripur dëmtojnë metalet dhe gurët.',
            },
            {
              title: 'Shmangni palestrën',
              desc: 'Hiqni bizhuteritë para stërvitjes ose punëve të rënda për të parandaluar gërvishtjet, deformimet ose humbjen e gurëve.',
            },
          ],
        },
        {
          title: 'Pastrimi në Shtëpi',
          icon: '◇',
          accentColor: '#1a0a0a',
          items: [
            {
              title: 'Metoda e butë',
              desc: 'Përzieni disa pika sapun të butë me ujë të ngrohtë. Njomni 5–10 minuta, pastaj fërkoni me furçë dhëmbësh me qime të buta.',
            },
            {
              title: 'Thajini mirë',
              desc: 'Shpëlajini me ujë të pastër dhe tharjini me copë të butë. Kurrë mos përdorni letra, sepse mund të gërvishtin metalin.',
            },
            {
              title: 'Çfarë të shmangni',
              desc: 'Shmangni zbardhuesin ose sodën e bukës, veçanërisht për perla, opal dhe turkez.',
            },
          ],
        },
        {
          title: 'Këshilla për Ruajtjen',
          icon: '◈',
          accentColor: '#888',
          items: [
            {
              title: 'Ruani veçmas',
              desc: 'Ruani çdo copë individualisht në qese të buta ose ndarje të veçanta për t\'i mbrojtur nga gërvishtjet.',
            },
            {
              title: 'Anti-oksidim',
              desc: 'Mbani argjentin sterling në çanta hermetike ose me shirita anti-oksidimi.',
            },
          ],
        },
      ],
      photoNote: 'Shtoni foto këtu',
      photoPath: 'public/images/care-{n}.jpg',
    },
  };

  const d = language === 'sq' ? data.sq : data.en;

  return (
    <>
      <Header />

      <PageHero
        eyebrow={language === 'sq' ? 'Kujdesi' : 'Care'}
        title={d.title}
        subtitle={d.intro}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px' }}>
        {d.sections.map((section, si) => (
          <Reveal key={si} delay={si * 80}>
            <div style={{ marginBottom: 72 }}>

              {/* Section title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36, paddingBottom: 18, borderBottom: '2px solid #f0ebe3' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 20, color: section.accentColor, lineHeight: 1 }}>{section.icon}</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: '#1a0a0a', letterSpacing: '0.04em' }}>
                  {section.title}
                </h2>
              </div>

              {/* Two-column: cards + photo placeholder */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }} className="jcare-grid">

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {section.items.map((item, ii) => (
                    <div key={ii} style={{
                      padding: '22px 24px',
                      border: '1px solid #e8e0d4',
                      background: '#fff',
                      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                      cursor: 'default',
                    }}
                      onMouseEnter={e => {
                        const d = e.currentTarget as HTMLDivElement;
                        d.style.borderColor = '#c9a84c';
                        d.style.boxShadow = '0 4px 20px rgba(201,168,76,0.1)';
                        d.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        const d = e.currentTarget as HTMLDivElement;
                        d.style.borderColor = '#e8e0d4';
                        d.style.boxShadow = 'none';
                        d.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ color: '#c9a84c', fontSize: 12, lineHeight: 1 }}>◆</span>
                        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#1a0a0a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {item.title}
                        </h3>
                      </div>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666', lineHeight: 1.85, paddingLeft: 22 }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Photo placeholder */}
                <div style={{
                  position: 'sticky',
                  top: 100,
                  border: '1px dashed #e8e0d4',
                  background: '#faf8f5',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  padding: '40px 24px',
                  minHeight: 240,
                  textAlign: 'center',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#ccc', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                      {d.photoNote}
                    </p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#ddd', letterSpacing: '0.04em' }}>
                      public/images/care-{si + 1}.jpg
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .jcare-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
