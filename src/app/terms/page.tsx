'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function TermsPage() {
  const { language } = useLanguage();
  const sq = language === 'sq';

  const t = sq ? {
    eyebrow: '◆ Kushtet',
    title: 'Kushtet e Përdorimit',
    lastUpdated: 'Përditësuar së fundi: 30 Maj 2026',
    intro: 'Duke përdorur këtë faqe ose duke vendosur një porosi, ju pranoni këto kushte. Ju lutemi lexojini me kujdes.',

    sections: [
      {
        title: '1. Kompania',
        body: 'Kjo faqe operohet nga [[VENDOSNI EMRIN E KOMPANISË DHE NUMRIN E REGJISTRIMIT]]. Adresa e regjistruar: [[VENDOSNI ADRESËN]].',
      },
      {
        title: '2. Produktet dhe Çmimet',
        body: 'Të gjitha produktet shfaqen me përshkrime dhe foto për qëllime informative. Ngjyrat dhe detajet mund të ndryshojnë lehtësisht nga ekrani te produkti i vërtetë për shkak të kushteve të ndriçimit dhe ekraneve.\n\nÇmimet shfaqen në euro (€) dhe përfshijnë TVSH-në kur është e zbatueshme. Rezervojmë të drejtën të ndryshojmë çmimet pa njoftim, megjithëse porositë e konfirmuara mbahen me çmimin e konfirmuar.',
      },
      {
        title: '3. Porositja dhe Pagesa',
        body: 'Kur vendosni një porosi, ju merrni një email konfirmimi. Stafi ynë do t\u2019ju kontaktojë për të diskutuar detajet e pagesës dhe dorëzimit.\n\nPagesa bëhet me transfertë bankare ose me para në dorëzim. Nuk pranohen pagesa me kartë përmes faqes.',
      },
      {
        title: '4. Dorëzimi',
        body: '[[VENDOSNI POLITIKËN E DORËZIMIT — kohëzgjatja, kostot, zonat]]\n\nDorëzimet bëhen përmes ofruesve të besuar. Të gjitha pakot janë të siguruara gjatë transportit. Klienti është përgjegjës për të dhënë një adresë të saktë; gabimet që rezultojnë në kthim mbulohen nga klienti.',
      },
      {
        title: '5. Kthimet dhe Rimbursimet',
        body: '[[VENDOSNI POLITIKËN E KTHIMEVE — periudha (zakonisht 14 ditë), gjendja e produktit, kostot]]\n\nProduktet e personalizuara ose me gdhendje nuk mund të kthehen, përveç rasteve të defekteve.',
      },
      {
        title: '6. Garancia dhe Defektet',
        body: '[[VENDOSNI INFORMACIONIN E GARANCISË — kohëzgjatja, çfarë mbulohet]]\n\nNëse merrni një produkt me defekt, na kontaktoni brenda 14 ditëve me foto dhe përshkrim. Ne ofrojmë riparim, zëvendësim ose rimbursim sipas situatës.',
      },
      {
        title: '7. Pronësia Intelektuale',
        body: 'Të gjitha fotot, tekstet, logot dhe dizajnet në këtë faqe janë pronë e [[EMRI I KOMPANISË]]. Ndalohet riprodhimi pa leje të shkruar.',
      },
      {
        title: '8. Kufizimi i Përgjegjësisë',
        body: 'Ne nuk jemi përgjegjës për:\n\n• Humbjet indirekte ose pasojash që dalin nga përdorimi i faqes.\n• Vonesat e dorëzimit jashtë kontrollit tonë (forca madhore, dogana).\n• Përdorimin e gabuar të produkteve nga klienti.\n\nPërgjegjësia jonë totale ndaj klientit nuk e tejkalon vlerën e produktit të blerë.',
      },
      {
        title: '9. Ligji i Zbatueshëm',
        body: 'Këto kushte rregullohen nga ligji i [[VENDOSNI JURIDIKSIONIN — p.sh. Republikës së Kosovës / Republikës Çeke]]. Mosmarrëveshjet zgjidhen nga gjykatat kompetente në [[VENDI]].',
      },
      {
        title: '10. Kontakt',
        body: 'Për çdo pyetje në lidhje me këto kushte: info@desuisse.com.',
      },
    ],
  } : {
    eyebrow: '◆ Terms',
    title: 'Terms of Service',
    lastUpdated: 'Last updated: 30 May 2026',
    intro: 'By using this website or placing an order, you agree to these terms. Please read them carefully.',

    sections: [
      {
        title: '1. The Company',
        body: 'This website is operated by [[INSERT COMPANY NAME AND REGISTRATION NUMBER]]. Registered address: [[INSERT ADDRESS]].',
      },
      {
        title: '2. Products and Pricing',
        body: 'All products are displayed with descriptions and photos for informational purposes. Colours and details may differ slightly from screen to actual product due to lighting conditions and display calibration.\n\nPrices are displayed in euros (€) and include VAT where applicable. We reserve the right to change prices without notice, though confirmed orders are honoured at the confirmed price.',
      },
      {
        title: '3. Ordering and Payment',
        body: 'When you place an order, you receive a confirmation email. Our staff will contact you to discuss payment and delivery details.\n\nPayment is by bank transfer or cash on delivery. Card payments are not taken through this website.',
      },
      {
        title: '4. Delivery',
        body: '[[INSERT DELIVERY POLICY — timeframes, costs, zones]]\n\nDeliveries are made through trusted carriers. All packages are insured during transit. The customer is responsible for providing an accurate address; errors resulting in return are the customer\u2019s cost.',
      },
      {
        title: '5. Returns and Refunds',
        body: '[[INSERT RETURNS POLICY — window (typically 14 days), product condition, costs]]\n\nCustomised or engraved items cannot be returned, except in cases of defects.',
      },
      {
        title: '6. Warranty and Defects',
        body: '[[INSERT WARRANTY INFORMATION — duration, what is covered]]\n\nIf you receive a defective product, contact us within 14 days with photos and description. We offer repair, replacement, or refund depending on the situation.',
      },
      {
        title: '7. Intellectual Property',
        body: 'All photos, text, logos and designs on this website are the property of [[COMPANY NAME]]. Reproduction without written permission is prohibited.',
      },
      {
        title: '8. Limitation of Liability',
        body: 'We are not responsible for:\n\n• Indirect or consequential losses arising from use of the site.\n• Delivery delays beyond our control (force majeure, customs).\n• Misuse of products by the customer.\n\nOur total liability to the customer does not exceed the value of the purchased product.',
      },
      {
        title: '9. Governing Law',
        body: 'These terms are governed by the laws of [[INSERT JURISDICTION — e.g. Republic of Kosovo / Czech Republic]]. Disputes are resolved by the competent courts in [[LOCATION]].',
      },
      {
        title: '10. Contact',
        body: 'For any questions about these terms: info@desuisse.com.',
      },
    ],
  };

  return (
    <>
      <Header />

      <div style={{ background: '#f7f3ee', padding: '60px 40px', textAlign: 'center', borderBottom: '1px solid #e8e0d4' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 14 }}>{t.eyebrow}</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, color: '#1a0a0a', lineHeight: 1.15 }}>{t.title}</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#888', marginTop: 14, letterSpacing: '0.05em' }}>{t.lastUpdated}</p>
        <div style={{ width: 40, height: 1, background: '#c9a84c', margin: '20px auto 0' }} />
      </div>

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '60px 40px 100px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: '#555', lineHeight: 1.85, marginBottom: 40 }}>
          {t.intro}
        </p>

        {t.sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 14 }}>
              {s.title}
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#555', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              {s.body}
            </p>
          </section>
        ))}
      </article>

      <Footer />
    </>
  );
}
