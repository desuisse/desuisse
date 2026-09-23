'use client';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { useRevealSections } from '@/components/Reveal';

export default function SizingServicePage() {
  useRevealSections();
  const { language } = useLanguage();
  return (
    <>
      <Header />
      <div style={{ background: '#f7f3ee', padding: '64px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <h1 className="section-title">{language === 'sq' ? 'Madhësia dhe Shërbimi' : 'Sizing & Service'}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '16px auto 0' }} />
      </div>
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#555', lineHeight: 2, marginBottom: 24 }}>
          {language === 'sq'
            ? 'Rregullimi i madhësisë është falas për të gjitha unazat deSuisse. Sillni unazën tuaj në çdo nga dyqanet tona dhe ne do ta përshtasim për ju pa kosto shtesë.'
            : 'Size adjustment is free for all deSuisse rings. Bring your ring to any of our boutiques and we will resize it for you at no additional cost.'}
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#555', lineHeight: 2, marginBottom: 36 }}>
          {language === 'sq'
            ? 'Për udhëzime se si të matni madhësinë e unazës suaj, vizitoni faqen tonë të Matësit të Unazës.'
            : 'For guidance on how to measure your ring size, visit our Ring Sizer page.'}
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/ring-sizer" className="btn-dark" style={{ display: 'inline-block' }}>{language === 'sq' ? 'MATËSI I UNAZËS' : 'RING SIZER'}</Link>
          <Link href="/contact" className="btn-gold" style={{ display: 'inline-block' }}>{language === 'sq' ? 'NA KONTAKTONI' : 'CONTACT US'}</Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
