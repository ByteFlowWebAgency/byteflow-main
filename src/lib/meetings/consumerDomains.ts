// Consumer email domains, excluded from domain-based CRM matching.
//
// WHY THIS EXISTS (RECON.md § Step 5): ByteFlow's client base — barbershops, nonprofits,
// CDCs — routinely uses personal addresses. If a contact is stored as someone@gmail.com,
// then without this list a single gmail.com attendee on an invite would domain-match EVERY
// organization holding a Gmail contact, and the meeting would be silently attached to the
// wrong client. 00-GUARDRAILS.md: "a wrong match is worse than no match."
//
// Domain matching is therefore only ever applied to corporate domains. A client whose only
// address is personal still matches via tier 1 (exact contact email) or tier 3 (org name in
// title), or gets assigned by hand — all of which are correct outcomes.

const CONSUMER_DOMAINS = new Set([
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'msn.com',
  // Yahoo / AOL
  'yahoo.com',
  'yahoo.co.uk',
  'ymail.com',
  'aol.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // ISP / legacy US consumer mail — common for small local businesses
  'comcast.net',
  'verizon.net',
  'att.net',
  'sbcglobal.net',
  'bellsouth.net',
  'cox.net',
  'charter.net',
  'earthlink.net',
  'juno.com',
  // Privacy-focused consumer mail
  'proton.me',
  'protonmail.com',
  'pm.me',
  'tutanota.com',
  'fastmail.com',
  'zoho.com',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'yandex.com',
  'hey.com',
  // Disposable — never a client
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'trashmail.com',
]);

/**
 * Hosts where the PATH identifies the organization, not the domain — a Facebook page or a
 * Wix subpage is a very common "website" for a barbershop or a small nonprofit. We only
 * ever compare hosts, so treating one of these as an org's own domain would attach every
 * such organization (and every visitor from that host) to whichever one matched first.
 */
const SHARED_HOSTS = new Set([
  'facebook.com',
  'm.facebook.com',
  'fb.com',
  'instagram.com',
  'linkedin.com',
  'x.com',
  'twitter.com',
  'linktr.ee',
  'wixsite.com',
  'squarespace.com',
  'wordpress.com',
  'blogspot.com',
  'sites.google.com',
  'business.site',
  'myshopify.com',
  'etsy.com',
  'yelp.com',
  'godaddysites.com',
  'weebly.com',
  'carrd.co',
  'notion.site',
  'github.io',
]);

/** True when a domain is a consumer mailbox rather than an organization's own domain. */
export function isConsumerDomain(domain: string): boolean {
  return CONSUMER_DOMAINS.has(domain.trim().toLowerCase());
}

/** True when a host is shared infrastructure rather than one organization's own domain. */
export function isSharedHost(domain: string): boolean {
  return SHARED_HOSTS.has(domain.trim().toLowerCase());
}
