'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProcessVideo from '@/components/ProcessVideo';
import { useLanguage } from '@/lib/LanguageContext';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 1s ease ${delay}ms, transform 1s ease ${delay}ms` }}>{children}</div>;
}

export default function CustomDesignPage() {
  const { language } = useLanguage();

  const t = {
    title: language === 'sq' ? 'Dizajn i Personalizuar' : 'Custom Design',
    hero: language === 'sq' ? 'Thjesht na tregoni dëshirat tuaja — ne i sjellim në jetë.' : 'Just tell us your wishes — we\'ll bring them to life.',
    intro: language === 'sq'
      ? 'Ne duam porositë e personalizuara. Sillni idenë tuaj dhe ne do të krijojmë një unazë ose bizhuteri të bukur, unike vetëm për ju.'
      : 'We love custom orders. Bring us your idea, and we\'ll create a beautiful, one-of-a-kind ring or piece of jewellery just for you.',
    howTitle: language === 'sq' ? 'Si funksionon' : 'How it works',
    how: language === 'sq'
      ? 'Caktoni një takim në dyqanin tonë, diskutoni idenë me ne dhe me kënaqësinë tuaj do të vazhdojmë me prodhimin.'
      : 'Schedule a meeting in our shop, discuss it with us and with your satisfaction we will continue with the production.',
    videoTitle: language === 'sq' ? 'Shikoni Procesin' : 'Watch the Process',
    videoCaption: language === 'sq'
      ? 'Nga skica deri te unaza e përfunduar — si i bëjmë bizhuteritë tona.'
      : 'From sketch to finished ring — how our pieces are made.',
    scheduleBtn: language === 'sq' ? 'CAKTO NJË TAKIM' : 'SCHEDULE A MEETING',
    customersTitle: language === 'sq' ? 'Klientë të Kënaqur' : 'Satisfied Customers',
    galleryTitle: language === 'sq' ? 'Punimet Tona' : 'Our Work',
    photoNote: language === 'sq' ? 'Shtoni foton' : 'Add photo',
  };

  // 8 photo placeholders (2 rows of 4)
  const photos = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    file: `custom-${i + 1}.jpg`,
  }));

  return (
    <>
      <Header />

      {/* Hero */}
      <div style={{ background: '#1a0a0a', padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 20, position: 'relative' }}>✦ deSuisse</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 300, color: '#fff', letterSpacing: '0.06em', marginBottom: 24, position: 'relative', lineHeight: 1.2 }}>
          {t.hero}
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#aaa', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.9, position: 'relative' }}>
          {t.intro}
        </p>
        <Link href="/contact" style={{ display: 'inline-block', padding: '14px 36px', border: '1px solid #c9a84c', color: '#c9a84c', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s', position: 'relative' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#c9a84c'; (e.currentTarget as HTMLAnchorElement).style.color = '#1a0a0a'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#c9a84c'; }}
        >
          {t.scheduleBtn}
        </Link>
      </div>

      {/* Hero photo space */}
      <Reveal>
        <div style={{ maxWidth: 1300, margin: '60px auto 0', padding: '0 40px' }}>
          <div style={{ background: '#f7f3ee', border: '1px dashed #e8e0d4', aspectRatio: '16/6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hero Photo — public/images/custom-hero.jpg</p>
          </div>
        </div>
      </Reveal>

      {/* How it works */}
      <Reveal delay={100}>
        <section style={{ maxWidth: 900, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: 24 }}>{t.howTitle}</h2>
          <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '0 auto 28px' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#666', lineHeight: 2, marginBottom: 36 }}>{t.how}</p>
          <Link href="/contact" style={{ display: 'inline-block', padding: '14px 36px', background: '#1a0a0a', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#c9a84c'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#1a0a0a'}
          >
            {t.scheduleBtn}
          </Link>
        </section>
      </Reveal>

      {/* Watch the process — click-to-play, no cost to page load until clicked */}
      <Reveal delay={100}>
        <section style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 40px' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 24 }}>{t.videoTitle}</h2>
          <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '0 auto 28px' }} />
          <ProcessVideo
            src="/videos/ring-making-process.mp4"
            poster="/images/process-poster.jpg"
            title={t.videoTitle}
          />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 16 }}>{t.videoCaption}</p>
        </section>
      </Reveal>

      {/* Satisfied customers / gallery */}
      <section style={{ background: '#f7f3ee', padding: '60px 40px 80px' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <Reveal>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 48 }}>{t.customersTitle}</h2>
          </Reveal>
          {/* 2 rows of 4 photos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {photos.map(photo => (
              <Reveal key={photo.id} delay={photo.id * 50}>
                <div style={{ aspectRatio: '1', background: '#e8e0d4', border: '1px dashed #d4c9bc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', position: 'relative' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#ccc', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', padding: '0 8px' }}>
                    {t.photoNote}<br/>public/images/{photo.file}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .custom-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  );
}
