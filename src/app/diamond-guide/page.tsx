'use client';
import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

/**
 * Diamond guide — comprehensive comparison of natural vs lab-grown diamonds.
 *
 * Photos:
 *  All images live in /public/images/. To replace any photo, drop a file
 *  with the matching filename into that folder:
 *    - diamond-hero.jpg           (1920×800, hero band at top)
 *    - diamond-natural.jpg        (1200×900, natural diamond up close)
 *    - diamond-lab.jpg            (1200×900, lab diamond up close)
 *    - diamond-comparison.jpg     (1600×900, side-by-side or pair)
 *  If a file is missing, an elegant placeholder is shown automatically.
 */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>{children}</div>
  );
}

/** Image with elegant fallback when file missing. */
function PhotoSlot({ src, alt, aspect = '4/3', fill = false }: { src: string; alt: string; aspect?: string; fill?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f7f3ee 0%, #ede4d4 100%)', overflow: 'hidden',
      ...(fill
        /* fill = stretch to the parent box and crop, for hero bands where the
           container decides the height, not the photograph. */
        ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%' }
        : { position: 'relative' as const, width: '100%', aspectRatio: aspect }),
    }}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#bba98a" strokeWidth="1">
            <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M11 3 8 9l4 13 4-13-3-6" /><path d="M2 9h20" />
          </svg>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#a89878',
            letterSpacing: '0.2em', textTransform: 'uppercase' }}>Photo placeholder</p>
        </div>
      )}
    </div>
  );
}

function ProsCons({ heading, items, color, bullet }: { heading: string; items: string[]; color: string; bullet: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 16 }}>{heading}</p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color, fontSize: 12, marginTop: 4, flexShrink: 0 }}>{bullet}</span>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#555', lineHeight: 1.75 }}>{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DiamondGuidePage() {
  const { language } = useLanguage();
  const sq = language === 'sq';

  const t = {
    eyebrow: sq ? '◆ Udhëzues' : '◆ Diamond Guide',
    title:   sq ? 'Diamant Natyror apo Laboratorik?' : 'Natural or Lab-Grown Diamond?',
    subtitle: sq
      ? 'Të dy janë diamante të vërtetë. Por origjina, vlera dhe historia që mbartin janë të ndryshme. Ky udhëzues ju ndihmon të kuptoni dallimet që rëndësojnë.'
      : 'Both are real diamonds. But their origin, value, and story differ in meaningful ways. This guide walks you through the differences that matter.',

    introHeading: sq ? 'Çfarë janë diamantet?' : 'What is a diamond?',
    introBody: sq
      ? 'Diamantet janë karbon i pastër i kristalizuar nën presion dhe nxehtësi ekstreme. Si diamantet natyrore ashtu edhe ato laboratorike kanë të njëjtin përbërje kimike (C), të njëjtën strukturë kristalore kubike, të njëjtën fortësi (10 në shkallën Mohs) dhe të njëjtin shkëlqim optik. Një laborator gemmologjik nuk mund t\u2019i dallojë me sy. Dallimi qëndron vetëm tek mënyra dhe vendi se ku janë krijuar.'
      : 'A diamond is pure carbon crystallised under extreme pressure and heat. Natural and lab-grown diamonds share the same chemistry (pure C), the same cubic crystal structure, the same hardness (10 on the Mohs scale), and the same optical brilliance. A gemmological laboratory cannot tell them apart by eye. What differs is only when, where, and how they were formed.',

    naturalHeading:  sq ? 'Diamanti Natyror' : 'The Natural Diamond',
    naturalBody1: sq
      ? 'Diamantet natyrore u formuan 150 deri në 700 kilometra nën sipërfaqen e Tokës, mes 1 dhe 3.5 miliardë vjet më parë. Karboni nën presion enorm dhe nxehtësi prej rreth 1300°C krijoi kristalet që sot mbërrijnë në sipërfaqe vetëm përmes shpërthimeve të lashta vullkanike, të mbledhura në tuba shkëmbi të quajtur "kimberlite".'
      : 'Natural diamonds formed 150 to 700 kilometres beneath the Earth\u2019s surface, between 1 and 3.5 billion years ago. Carbon under immense pressure and heat (around 1,300°C) crystallised into stones that reach the surface only through ancient volcanic eruptions, concentrated in pipes of rock called kimberlite.',
    naturalBody2: sq
      ? 'Çdo diamant natyror është një objekt me histori gjeologjike unike — me karakteristika të brendshme, përfshirjet (të quajtura "inclusions"), të cilat janë si gjurmë gishti që nuk përsëriten kurrë. Ata janë jashtëzakonisht të rrallë: vetëm një pjesë e vogël e diamanteve të nxjerrë çdo vit kanë cilësinë e nevojshme për bizhuteri të nivelit të lartë.'
      : 'Every natural diamond is a geological artefact with a unique story. The internal characteristics — inclusions and minor flaws — act like fingerprints that are never repeated. They are exceptionally rare: only a small fraction of stones mined each year meet the quality bar for fine jewellery.',
    naturalPros: sq
      ? ['Të rralla, me histori miliarda-vjeçare', 'Vlera tenton të ruhet ose rritet me kohën', 'Çdo gur është absolutisht unik', 'Tradita e fortë në bizhuteri klasike']
      : ['Rare, with billions of years of geological history', 'Tend to hold or appreciate in value over time', 'Each stone is one-of-a-kind', 'Strong tradition in classic fine jewellery'],
    naturalCons: sq
      ? ['Çmim më i lartë për të njëjtën cilësi vizuale', 'Ndikim mjedisor nga minierat', 'Verifikoni etikën e zinxhirit (Kimberley Process / RJC)']
      : ['Higher price for the same visual quality', 'Environmental impact from mining', 'Supply-chain ethics matter (look for Kimberley Process / RJC certification)'],

    labHeading: sq ? 'Diamanti Laboratorik' : 'The Lab-Grown Diamond',
    labBody1: sq
      ? 'Diamantet laboratorike krijohen në mjedis të kontrolluar duke përdorur dy procese kryesore: HPHT (High Pressure, High Temperature), që imiton kushtet nën sipërfaqen e Tokës, dhe CVD (Chemical Vapour Deposition), që ndërton kristalin shtresë pas shtrese nga një gaz i pasur me karbon. Të dyja prodhojnë diamante që janë kimikisht dhe optikisht identikë me ata natyrorë.'
      : 'Lab-grown diamonds are created in controlled environments using two main processes: HPHT (High Pressure, High Temperature), which mimics conditions deep below the Earth\u2019s surface, and CVD (Chemical Vapour Deposition), which builds the crystal layer by layer from a carbon-rich gas. Both produce diamonds that are chemically and optically identical to natural stones.',
    labBody2: sq
      ? 'Sot, një diamant laboratorik prej një karati i cilësisë së mirë mund të kushtojë 60 deri 80 për qind më pak se ai natyror i së njëjtës cilësi. Kjo ju lejon të zgjidhni një gur më të madh ose më cilësor për të njëjtin buxhet. Vlera e ardhshme e rishitjes është më e ulët dhe ka tendencë të bjerë me kalimin e kohës, ndërsa teknologjia bëhet më efikase.'
      : 'Today, a quality one-carat lab-grown diamond costs roughly 60 to 80 per cent less than an equivalent natural stone. This lets you choose a larger or higher-quality stone for the same budget. Resale value is lower and tends to decline over time as the technology becomes more efficient.',
    labPros: sq
      ? ['Identik kimikisht dhe vizualisht me ata natyrorë', 'Çmim 60–80% më i ulët për të njëjtën cilësi', 'Gjurmë e qartë e origjinës (zero minierë)', 'Mund të prodhohen në cilësi shumë të lartë']
      : ['Chemically and visually identical to natural diamonds', '60–80% lower price for equivalent quality', 'Traceable origin (no mining)', 'Available in very high quality grades'],
    labCons: sq
      ? ['Vlera e rishitjes është më e ulët dhe në rënie', 'Nuk kanë "historinë" miliarda-vjeçare', 'Prodhimi kërkon shumë energji (verifikoni nëse është e ripërtëritshme)']
      : ['Lower resale value, and declining over time', 'Lack the billion-year geological story', 'Production is energy-intensive (verify renewable-energy sourcing)'],

    fourCsHeading:  sq ? 'Pavarësisht origjinës: 4-të C-të' : 'Regardless of Origin: The Four Cs',
    fourCsIntro: sq
      ? 'Çdo diamant — natyror ose laboratorik — vlerësohet sipas të njëjtit standard ndërkombëtar i njohur si "4 C-të": Cut (Prerja), Color (Ngjyra), Clarity (Pastërtia) dhe Carat weight (Pesha në karat). Këto janë faktorët që përcaktojnë cilësinë dhe çmimin.'
      : 'Every diamond — natural or lab-grown — is graded against the same international standard known as the "Four Cs": Cut, Color, Clarity and Carat weight. These are the factors that determine both quality and price.',
    fourCs: sq ? [
      { letter: 'C', word: 'Cut',     desc: 'Prerja' ,    body: 'Mënyra se si është prerë guri ndikon më shumë te shkëlqimi. Një prerje e shkëlqyer ("Excellent" ose "Ideal") kthen pothuajse të gjithë dritën që hyn, duke krijuar atë shkëlqim që e bën diamantin të tërheqës. Kjo është më e rëndësishme se sa madhësia.' },
      { letter: 'C', word: 'Color',   desc: 'Ngjyra' ,    body: 'Diamantet vlerësohen nga D (pa ngjyrë) deri tek Z (e verdhë e lehtë). Diamantet D–F konsiderohen pa ngjyrë dhe janë më të vlefshmit. G–J janë "afër pa ngjyrë" — dallimi praktikisht nuk vihet re me sy të lirë.' },
      { letter: 'C', word: 'Clarity', desc: 'Pastërtia',  body: 'Mat numrin dhe madhësinë e përfshirjeve të brendshme. Shkalla shkon nga FL (Flawless, pa të meta) deri tek I3 (përfshirje të dukshme). Për bizhuteri, VS1–VS2 ose SI1 zakonisht ofrojnë vlerën më të mirë.' },
      { letter: 'C', word: 'Carat',   desc: 'Pesha' ,     body: 'Një karat = 0.2 gram. Sa më i madh diamanti, aq më i rrallë, prandaj çmimi rritet jolinear me peshën. Një diamant 2 karat kushton shumë më shumë se dy diamantë 1 karat të së njëjtës cilësi.' },
    ] : [
      { letter: 'C', word: 'Cut',     desc: 'Brilliance',      body: 'How the stone is cut affects sparkle more than anything else. An "Excellent" or "Ideal" cut returns nearly all the light that enters the stone, creating the brilliance that makes diamonds captivating. This matters more than size.' },
      { letter: 'C', word: 'Color',   desc: 'Whiteness',       body: 'Diamonds are graded from D (colourless) to Z (light yellow). D–F are considered colourless and command the highest premium. G–J are "near-colourless" — the difference is practically invisible to the naked eye.' },
      { letter: 'C', word: 'Clarity', desc: 'Internal purity', body: 'Measures the number and size of internal inclusions. The scale runs from FL (Flawless) to I3 (visible inclusions). For fine jewellery, VS1–VS2 or SI1 usually offers the best value — inclusions are invisible without magnification.' },
      { letter: 'C', word: 'Carat',   desc: 'Weight',          body: 'One carat equals 0.2 grams. Larger stones are rarer, so price scales non-linearly with weight. A 2-carat diamond costs far more than two 1-carat diamonds of equivalent quality.' },
    ],

    howToChooseHeading: sq ? 'Si të zgjedhni' : 'How to choose',
    howToChooseBody: sq
      ? 'Nuk ka përgjigje universale "më të mirë". Zgjedhja varet nga ato që ju vlerësoni më shumë:'
      : 'There is no universal "better" answer. The right choice depends on what you value most:',
    choiceRows: sq ? [
      { when: 'Nëse vlera afatgjate ose investimi është prioritet',                  pick: 'Diamanti natyror' },
      { when: 'Nëse dëshironi madhësi/cilësi maksimale për buxhetin tuaj',           pick: 'Diamanti laboratorik' },
      { when: 'Nëse origjina dhe minimumi i ndikimit mjedisor janë esenciale',       pick: 'Diamanti laboratorik (me energji të ripërtëritshme)' },
      { when: 'Nëse doni një unazë me histori unike dhe trashëgimi',                  pick: 'Diamanti natyror' },
      { when: 'Për bizhuteri të përditshme ku madhësia është më e rëndësishme',       pick: 'Diamanti laboratorik' },
    ] : [
      { when: 'If long-term value or investment is the priority',                     pick: 'Natural diamond' },
      { when: 'If you want maximum size or quality for your budget',                  pick: 'Lab-grown diamond' },
      { when: 'If origin and minimal environmental impact are essential',             pick: 'Lab-grown diamond (with renewable energy)' },
      { when: 'If you want a ring with a unique story and heirloom potential',        pick: 'Natural diamond' },
      { when: 'For everyday jewellery where size matters more',                        pick: 'Lab-grown diamond' },
    ],

    certHeading: sq ? 'Çertifikimi është thelbësor' : 'Certification is essential',
    certBody: sq
      ? 'Pavarësisht se cilin zgjidhni, kërkoni gjithmonë një certifikatë nga një laborator i pavarur si GIA (Gemological Institute of America), IGI (International Gemological Institute), ose HRD Antwerp. Certifikata konfirmon karakteristikat e gurit dhe nëse është natyror apo laboratorik — duke ju dhënë siguri për atë që po blini.'
      : 'Whichever you choose, always insist on a certificate from an independent laboratory such as GIA (Gemological Institute of America), IGI (International Gemological Institute), or HRD Antwerp. The certificate confirms the stone\u2019s characteristics and whether it is natural or lab-grown — giving you full confidence in what you are buying.',

    ctaHeading: sq ? 'Të papasur ende?' : 'Still unsure?',
    ctaBody: sq
      ? 'Vizitoni një nga butikët tanë në Karlovy Vary ose Pejë. Eksperti ynë do t\u2019ju tregojë gurët në dorë, do t\u2019ju shpjegojë dallimet me anë të një lupa, dhe do t\u2019ju ndihmojë të gjeni zgjedhjen e duhur — pa presion.'
      : 'Visit one of our boutiques in Karlovy Vary or Pejë. Our gemmologist will show you stones in person, explain the differences through a jeweller\u2019s loupe, and help you find the right choice — with no pressure.',
    ctaButton: sq ? 'Caktoni një takim' : 'Book a consultation',
  };

  const sectionStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '80px 40px' };
  const h2Style: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 24, lineHeight: 1.2 };
  const pStyle: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: 15, color: '#555', lineHeight: 1.85, marginBottom: 18 };

  return (
    <>
      <Header />

      {/* HERO */}
      <div style={{ position: 'relative', minHeight: 460, background: '#1a0a0a', overflow: 'hidden' }}>
        <PhotoSlot src="/images/diamond-hero.jpg" alt="" fill />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(26,10,10,0.55) 0%, rgba(26,10,10,0.75) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 32px', color: '#fff' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.4em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 16 }}>{t.eyebrow}</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#fff', maxWidth: 800, lineHeight: 1.15 }}>{t.title}</h1>
          <div style={{ width: 48, height: 1, background: '#c9a84c', margin: '24px auto 0' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#ddd', lineHeight: 1.85, maxWidth: 640, marginTop: 24 }}>{t.subtitle}</p>
        </div>
      </div>

      {/* INTRODUCTION */}
      <section style={sectionStyle}>
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="dg-two-col">
            <div>
              <h2 style={h2Style}>{t.introHeading}</h2>
              <p style={pStyle}>{t.introBody}</p>
            </div>
            <PhotoSlot src="/images/diamond-comparison.jpg" alt="Diamond comparison" aspect="4/3" />
          </div>
        </Reveal>
      </section>

      <div style={{ borderTop: '1px solid #e8e0d4' }} />

      {/* NATURAL */}
      <section style={{ ...sectionStyle, background: '#f7f3ee' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="dg-two-col">
              <PhotoSlot src="/images/diamond-natural.jpg" alt="Natural diamond" aspect="4/3" />
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.3em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 12 }}>◆ {sq ? 'Origjina: Toka' : 'Origin: Earth'}</p>
                <h2 style={h2Style}>{t.naturalHeading}</h2>
                <p style={pStyle}>{t.naturalBody1}</p>
                <p style={pStyle}>{t.naturalBody2}</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 48 }} className="dg-two-col">
              <ProsCons heading={sq ? 'Avantazhet' : 'Strengths'}            items={t.naturalPros} color="#1a0a0a" bullet="◆" />
              <ProsCons heading={sq ? 'Të mbani parasysh' : 'Things to consider'} items={t.naturalCons} color="#888"    bullet="–" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* LAB */}
      <section style={sectionStyle}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="dg-two-col">
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.3em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 12 }}>◆ {sq ? 'Origjina: Laboratori' : 'Origin: Laboratory'}</p>
                <h2 style={h2Style}>{t.labHeading}</h2>
                <p style={pStyle}>{t.labBody1}</p>
                <p style={pStyle}>{t.labBody2}</p>
              </div>
              <PhotoSlot src="/images/diamond-lab.jpg" alt="Lab-grown diamond" aspect="4/3" />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 48 }} className="dg-two-col">
              <ProsCons heading={sq ? 'Avantazhet' : 'Strengths'}            items={t.labPros} color="#1a0a0a" bullet="◆" />
              <ProsCons heading={sq ? 'Të mbani parasysh' : 'Things to consider'} items={t.labCons} color="#888"    bullet="–" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOUR Cs */}
      <section style={{ ...sectionStyle, background: '#1a0a0a' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.35em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 14 }}>◆ {sq ? 'Standardi' : 'The Standard'}</p>
              <h2 style={{ ...h2Style, color: '#fff' }}>{t.fourCsHeading}</h2>
              <p style={{ ...pStyle, color: '#bbb', maxWidth: 700, margin: '0 auto' }}>{t.fourCsIntro}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="dg-4cs-grid">
              {t.fourCs.map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', padding: '28px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 48, color: '#c9a84c', fontWeight: 300, lineHeight: 1 }}>{c.letter}</span>
                    <div>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#fff', fontWeight: 400 }}>{c.word}</p>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.2em', color: '#c9a84c', textTransform: 'uppercase' }}>{c.desc}</p>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#bbb', lineHeight: 1.8 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CHOICE TABLE */}
      <section style={sectionStyle}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={h2Style}>{t.howToChooseHeading}</h2>
            <p style={{ ...pStyle, maxWidth: 680, margin: '0 auto' }}>{t.howToChooseBody}</p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ maxWidth: 820, margin: '0 auto', border: '1px solid #e8e0d4' }}>
            {t.choiceRows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, padding: '20px 28px', borderBottom: i < t.choiceRows.length - 1 ? '1px solid #f0ebe3' : 'none', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#fdfaf5' }} className="dg-choice-row">
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#444', lineHeight: 1.6 }}>{row.when}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'right' }}>→ {row.pick}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CERTIFICATION */}
      <section style={{ padding: '60px 40px', background: '#f7f3ee' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.35em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 14 }}>◆ {sq ? 'Besimi' : 'Trust'}</p>
            <h2 style={{ ...h2Style, fontSize: '1.8rem' }}>{t.certHeading}</h2>
            <p style={{ ...pStyle, marginBottom: 0 }}>{t.certBody}</p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 40px 80px', textAlign: 'center', background: '#1a0a0a' }}>
        <Reveal>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: '#fff', marginBottom: 16 }}>{t.ctaHeading}</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#bbb', maxWidth: 600, margin: '0 auto 28px', lineHeight: 1.8 }}>{t.ctaBody}</p>
          <a href="/contact" style={{ display: 'inline-block', padding: '14px 36px', background: '#c9a84c', color: '#1a0a0a', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s' }}>{t.ctaButton}</a>
        </Reveal>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .dg-two-col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .dg-4cs-grid { grid-template-columns: 1fr !important; }
          .dg-choice-row { grid-template-columns: 1fr !important; gap: 8px !important; }
          .dg-choice-row > p:last-child { text-align: left !important; }
        }
      `}</style>

      <Footer />
    </>
  );
}
