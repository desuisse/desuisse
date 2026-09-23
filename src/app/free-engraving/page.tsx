'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { ENGRAVING_SYMBOLS } from '@/data/products';
import { useRevealSections } from '@/components/Reveal';

const MAX_CHARS = 30;

export default function FreeEngravingPage() {
  useRevealSections();
  const { language } = useLanguage();
  const sq = language === 'sq';

  // The page used to be two paragraphs and a button. The one thing a customer
  // actually wants here is to see their own words inside a band, so that is
  // what the page is built around.
  const [text, setText] = useState(sq ? 'Ariana & Luan' : 'Sarah & Luan');
  const [symbol, setSymbol] = useState('♡');

  const engraved = `${text}${symbol ? ` ${symbol}` : ''}`.trim();

  const t = {
    title: sq ? 'Gravim Falas' : 'Free Engraving',
    lead: sq
      ? 'Çdo unazë deSuisse mund të mbajë diçka që e dini vetëm ju të dy — një emër, një datë, pak fjalë — e gdhendur brenda unazës.'
      : 'Every deSuisse ring can carry something only the two of you know — a name, a date, a few words — engraved inside the band.',
    free: sq ? 'Falas, në çdo unazë.' : 'Free, on every ring.',
    browse: sq ? 'SHFLETO UNAZAT' : 'BROWSE RINGS',
    appointment: sq ? 'CAKTO NJË TAKIM' : 'BOOK AN APPOINTMENT',
    tryTitle: sq ? 'Shkruajeni dhe shikojeni' : 'Write it and see it',
    trySub: sq
      ? 'Shkruani mesazhin tuaj më poshtë. Ky është vetëm një parapamje — gravimi përfundimtar bëhet me laser brenda unazës.'
      : 'Type your message below. This is a preview — the final engraving is laser-cut inside the band.',
    yourMessage: sq ? 'Mesazhi juaj' : 'Your message',
    placeholder: sq ? 'p.sh. Ariana & Luan · 12.06.2026' : 'e.g. Sarah & Luan · 12.06.2026',
    symbolLabel: sq ? 'Shtoni një simbol' : 'Add a symbol',
    none: sq ? 'Asnjë' : 'None',
    stepsTitle: sq ? 'Si funksionon' : 'How it works',
    steps: [
      { n: '01', t: sq ? 'Zgjidhni unazën' : 'Choose your ring',
        d: sq ? 'Çdo unazë në koleksion mund të gravohet.' : 'Every ring in the collection can be engraved.' },
      { n: '02', t: sq ? 'Shkruani mesazhin' : 'Write your message',
        d: sq ? 'Deri në 30 karaktere, plus një simbol nëse dëshironi.' : 'Up to 30 characters, plus a symbol if you like.' },
      { n: '03', t: sq ? 'Ne e gdhendim' : 'We engrave it',
        d: sq ? 'Me laser, brenda unazës, përgjithmonë.' : 'With a laser, inside the band, permanently.' },
    ],
    factsTitle: sq ? 'Detajet' : 'The details',
    facts: [
      sq ? 'Falas me çdo unazë — pa kosto shtesë.' : 'Free with every ring — no added cost.',
      sq ? 'Deri në 30 karaktere.' : 'Up to 30 characters.',
      sq ? 'Gravohet brenda unazës, ku e sheh vetëm ai që e mban.' : 'Engraved inside the band, seen only by the person wearing it.',
      sq ? 'Me laser — i qëndrueshëm, nuk zbehet.' : 'Laser-cut — permanent, it will not fade.',
    ],
    symbolsTitle: sq ? 'Simbolet tona' : 'Our symbols',
  };

  return (
    <>
      <Header />

      {/* ── Hero: copy beside the thing itself ── */}
      <section className="fe-hero">
        <div className="fe-hero-copy">
          <p className="fe-eyebrow">✦ deSuisse</p>
          <h1 className="fe-title">{t.title}</h1>
          <div className="fe-rule" />
          <p className="fe-lead">{t.lead}</p>
          <p className="fe-free">{t.free}</p>
          <div className="fe-actions">
            <Link href="/shop" className="btn-dark">{t.browse}</Link>
            <Link href="/contact" className="fe-link-btn">{t.appointment}</Link>
          </div>
        </div>
        <div className="fe-hero-media">
          <Image
            src="/images/story-finalization.webp"
            alt={sq ? 'Unazë ari e gdhendur, duke u lustruar' : 'An engraved gold band being polished'}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </section>

      {/* ── The preview — the reason this page exists ── */}
      <section className="fe-try">
        <div className="fe-try-inner">
          <h2 className="fe-h2">{t.tryTitle}</h2>
          <div className="fe-rule fe-rule-center" />
          <p className="fe-sub">{t.trySub}</p>

          {/* The band. Two stacked text layers give the incised look: a light
              edge below the glyphs and a darker one above them. */}
          <div className="fe-band" aria-hidden="true">
            <div className="fe-band-inner">
              <span className="fe-band-text">{engraved || ' '}</span>
            </div>
          </div>

          <div className="fe-controls">
            <label className="fe-field">
              <span className="fe-label">
                {t.yourMessage}
                <span className="fe-count">{text.length} / {MAX_CHARS}</span>
              </span>
              <input
                type="text"
                className="ds-input fe-input"
                value={text}
                maxLength={MAX_CHARS}
                placeholder={t.placeholder}
                onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              />
            </label>

            <div className="fe-field">
              <span className="fe-label">{t.symbolLabel}</span>
              <div className="fe-symbols">
                <button
                  type="button"
                  className={`fe-symbol fe-symbol-none${symbol === '' ? ' is-on' : ''}`}
                  onClick={() => setSymbol('')}
                >
                  {t.none}
                </button>
                {ENGRAVING_SYMBOLS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`fe-symbol${symbol === s ? ' is-on' : ''}`}
                    onClick={() => setSymbol(s)}
                    aria-label={`${t.symbolLabel}: ${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="fe-steps">
        <h2 className="fe-h2 fe-h2-center">{t.stepsTitle}</h2>
        <div className="fe-rule fe-rule-center" />
        <div className="fe-steps-grid">
          {t.steps.map(step => (
            <div key={step.n} className="fe-step">
              <span className="fe-step-n">{step.n}</span>
              <h3 className="fe-step-t">{step.t}</h3>
              <p className="fe-step-d">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The details ── */}
      <section className="fe-facts">
        <div className="fe-facts-inner">
          <h2 className="fe-h2">{t.factsTitle}</h2>
          <div className="fe-rule" />
          <ul className="fe-fact-list">
            {t.facts.map(f => (
              <li key={f} className="fe-fact">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="fe-actions fe-actions-end">
            <Link href="/shop" className="btn-dark">{t.browse}</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
