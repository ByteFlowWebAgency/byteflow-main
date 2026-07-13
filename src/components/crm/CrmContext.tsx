'use client';

// Data layer for the CRM screens: loads all four entity lists through the storage
// adapter, exposes save/delete actions that persist first and update local state only
// on success (a failed save keeps the user's edit in the form and surfaces the error —
// it never silently drops). Deletion follows 02-CRM-DATA-MODEL.md: callers confirm with
// reference counts, then this layer nulls JSON references in deals/contacts so future
// saves can't hit foreign-key violations, keeps activity history intact, and removes
// the record (the DB's `on delete set null` backstops the extracted columns).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createStore } from '@/lib/internal-tools/storage/client';
import type { Activity, Contact, Deal, Organization } from '@/lib/crm/types';
import type { CrmData } from '@/lib/crm/references';

const stores = {
  organizations: createStore<Organization>('organizations'),
  contacts: createStore<Contact>('contacts'),
  deals: createStore<Deal>('deals'),
  activities: createStore<Activity>('activities'),
};

export interface CrmContextValue {
  data: CrmData;
  loading: boolean;
  /** Non-null when the initial load failed — screens show an error state, never an empty board. */
  loadError: string | null;
  reload: () => void;
  serviceOptions: string[];
  saveOrganization: (org: Organization) => Promise<void>;
  saveContact: (contact: Contact) => Promise<void>;
  /** Persists the deal with updatedAt bumped to now; returns the record as stored. */
  saveDeal: (deal: Deal) => Promise<Deal>;
  saveActivity: (activity: Activity) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function useCrm(): CrmContextValue {
  const value = useContext(CrmContext);
  if (!value) throw new Error('useCrm must be used inside CrmProvider');
  return value;
}

const EMPTY: CrmData = { organizations: [], contacts: [], deals: [], activities: [] };

export function CrmProvider({
  serviceOptions,
  children,
}: {
  serviceOptions: string[];
  children: React.ReactNode;
}) {
  const [data, setData] = useState<CrmData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);
  // Latest committed data, readable synchronously inside the delete flows below.
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      stores.organizations.list(),
      stores.contacts.list(),
      stores.deals.list(),
      stores.activities.list(),
    ])
      .then(([organizations, contacts, deals, activities]) => {
        if (cancelled) return;
        setData({ organizations, contacts, deals, activities });
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : 'Could not load CRM data.',
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadNonce]);

  const reload = useCallback(() => setLoadNonce((n) => n + 1), []);

  const upsertIn = <T extends { id: string }>(list: T[], record: T): T[] =>
    list.some((r) => r.id === record.id)
      ? list.map((r) => (r.id === record.id ? record : r))
      : [...list, record];

  const saveOrganization = useCallback(async (org: Organization) => {
    await stores.organizations.save(org);
    setData((d) => ({ ...d, organizations: upsertIn(d.organizations, org) }));
  }, []);

  const saveContact = useCallback(async (contact: Contact) => {
    await stores.contacts.save(contact);
    setData((d) => ({ ...d, contacts: upsertIn(d.contacts, contact) }));
  }, []);

  const saveDeal = useCallback(async (deal: Deal) => {
    const touched = { ...deal, updatedAt: new Date().toISOString() };
    await stores.deals.save(touched);
    setData((d) => ({ ...d, deals: upsertIn(d.deals, touched) }));
    return touched;
  }, []);

  const saveActivity = useCallback(async (activity: Activity) => {
    await stores.activities.save(activity);
    setData((d) => ({ ...d, activities: upsertIn(d.activities, activity) }));
  }, []);

  const deleteOrganization = useCallback(async (id: string) => {
    const current = dataRef.current;
    const orphanedContacts = current.contacts
      .filter((c) => c.organizationId === id)
      .map((c) => ({ ...c, organizationId: undefined }));
    const orphanedDeals = current.deals
      .filter((dl) => dl.organizationId === id)
      .map((dl) => ({ ...dl, organizationId: undefined }));
    if (orphanedContacts.length) await stores.contacts.saveMany(orphanedContacts);
    if (orphanedDeals.length) await stores.deals.saveMany(orphanedDeals);
    await stores.organizations.remove(id);
    setData((d) => ({
      ...d,
      organizations: d.organizations.filter((o) => o.id !== id),
      contacts: d.contacts.map(
        (c) => orphanedContacts.find((o) => o.id === c.id) ?? c,
      ),
      deals: d.deals.map((dl) => orphanedDeals.find((o) => o.id === dl.id) ?? dl),
    }));
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    const current = dataRef.current;
    const repointedDeals = current.deals
      .filter((dl) => dl.primaryContactId === id)
      .map((dl) => ({ ...dl, primaryContactId: undefined }));
    const repointedContacts = current.contacts
      .filter((c) => c.referredByContactId === id)
      .map((c) => ({ ...c, referredByContactId: undefined }));
    // Activities: null the contact ref where a deal ref remains; when this contact was
    // the activity's only anchor, keep the dangling id so history survives (renderers
    // show "[deleted contact]"; the DB column is nulled by the FK backstop).
    const repointedActivities = current.activities
      .filter((a) => a.contactId === id && a.dealId)
      .map((a) => ({ ...a, contactId: undefined }));
    if (repointedDeals.length) await stores.deals.saveMany(repointedDeals);
    if (repointedContacts.length) await stores.contacts.saveMany(repointedContacts);
    if (repointedActivities.length) {
      await stores.activities.saveMany(repointedActivities);
    }
    await stores.contacts.remove(id);
    setData((d) => ({
      ...d,
      contacts: d.contacts
        .filter((c) => c.id !== id)
        .map((c) => repointedContacts.find((r) => r.id === c.id) ?? c),
      deals: d.deals.map((dl) => repointedDeals.find((r) => r.id === dl.id) ?? dl),
      activities: d.activities.map(
        (a) => repointedActivities.find((r) => r.id === a.id) ?? a,
      ),
    }));
  }, []);

  const deleteDeal = useCallback(async (id: string) => {
    const current = dataRef.current;
    // Same policy as contacts: keep history; null the deal ref only where a contact
    // ref remains to anchor the activity.
    const repointedActivities = current.activities
      .filter((a) => a.dealId === id && a.contactId)
      .map((a) => ({ ...a, dealId: undefined }));
    if (repointedActivities.length) {
      await stores.activities.saveMany(repointedActivities);
    }
    await stores.deals.remove(id);
    setData((d) => ({
      ...d,
      deals: d.deals.filter((dl) => dl.id !== id),
      activities: d.activities.map(
        (a) => repointedActivities.find((r) => r.id === a.id) ?? a,
      ),
    }));
  }, []);

  const value = useMemo<CrmContextValue>(
    () => ({
      data,
      loading,
      loadError,
      reload,
      serviceOptions,
      saveOrganization,
      saveContact,
      saveDeal,
      saveActivity,
      deleteOrganization,
      deleteContact,
      deleteDeal,
    }),
    [
      data,
      loading,
      loadError,
      reload,
      serviceOptions,
      saveOrganization,
      saveContact,
      saveDeal,
      saveActivity,
      deleteOrganization,
      deleteContact,
      deleteDeal,
    ],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}
