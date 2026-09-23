'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { useRevealSections } from '@/components/Reveal';

export default function RingStoryPage() {
  useRevealSections();
  const { language } = useLanguage();
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const sectionRefs = {
    idea:          useRef<HTMLDivElement>(null),
    sketch:        useRef<HTMLDivElement>(null),
    visualization: useRef<HTMLDivElement>(null),
    prototype:     useRef<HTMLDivElement>(null),
    finalization:  useRef<HTMLDivElement>(null),
  };

  const scrollTo = (key: keyof typeof sectionRefs) => {
    sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveStep(key);
  };

  const t = {
    title:   language === 'sq' ? 'Historia e Unazës' : 'The Story of the Ring',
    intro:   language === 'sq'
      ? 'Rruga drejt më të mirës është e gjatë por e bukur. Pavarësisht nëse kjo është marrëdhënia me dikë që e doni apo me një unazë.'
      : 'The path to the best is long but beautiful. Whether this is a relationship with someone you love or a ring.',
    btnLabel: language === 'sq' ? 'LE TË UDHËTOJMË SË BASHKU' : "LET'S TAKE THIS JOURNEY TOGETHER",
    steps: [
      {
        key: 'idea', label: language === 'sq' ? 'IDEJA' : 'IDEA',
        title: language === 'sq' ? 'Ideja' : 'The Idea',
        content: language === 'sq'
          ? 'Çdo unazë e jashtëzakonshme fillon me një ide. Na tregoni ëndrrën tuaj — çfarë dëshironi të shprehni me unazën tuaj. Takohuni me argjendarët tanë për të eksploruar mundësitë pa kufij.'
          : 'Every extraordinary ring begins with an idea. Tell us your dream — what you want to express with your ring. Meet with our goldsmiths to explore endless possibilities.',
      },
      {
        key: 'sketch', label: language === 'sq' ? 'SKICA' : 'SKETCH',
        title: language === 'sq' ? 'Skica' : 'The Sketch',
        content: language === 'sq'
          ? 'Dizajnerët tanë kthejnë idenë tuaj në skica të detajuara. Do të shihni të paktën tre variacione të ndryshme të dizajnit para se të kalojmë në fazën tjetër.'
          : 'Our designers transform your idea into detailed sketches. You will see at least three different design variations before we move to the next phase.',
      },
      {
        key: 'visualization', label: language === 'sq' ? 'VIZUALIZIMI' : 'VISUALIZATION',
        title: language === 'sq' ? 'Vizualizimi' : 'Visualization',
        content: language === 'sq'
          ? 'Duke përdorur teknologjinë 3D të avancuar, krijohet një model dixhital i saktë i unazës suaj. Mund ta shihni nga çdo kënd para se të fillohet prodhimi.'
          : 'Using advanced 3D technology, a precise digital model of your ring is created. You can view it from every angle before production begins.',
      },
      {
        key: 'prototype', label: language === 'sq' ? 'PROTOTIPI' : 'PROTOTYPE',
        title: language === 'sq' ? 'Prototipi' : 'The Prototype',
        content: language === 'sq'
          ? 'Krijohet një prototip fizik i unazës suaj. Kjo ju lejon ta ndieni, ta provoni dhe të bëni çdo ndryshim të fundit para prodhimit final në ar ose platin.'
          : 'A physical prototype of your ring is created. This allows you to feel it, try it on, and make any final adjustments before final production in gold or platinum.',
      },
      {
        key: 'finalization', label: language === 'sq' ? 'FINALIZIMI' : 'FINALIZATION',
        title: language === 'sq' ? 'Finalizimi' : 'Finalization',
        content: language === 'sq'
          ? 'Argjendarët tanë me eksperiencë prodhojnë unazën tuaj me saktësi të lartë. Çdo detal kontrollohet dhe polirohet deri në përsosmëri para dorëzimit final.'
          : 'Our experienced goldsmiths produce your ring with the highest precision. Every detail is checked and polished to perfection before the final delivery.',
      },
    ],
  };

  return (
    <>
      <Header />

      {/* Hero — photos + intro text */}
      <section className="rs-hero" style={{ position: 'relative', minHeight: '70vh', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
        {/* Photos left side */}
        <div className="rs-hero-photos" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4, background: '#1a0a0a' }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{ position: 'relative', background: '#2a1a1a', minHeight: 200, overflow: 'hidden' }}>
              <Image
                src={`/images/story-${n}.webp`}
                alt={language === 'sq' ? 'Procesi i krijimit të unazës' : 'The ring-making process'}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>

        {/* Text right side */}
        <div style={{ background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 20 }}>✦ deSuisse</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 400, color: '#1a0a0a', lineHeight: 1.2, marginBottom: 24 }}>
            {t.title}
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#666', lineHeight: 2, marginBottom: 36 }}>
            {t.intro}
          </p>
          <Link href="#idea" onClick={(e) => { e.preventDefault(); scrollTo('idea'); }} style={{ display: 'inline-block', padding: '14px 28px', border: '1px solid #1a0a0a', color: '#1a0a0a', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s', alignSelf: 'flex-start' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1a0a0a'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#1a0a0a'; }}
          >
            {t.btnLabel}
          </Link>
        </div>
      </section>

      {/* Step navigation bar */}
      <div style={{ background: '#fff', borderTop: '1px solid #e8e0d4', borderBottom: '1px solid #e8e0d4', position: 'sticky', top: 73, zIndex: 50 }}>
        <div className="rs-steps-nav" style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          {t.steps.map((step, i) => (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => scrollTo(step.key as keyof typeof sectionRefs)} style={{
                padding: '20px 28px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeStep === step.key ? '#c9a84c' : 'transparent'}`,
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: activeStep === step.key ? '#c9a84c' : '#888',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
                {step.label}
              </button>
              {i < t.steps.length - 1 && <span style={{ color: '#ddd', fontSize: 14 }}>—</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step sections */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
        {t.steps.map((step, i) => (
          <div key={step.key} ref={sectionRefs[step.key as keyof typeof sectionRefs]} className="rs-step" style={{ paddingTop: 80, display: 'grid', gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* Photo (alternates sides) */}
            {i % 2 !== 0 && (
              <div style={{ position: 'relative', background: '#f7f3ee', aspectRatio: '4/3', overflow: 'hidden' }}>
                <Image
                  src={`/images/story-${step.key}.webp`}
                  alt={step.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 12 }}>◆ Step {i + 1}</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 400, color: '#1a0a0a', marginBottom: 20 }}>{step.title}</h2>
              <div style={{ width: 40, height: 1, background: '#c9a84c', marginBottom: 20 }} />
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#666', lineHeight: 2 }}>{step.content}</p>
            </div>
            {/* Photo (even steps) */}
            {i % 2 === 0 && (
              <div style={{ position: 'relative', background: '#f7f3ee', aspectRatio: '4/3', overflow: 'hidden' }}>
                <Image
                  src={`/images/story-${step.key}.webp`}
                  alt={step.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          /* These used to be attribute selectors matching inline styles
             ([style*="grid-template-columns: 1fr 1fr"]). React serialises
             that declaration without the space after the colon, so the rules
             silently never matched and this page stayed two-column on a
             phone — headline and buttons cut off at the edge. */
          .rs-hero { grid-template-columns: 1fr !important; min-height: 0 !important; }
          .rs-hero-photos { grid-template-rows: 1fr 1fr !important; }
          .rs-hero-photos > div { min-height: 130px !important; }
          .rs-hero > div:last-child { padding: 44px 24px !important; }

          .rs-step { grid-template-columns: 1fr !important; gap: 28px !important; padding-top: 56px !important; }

          /* Five labels never fit one phone row; wrap them and drop the
             em-dash separators that only make sense in a single line. */
          .rs-steps-nav { flex-wrap: wrap !important; gap: 2px 4px; padding: 6px 12px; }
          .rs-steps-nav button { padding: 12px 14px !important; font-size: 10px !important; letter-spacing: 0.1em !important; }
          .rs-steps-nav span { display: none !important; }
        }
      `}</style>
    </>
  );
}
