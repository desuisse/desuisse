/**
 * The house's own contact details — ONE place.
 *
 * These used to be typed out per page, and the contact page still carried the
 * template's placeholder "987-654-3210" long after the footer had the real
 * number. A customer who reached the contact page got a number that rings
 * nobody. Anything that shows a phone number or address reads it from here.
 */
export const CONTACT = {
  /** As written for a human. */
  phone: '+383 48 233 400',
  /** As dialled: no spaces, E.164. */
  phoneHref: 'tel:+38348233400',
  email: 'info@desuisse.com',
  emailHref: 'mailto:info@desuisse.com',
} as const;
