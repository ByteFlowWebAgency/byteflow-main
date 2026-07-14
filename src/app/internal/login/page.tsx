import type { Metadata } from 'next';
import Link from 'next/link';
import '@/components/internal-tools/tokens.css';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Sign in · ByteFlow Internal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Plain server-rendered form, zero client JS. Credentials are only ever compared
// server-side (Supabase Auth, in /api/internal-login); the error flag is a generic one
// by design.
export default async function InternalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={`bfScope ${styles.page}`}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>ByteFlow Internal</p>
        <h1 className={styles.heading}>Sign in</h1>

        <form method="post" action="/api/internal-login" className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>
              Work email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={styles.input}
            />
          </div>

          {error && (
            <p className={styles.error} role="alert">
              Invalid email or password.
            </p>
          )}

          <button type="submit" className={styles.submit}>
            Sign in
          </button>
        </form>

        <p className={styles.switchLine}>
          Need an account? <Link href="/internal/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
