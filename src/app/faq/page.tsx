'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

/**
 * FAQ page. Each item is collapsible (accordion).
 */
export default function FAQPage() {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sq = language === 'sq';

  const faqs = sq ? [
    {
      q: 'Si mund të porosis një produkt?',
      a: 'Mund të porositni online përmes faqes sonë, ose të vizitoni një nga butikët tanë në Karlovy Vary ose Pejë. Pas porosisë online, stafi ynë do t\u2019ju kontaktojë brenda 24 orëve për të konfirmuar detajet.',
    },
    {
      q: 'Cilat mënyra pagese pranoni?',
      a: 'Pranojmë transfertë bankare dhe pagesë me para në dorëzim. Pas porosisë, stafi ynë ju kontakton për të konfirmuar mënyrën e pagesës dhe dorëzimin. Nuk pranojmë pagesa me kartë online.',
    },
    {
      q: 'Sa zgjat dorëzimi?',
      a: 'Kosovë: 2–4 ditë pune. Republika Çeke: 3–5 ditë pune. BE: 5–8 ditë pune. Të gjitha pakot janë të siguruara dhe me gjurmim. Detaje të plota: shih faqen e [Dorëzimit](/shipping).',
    },
    {
      q: 'A mund të ndryshoj madhësinë e unazës më vonë?',
      a: 'Po. Ofrojmë shërbim falas të ndryshimit të madhësisë për të gjitha unazat tona [[BRENDA NJË PERIUDHE — p.sh. brenda 1 viti pas blerjes]]. Vizitoni një boutique ose na shkruani për të rregulluar.',
    },
    {
      q: 'A janë diamantet tuaja të çertifikuar?',
      a: 'Po. Të gjithë diamantet tona vijnë me çertifikatë nga laboratorë të njohur ndërkombëtarisht: GIA, IGI, ose HRD Antwerp. Çertifikata përfshihet me çdo blerje që përmban diamant.',
    },
    {
      q: 'Çfarë garancie ofroni?',
      a: '[[VENDOSNI POLITIKËN — p.sh.: 2 vjet garanci ndaj defekteve të prodhimit, përfshirë riparime falas. Garancia mbulon defektet strukturore, jo dëmtimet nga përdorimi normal.]]',
    },
    {
      q: 'A mund të kthej një produkt nëse ndryshoj mendjen?',
      a: 'Po, brenda 14 ditëve nga marrja, për produkte standarde (jo me porosi ose me gdhendje). Produkti duhet të jetë i papërdorur, në paketimin origjinal. Detaje të plota: shih faqen e [Kthimeve](/returns).',
    },
    {
      q: 'A ofroni shërbim dizajni të personalizuar?',
      a: 'Po. Bashkëpunojmë me ju për të krijuar bizhuteri unike — nga unaza fejese deri te byzylykë me kujtim. Vizitoni faqen tonë të [Dizajnit të Personalizuar](/custom-design) ose na kontaktoni për një konsultim.',
    },
    {
      q: 'Si të zgjedh madhësinë e duhur të unazës?',
      a: 'Përdorni udhëzuesin tonë të [Matësit të Unazës](/ring-sizer) për të matur vetë në shtëpi, ose vizitoni një boutique për një matje profesionale. Nëse madhësia nuk është e saktë, ofrojmë rregullim falas.',
    },
    {
      q: 'A mund të blej një kupon dhuratë?',
      a: 'Po. Kuponët tanë të dhuratës janë të disponueshëm në vlera nga €100 deri në €2,000. Mund t\u2019i blini në faqen e [Kuponëve të Dhuratës](/gift-vouchers) dhe dërgohen menjëherë me email.',
    },
    {
      q: 'A bëni riparime për bizhuteri që nuk janë blerë te ju?',
      a: 'Po, ofrojmë shërbime riparimi për shumicën e bizhuterive. Vizitoni një nga butikët tanë me bizhuterinë për një vlerësim falas dhe kuotim.',
    },
    {
      q: 'A mund t\u2019ju ndjek në rrjete sociale?',
      a: 'Sigurisht! Na ndiqni në Instagram dhe Facebook — linkat janë në fund të faqes. Aty postojmë krijime të reja, momente nga butikët, dhe histori klientësh (me pëlqimin e tyre).',
    },
  ] : [
    {
      q: 'How can I order a product?',
      a: 'You can order online through our website, or visit one of our boutiques in Karlovy Vary or Pejë. After an online order, our staff will contact you within 24 hours to confirm the details.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept bank transfer and cash on delivery. After you order, our staff contact you to confirm the payment method and the delivery. We do not take card payments online.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Kosovo: 2–4 business days. Czech Republic: 3–5 business days. EU: 5–8 business days. All packages are insured and tracked. Full details: see our [Shipping page](/shipping).',
    },
    {
      q: 'Can I resize the ring later?',
      a: 'Yes. We offer free resizing service for all our rings [[WITHIN A PERIOD — e.g. within 1 year of purchase]]. Visit a boutique or write to us to arrange.',
    },
    {
      q: 'Are your diamonds certified?',
      a: 'Yes. All our diamonds come with a certificate from internationally recognised laboratories: GIA, IGI, or HRD Antwerp. The certificate is included with every purchase containing a diamond.',
    },
    {
      q: 'What warranty do you offer?',
      a: '[[INSERT POLICY — e.g.: 2-year warranty against manufacturing defects, including free repairs. The warranty covers structural defects, not damage from normal use.]]',
    },
    {
      q: 'Can I return a product if I change my mind?',
      a: 'Yes, within 14 days of receipt, for standard products (not bespoke or engraved). The product must be unworn, in original packaging. Full details: see our [Returns page](/returns).',
    },
    {
      q: 'Do you offer custom design services?',
      a: 'Yes. We collaborate with you to create unique pieces — from engagement rings to keepsake bracelets. Visit our [Custom Design page](/custom-design) or contact us for a consultation.',
    },
    {
      q: 'How do I choose the right ring size?',
      a: 'Use our [Ring Sizer guide](/ring-sizer) to measure yourself at home, or visit a boutique for a professional measurement. If the size is not right, we offer free resizing.',
    },
    {
      q: 'Can I buy a gift voucher?',
      a: 'Yes. Our gift vouchers are available in values from €100 to €2,000. You can purchase them on our [Gift Vouchers page](/gift-vouchers) and they are delivered instantly by email.',
    },
    {
      q: 'Do you repair jewellery not purchased from you?',
      a: 'Yes, we offer repair services for most jewellery. Visit one of our boutiques with the piece for a free assessment and quote.',
    },
    {
      q: 'Can I follow you on social media?',
      a: 'Of course! Follow us on Instagram and Facebook — the links are at the bottom of the page. There we post new creations, moments from the boutiques, and client stories (with their permission).',
    },
  ];

  const t = sq ? {
    eyebrow: '◆ Pyetjet e shpeshta',
    title: 'Pyetjet që Marrim Më Shumë',
    intro: 'Përgjigje ndaj pyetjeve më të shpeshta që marrim nga klientët tanë. Nëse nuk e gjeni atë që po kërkoni, na shkruani.',
    notFound: 'Nuk e gjetët përgjigjen?',
    contact: 'Na kontaktoni',
  } : {
    eyebrow: '◆ Frequently asked',
    title: 'Questions We Hear Most',
    intro: 'Answers to the most common questions we receive from our clients. If you do not find what you are looking for, write to us.',
    notFound: 'Did not find your answer?',
    contact: 'Contact us',
  };

  // Tiny helper to turn [text](href) markdown links into JSX
  const renderAnswer = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      parts.push(text.slice(lastIndex, match.index));
      parts.push(
        <Link key={key++} href={match[2]} style={{ color: '#c9a84c', textDecoration: 'underline' }}>
          {match[1]}
        </Link>
      );
      lastIndex = match.index + match[0].length;
    }
    parts.push(text.slice(lastIndex));
    return parts;
  };

  return (
    <>
      <Header />

      <div style={{ background: '#f7f3ee', padding: '60px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 14 }}>{t.eyebrow}</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, color: '#1a0a0a', lineHeight: 1.15 }}>{t.title}</h1>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '20px auto 0' }} />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#666', maxWidth: 580, margin: '20px auto 0', lineHeight: 1.85 }}>{t.intro}</p>
      </div>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '60px 40px' }}>
        {faqs.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} style={{ borderBottom: '1px solid #e8e0d4' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '22px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  color: '#1a0a0a',
                  fontWeight: 500,
                  flex: 1,
                  lineHeight: 1.4,
                }}>{f.q}</span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 22,
                  color: '#c9a84c',
                  fontWeight: 300,
                  flexShrink: 0,
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}>+</span>
              </button>
              <div style={{
                maxHeight: isOpen ? 600 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.4s ease, padding 0.3s ease',
                paddingBottom: isOpen ? 24 : 0,
              }}>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: '#555',
                  lineHeight: 1.85,
                  paddingRight: 32,
                }}>
                  {renderAnswer(f.a)}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <section style={{ padding: '50px 40px 80px', background: '#f7f3ee', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 20 }}>{t.notFound}</h2>
        <Link href="/contact" style={{ display: 'inline-block', padding: '13px 32px', background: '#1a0a0a', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>{t.contact}</Link>
      </section>

      <Footer />
    </>
  );
}
