'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useRevealSections } from '@/components/Reveal';

/**
 * Returns & Exchanges policy page.
 *
 * The content here is a sensible STARTING TEMPLATE for an EU/Kosovo
 * jewellery business. You must review and adjust to match your actual
 * practices before launch. Fields in [[BRACKETS]] are placeholders.
 */
export default function ReturnsPage() {
  useRevealSections();
  const { language } = useLanguage();
  const sq = language === 'sq';

  const t = sq ? {
    eyebrow: '◆ Kthimet',
    title: 'Kthimet dhe Shkëmbimet',
    intro: 'Kënaqësia juaj është prioriteti ynë. Nëse për ndonjë arsye produkti që morët nuk është ai që pritnit, ne jemi këtu për të ndihmuar.',
    sections: [
      {
        heading: 'Periudha e kthimit',
        body: 'Keni 14 ditë nga dita e marrjes së porosisë për të kërkuar kthimin e produkteve standarde. Periudha llogaritet nga data e dorëzimit. [[NËSE OFRONI MË GJATË, P.SH. 30 DITË, NDRYSHONI KËTU]]',
      },
      {
        heading: 'Gjendja e produktit',
        body: 'Produktet duhet të kthehen:\n• Të papërdorur dhe pa shenja të mbajtjes\n• Në paketimin origjinal të deSuisse\n• Me të gjitha çertifikatat, etiketat dhe dokumentet e marra\n• Pa modifikime (madhësia e ndryshuar, gdhendjet etj.)',
      },
      {
        heading: 'Çfarë NUK mund të kthehet',
        body: '• Produkte të personalizuara ose me dizajn të porositur\n• Produkte me gdhendje sipas kërkesës\n• Produkte me madhësi të ndryshuar (përveç defekteve)\n• Vathë (për arsye higjenike, përveç defekteve)\n• Produktet që kanë shenja të mbajtjes ose dëmtimi',
      },
      {
        heading: 'Procesi i kthimit',
        body: '1. Na shkruani në info@desuisse.com brenda 14 ditëve me numrin e porosisë dhe arsyen e kthimit\n2. Ne do t\u2019ju dërgojmë udhëzime për dërgimin (përfshirë adresën e kthimit)\n3. Paketoni produktin me kujdes në paketimin origjinal\n4. Dërgojeni përmes një kurieri të siguruar (e rekomandojmë me ndjekje + sigurim)\n5. Pas marrjes dhe inspektimit, rimbursimi procesohet brenda 14 ditëve',
      },
      {
        heading: 'Kostot e kthimit',
        body: '[[VENDOSNI POLITIKËN — opsionet e zakonshme:\n• Klienti paguan transportin e kthimit, përveç rasteve të defektit\n• ose: deSuisse mbulon transportin e kthimit në të gjitha rastet]]',
      },
      {
        heading: 'Rimbursimi',
        body: 'Pas inspektimit dhe aprovimit, rimbursimi do të procesohet në mënyrën origjinale të pagesës brenda 14 ditëve. Bankat mund të marrin disa ditë shtesë për të reflektuar pagesën.',
      },
      {
        heading: 'Shkëmbimet',
        body: 'Nëse dëshironi të shkëmbeni produktin me një model tjetër ose madhësi tjetër, na kontaktoni në info@desuisse.com. Ne do të vlerësojmë diferencën e çmimit dhe do t\u2019ju ofrojmë opsionet më të mira.',
      },
      {
        heading: 'Defektet',
        body: 'Nëse produkti ka defekt prej fabrikës, na kontaktoni menjëherë me foto dhe përshkrim. Ne ofrojmë riparim falas, zëvendësim, ose rimbursim të plotë sipas situatës. Garancia ndaj defekteve të prodhimit është [[VENDOSNI KOHËZGJATJEN — p.sh. 2 vjet]].',
      },
    ],
    contactHeading: 'Keni pyetje?',
    contactBody: 'Na shkruani në info@desuisse.com ose vizitoni një nga butikët tanë. Stafi ynë do t\u2019ju ndihmojë me kënaqësi.',
    contactBtn: 'Na kontaktoni',
  } : {
    eyebrow: '◆ Returns',
    title: 'Returns and Exchanges',
    intro: 'Your satisfaction is our priority. If for any reason the product you received is not what you expected, we are here to help.',
    sections: [
      {
        heading: 'Return window',
        body: 'You have 14 days from the day you receive your order to request a return of standard products. The period is calculated from the date of delivery. [[IF YOU OFFER LONGER, e.g. 30 DAYS, ADJUST HERE]]',
      },
      {
        heading: 'Product condition',
        body: 'Products must be returned:\n• Unworn and without signs of wear\n• In the original deSuisse packaging\n• With all certificates, tags and documentation received\n• Without modifications (resizing, engraving, etc.)',
      },
      {
        heading: 'What CANNOT be returned',
        body: '• Bespoke or custom-designed pieces\n• Items engraved to order\n• Resized items (except for defects)\n• Earrings (for hygiene reasons, except for defects)\n• Items showing signs of wear or damage',
      },
      {
        heading: 'Return process',
        body: '1. Write to info@desuisse.com within 14 days with your order number and return reason\n2. We will send you shipping instructions (including the return address)\n3. Pack the item carefully in the original packaging\n4. Ship via an insured courier (we recommend tracked + insured)\n5. After we receive and inspect, refund is processed within 14 days',
      },
      {
        heading: 'Return shipping costs',
        body: '[[INSERT POLICY — common options:\n• Customer pays return shipping, except in case of defect\n• or: deSuisse covers return shipping in all cases]]',
      },
      {
        heading: 'Refund',
        body: 'After inspection and approval, the refund will be processed to the original payment method within 14 days. Your bank may take a few additional days for the refund to appear.',
      },
      {
        heading: 'Exchanges',
        body: 'If you want to exchange your item for a different model or size, contact us at info@desuisse.com. We will assess any price difference and offer you the best options.',
      },
      {
        heading: 'Defects',
        body: 'If the product has a manufacturing defect, contact us immediately with photos and description. We offer free repair, replacement, or full refund depending on the situation. Manufacturing-defect warranty is [[INSERT DURATION — e.g. 2 years]].',
      },
    ],
    contactHeading: 'Questions?',
    contactBody: 'Write to info@desuisse.com or visit one of our boutiques. Our staff will be happy to help.',
    contactBtn: 'Contact us',
  };

  return (
    <>
      <Header />

      <div style={{ background: '#f7f3ee', padding: '60px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 14 }}>{t.eyebrow}</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, color: '#1a0a0a', lineHeight: 1.15 }}>{t.title}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '20px auto 0' }} />
      </div>

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '60px 40px 60px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: '#555', lineHeight: 1.85, marginBottom: 40 }}>
          {t.intro}
        </p>

        {t.sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 14 }}>
              {s.heading}
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#555', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              {s.body}
            </p>
          </section>
        ))}
      </article>

      <section style={{ padding: '50px 40px 80px', background: '#f7f3ee', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 12 }}>{t.contactHeading}</h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#666', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.85 }}>{t.contactBody}</p>
        <Link href="/contact" style={{ display: 'inline-block', padding: '13px 32px', background: '#1a0a0a', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>{t.contactBtn}</Link>
      </section>

      <Footer />
    </>
  );
}
