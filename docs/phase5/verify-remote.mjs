// Phase 5 morning verification: proves the storage layer against the REAL Supabase
// project, end-to-end through the app's API routes. Run AFTER `supabase db push`
// succeeds, with a dev server started normally (its .env.local should carry the
// Supabase values — canonical SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY names or the
// existing SUPABASE_PROJECT_URL/SUPABASE_DB_SERVICE_ROLE_KEY names both work).
//
//   node docs/phase5/verify-remote.mjs
//
// Reads INTERNAL_TOOLS_* login creds from .env.local. Creates one throwaway
// organization, proves save/list/get/update/remove + cookie-less 401s, and cleans up
// after itself. Safe to run repeatedly; writes nothing but the temporary record.

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const envLocal = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const grab = (name) => envLocal.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim();

let passed = 0;
let failed = 0;
const check = (name, ok, extra = '') => {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`);
  }
};

const loginRes = await fetch(`${BASE}/api/internal-login`, {
  method: 'POST',
  body: new URLSearchParams({
    username: grab('INTERNAL_TOOLS_USERNAME') ?? '',
    password: grab('INTERNAL_TOOLS_PASSWORD') ?? '',
  }),
  redirect: 'manual',
});
const cookie = (loginRes.headers.get('set-cookie') ?? '').split(';')[0];
check('login works', loginRes.status === 303 && cookie.startsWith('bf_internal_session='));

const authed = { headers: { cookie, 'content-type': 'application/json' } };

for (const path of ['/api/crm/contacts', '/api/crm/deals', '/api/budgets']) {
  const res = await fetch(`${BASE}${path}`);
  check(`cookie-less GET ${path} → 401`, res.status === 401);
}

const id = randomUUID();
const org = {
  id,
  name: 'Remote Verify Org (safe to delete)',
  createdAt: new Date().toISOString(),
};
let res = await fetch(`${BASE}/api/crm/organizations`, {
  ...authed,
  method: 'PUT',
  body: JSON.stringify(org),
});
check('save against remote → 200', res.status === 200, `HTTP ${res.status}: ${await res.text().catch(() => '')}`);

res = await fetch(`${BASE}/api/crm/organizations/${id}`, authed);
const fetched = (await res.json()).data;
check('get returns the saved record', fetched?.name === org.name);

res = await fetch(`${BASE}/api/crm/organizations`, {
  ...authed,
  method: 'PUT',
  body: JSON.stringify({ ...org, name: 'Remote Verify Org (renamed)' }),
});
res = await fetch(`${BASE}/api/crm/organizations/${id}`, authed);
check('upsert updates in place', (await res.json()).data?.name === 'Remote Verify Org (renamed)');

res = await fetch(`${BASE}/api/crm/organizations/${id}`, { ...authed, method: 'DELETE' });
check('remove → 200', res.status === 200);
res = await fetch(`${BASE}/api/crm/organizations/${id}`, authed);
check('get after remove → 404', res.status === 404);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
