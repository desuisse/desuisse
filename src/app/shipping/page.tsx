'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useRevealSections } from '@/components/Reveal';

export default function ShippingPage() {
  useRevealSections();
  const { language } = useLanguage();
  const sq = language === 'sq';

  const t = sq ? {
    eyebrow: '◆ Dorëzimi',
    title: 'Dorëzimi dhe Transporti',
    intro: 'Dorëzojmë me kujdes maksimal — çdo pako është e siguruar dhe e gjurmueshme. Ja çfarë duhet të dini.',
    zones: [
      { name: 'Kosova', time: '[[2–4 ditë pune]]', cost: '[[Falas mbi €X / €Y nën këtë vlerë]]' },
      { name: 'Republika Çeke', time: '[[3–5 ditë pune]]', cost: '[[€X]]' },
      { name: 'Bashkimi Evropian', time: '[[5–8 ditë pune]]', cost: '[[€X]]' },
      { name: 'Bota tjetër', time: '[[7–14 ditë pune]]', cost: '[[Sipas destinacionit — kërkoni kuotim]]' },
    ],
    zonesTitle: 'Kohëzgjatja dhe kostot',
    zonesNote: 'Të gjitha pakot dërgohen me kurier të siguruar dhe me gjurmim të plotë.',

    sections: [
      {
        heading: 'Konfirmimi i porosisë',
        body: 'Pas vendosjes së porosisë, ju merrni një email konfirmimi. Stafi ynë do t\u2019ju kontaktojë brenda 24 orëve për të diskutuar detajet e pagesës dhe të dorëzimit.',
      },
      {
        heading: 'Paketimi',
        body: 'Çdo bizhuteri vendoset në kutinë origjinale të deSuisse, e mbështjellë në mënyrë diskrete jashtë. Asnjë indikim i vlerës nuk shfaqet në paketim për të mbrojtur sigurinë e dërgesës.',
      },
      {
        heading: 'Sigurimi dhe gjurmimi',
        body: 'Të gjitha porositë janë të siguruara për vlerën e plotë gjatë transportit. Ju do të merrni një numër gjurmimi me email pasi pako të dalë nga depot tona.',
      },
      {
        heading: 'Marrja në boutique',
        body: 'Mund të zgjidhni të merrni porosinë në një nga butikët tanë në Karlovy Vary ose Pejë. Pa kosto shtesë. Stafi ynë do t\u2019ju njoftojë kur produkti është gati për marrje.',
      },
      {
        heading: 'Dogana dhe taksat',
        body: 'Për dërgesat jashtë BE-së dhe Kosovës, mund të aplikohen taksa doganore dhe TVSH në vendin e destinacionit. Këto kosto janë përgjegjësi e blerësit dhe nuk përfshihen në çmimin tonë.',
      },
      {
        heading: 'Adresa e gabuar',
        body: 'Ju lutemi sigurohuni që adresa juaj e dorëzimit është e saktë para se të konfirmoni porosinë. Pakot e kthyera për shkak të adresës së gabuar do të ridërgohen me kosto të blerësit.',
      },
    ],
    contactHeading: 'Pyetje për dorëzimin?',
    contactBody: 'Na shkruani në info@desuisse.com. Ne përgjigjemi brenda 24 orëve.',
    contactBtn: 'Na kontaktoni',
  } : {
    eyebrow: '◆ Shipping',
    title: 'Shipping and Delivery',
    intro: 'We ship with maximum care — every package is insured and tracked. Here is what you need to know.',
    zones: [
      { name: 'Kosovo', time: '[[2–4 business days]]', cost: '[[Free over €X / €Y below this amount]]' },
      { name: 'Czech Republic', time: '[[3–5 business days]]', cost: '[[€X]]' },
      { name: 'European Union', time: '[[5–8 business days]]', cost: '[[€X]]' },
      { name: 'Rest of world', time: '[[7–14 business days]]', cost: '[[Depending on destination — request a quote]]' },
    ],
    zonesTitle: 'Delivery times and costs',
    zonesNote: 'All packages are shipped via insured courier with full tracking.',

    sections: [
      {
        heading: 'Order confirmation',
        body: 'After placing your order, you receive a confirmation email. Our staff will contact you within 24 hours to discuss payment and delivery details.',
      },
      {
        heading: 'Packaging',
        body: 'Every piece is placed in the original deSuisse box, wrapped discreetly on the outside. No indication of value appears on the packaging, to protect the security of the shipment.',
      },
      {
        heading: 'Insurance and tracking',
        body: 'All orders are insured for the full value during transit. You will receive a tracking number by email once the package leaves our facility.',
      },
      {
        heading: 'In-boutique pickup',
        body: 'You can choose to collect your order at one of our boutiques in Karlovy Vary or Pejë. No additional cost. Our staff will notify you when your piece is ready for collection.',
      },
      {
        heading: 'Customs and taxes',
        body: 'For shipments outside the EU and Kosovo, customs duties and VAT may apply in the destination country. These costs are the buyer\u2019s responsibility and are not included in our pricing.',
      },
      {
        heading: 'Wrong address',
        body: 'Please make sure your delivery address is correct before confirming your order. Packages returned due to wrong addresses will be re-shipped at the buyer\u2019s cost.',
      },
    ],
    contactHeading: 'Shipping questions?',
    contactBody: 'Write to info@desuisse.com. We respond within 24 hours.',
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

      <article style={{ maxWidth: 880, margin: '0 auto', padding: '60px 40px 40px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: '#555', lineHeight: 1.85, marginBottom: 40, maxWidth: 720 }}>
          {t.intro}
        </p>

        {/* Zones table */}
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 18 }}>
          {t.zonesTitle}
        </h2>
        <div style={{ border: '1px solid #e8e0d4', marginBottom: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
            <thead>
              <tr style={{ background: '#fafaf8' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{sq ? 'Destinacioni' : 'Destination'}</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{sq ? 'Koha' : 'Time'}</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{sq ? 'Kostoja' : 'Cost'}</th>
              </tr>
            </thead>
            <tbody>
              {t.zones.map((z, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f0ebe3', background: i % 2 === 0 ? '#fff' : '#fdfaf5' }}>
                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-sans)', fontSize: 14, color: '#1a0a0a', fontWeight: 600 }}>{z.name}</td>
                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666' }}>{z.time}</td>
                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#666' }}>{z.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#aaa', marginBottom: 40 }}>{t.zonesNote}</p>

        {t.sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, color: '#1a0a0a', marginBottom: 12 }}>
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
