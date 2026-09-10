'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function WarrantyPage() {
  const { language } = useLanguage();

  return (
    <>
      <Header />
      <div style={{ background: '#f7f3ee', padding: '48px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <h1 className="section-title">{language === 'sq' ? 'Garancia' : 'Warranty'}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '16px auto 0' }} />
      </div>
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#444', lineHeight: 1.9, marginBottom: 24 }}>
          {language === 'sq'
            ? 'Të gjitha produktet DeSuisse vijnë me një garanci 2-vjeçare ndaj defekteve të prodhimit...'
            : 'All DeSuisse products come with a 2-year warranty against manufacturing defects...'}
        </p>
        {/* Add your warranty content here */"Warranty details will be provided soon."}
      </section>
      <Footer />
    </>
  );
}