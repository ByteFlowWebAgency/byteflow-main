import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/internal-tools/session';
import '@/components/internal-tools/tokens.css';
import InternalHeader from '@/components/internal-tools/InternalHeader';
import InternalFooter from '@/components/internal-tools/InternalFooter';
import shell from '@/components/internal-tools/InternalShell.module.css';

// THE gate + chrome for everything under /internal except the login page. The (protected)
// route group wraps the hub and every tool: it checks the session cookie (defense in
// depth with src/middleware.ts) and then renders the internal app shell — its own
// header and footer, independent of the marketing site's Contentful-driven chrome.
export default async function InternalToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authenticated = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!authenticated) {
    redirect('/internal/login');
  }

  return (
    <div className={`bfScope ${shell.shell}`}>
      <InternalHeader />
      <div className={shell.main}>{children}</div>
      <InternalFooter year={new Date().getFullYear()} />
    </div>
  );
}
