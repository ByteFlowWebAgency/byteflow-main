import type { Metadata } from 'next';
import Link from 'next/link';
import '@/components/internal-tools/tokens.css';
// Shared with /internal/login — same card/form styling, one auth surface.
import styles from '../login/login.module.css';
import { ALLOWED_SIGNUP_DOMAIN } from '@/lib/internal-tools/auth/env';

export const metadata: Metadata = {
  title: 'Sign up · ByteFlow Internal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const ERROR_COPY: Record<string, string> = {
  domain: `Sign-up is restricted to @${ALLOWED_SIGNUP_DOMAIN} email addresses.`,
  exists: 'An account with that email already exists — sign in instead.',
  weak: 'Password must be at least 8 characters.',
  mismatch: 'Passwords do not match.',
};

// Plain server-rendered form, zero client JS — mirrors /internal/login. The domain
// check happens server-side in /api/internal-signup (and again, as defense in depth, in
// a Postgres trigger on auth.users) — never trust a client-side check alone for a route
// gating access to internal tools.
export default async function InternalSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={`bfScope ${styles.page}`}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>ByteFlow Internal</p>
        <h1 className={styles.heading}>Create an account</h1>

        <form method="post" action="/api/internal-signup" className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>
              Work email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={`you@${ALLOWED_SIGNUP_DOMAIN}`}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-password" className={styles.label}>
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-confirm" className={styles.label}>
              Confirm password
            </label>
            <input
              id="signup-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={styles.input}
            />
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {ERROR_COPY[error] ?? 'Could not create that account.'}
            </p>
          )}

          <button type="submit" className={styles.submit}>
            Sign up
          </button>
        </form>

        <p className={styles.switchLine}>
          Already have an account? <Link href="/internal/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
