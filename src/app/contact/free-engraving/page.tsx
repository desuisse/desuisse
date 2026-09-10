'use client';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function FreeEngravingPage() {
  const { language } = useLanguage();
  return (
    <>
      <Header />
      <div style={{ background: '#f7f3ee', padding: '64px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <h1 className="section-title">{language === 'sq' ? 'Gravim Falas' : 'Free Engraving'}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '16px auto 0' }} />
      </div>
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#555', lineHeight: 2, marginBottom: 24 }}>
          {language === 'sq'
            ? 'Çdo unazë DeSuisse vjen me mundësinë e gravimit falas. Shtoni emrin, datën ose mesazhin tuaj personal brenda unazës — deri në 30 karaktere.'
            : 'Every DeSuisse ring comes with the option of free engraving. Add your name, date, or personal message inside the ring — up to 30 characters.'}
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#555', lineHeight: 2, marginBottom: 36 }}>
          {language === 'sq'
            ? 'Gravimi bëhet me laser dhe është i qëndrueshëm. Zgjidhni edhe nga simbolet tona të veçanta si zemra ♡, pafundësia ∞, dhe shumë të tjera.'
            : 'Engraving is done with laser and is permanent. Choose from our special symbols including hearts ♡, infinity ∞, and many more.'}
        </p>
        <Link href="/shop" className="btn-dark" style={{ display: 'inline-block' }}>
          {language === 'sq' ? 'SHFLETO UNAZAT' : 'BROWSE RINGS'}
        </Link>
      </section>
      <Footer />
    </>
  );
}
