// Is a CRM organization complete enough to generate a client document from?
//
// This is 07-MISSING-DOCUMENT-FLOW.md step 2, and it exists specifically to catch bad data
// BEFORE it propagates into a document that goes to a client. Pure — no I/O — so both the
// flow UI and any future server check can share it.
//
// 00-GUARDRAILS.md: never auto-fill or guess CRM data. This function only ever REPORTS
// what's missing; fixing it is always the user's job, in the CRM.

import type { Contact, Organization } from '@/lib/crm/types';

export interface ReadinessProblem {
  /** What's wrong, in the user's words. */
  message: string;
  /** Which record to go fix — deep-links into /internal/crm. */
  link: { kind: 'organization' | 'contact'; id: string };
}

export interface Readiness {
  ok: boolean;
  problems: ReadinessProblem[];
  /** The contact a document would be addressed to, when there's exactly one sensible pick. */
  keyContact?: Contact;
}

/**
 * Text that is obviously a stand-in rather than a real value. A document addressed to
 * "[Client name]" or "TBD" is worse than no document, and this data is free text with no
 * validation behind it (RECON.md § Step 2), so placeholders genuinely do survive to here.
 */
const PLACEHOLDER = /^\s*(\[.*\]|tbd|todo|test|testing|untitled|n\/?a|xxx+|placeholder|client name|new org(anization)?|foo|bar|asdf)\s*$/i;

function looksLikePlaceholder(value: string | undefined): boolean {
  return !!value && PLACEHOLDER.test(value);
}

/** Very loose — we're catching "not an address", not validating deliverability. */
const EMAIL_SHAPE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/**
 * Check one organization. `contacts` is every contact in the CRM; this picks the org's own.
 *
 * Deliberately strict about the contact: a proposal needs someone to address, and
 * Organization has no primaryContactId (RECON.md § Step 2) — the key contact has to be
 * derived, and "the org's only contact" is the sole unambiguous derivation. Two contacts
 * with no way to rank them is a real gap the user must resolve, not something to guess at.
 */
export function checkOrganizationReadiness(
  org: Organization,
  contacts: Contact[],
): Readiness {
  const problems: ReadinessProblem[] = [];
  const orgLink = { kind: 'organization' as const, id: org.id };

  if (!org.name?.trim()) {
    problems.push({ message: 'This organization has no name.', link: orgLink });
  } else if (looksLikePlaceholder(org.name)) {
    problems.push({
      message: `The organization name is still a placeholder (“${org.name}”).`,
      link: orgLink,
    });
  }

  const own = contacts.filter((c) => c.organizationId === org.id);
  let keyContact: Contact | undefined;

  if (own.length === 0) {
    problems.push({
      message: 'No contact is linked to this organization — a document needs someone to address.',
      link: orgLink,
    });
  } else {
    // One contact = unambiguous. Several = prefer the only one with a usable email; if that
    // doesn't disambiguate either, say so rather than picking arbitrarily.
    const withEmail = own.filter((c) => c.email && EMAIL_SHAPE.test(c.email.trim()));
    if (own.length === 1) {
      keyContact = own[0];
    } else if (withEmail.length === 1) {
      keyContact = withEmail[0];
    } else {
      problems.push({
        message: `${own.length} contacts are linked to this organization and none is marked as the key contact — pick who this document is for.`,
        link: orgLink,
      });
    }

    if (keyContact) {
      const contactLink = { kind: 'contact' as const, id: keyContact.id };
      if (looksLikePlaceholder(keyContact.name)) {
        problems.push({
          message: `The contact name is still a placeholder (“${keyContact.name}”).`,
          link: contactLink,
        });
      }
      if (!keyContact.email?.trim()) {
        problems.push({
          message: `${keyContact.name} has no email address.`,
          link: contactLink,
        });
      } else if (!EMAIL_SHAPE.test(keyContact.email.trim())) {
        problems.push({
          message: `${keyContact.name}’s email doesn’t look like an address (“${keyContact.email}”).`,
          link: contactLink,
        });
      }
    }
  }

  return { ok: problems.length === 0, problems, keyContact };
}
