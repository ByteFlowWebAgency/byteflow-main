import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/internal-tools/session';

// THE shared gate for everything under /internal except the login page: the (protected)
// route group wraps the hub and every tool without touching their URLs. Defense-in-depth
// with src/middleware.ts, which gates the same paths before rendering — this layout is
// the backstop if the middleware matcher ever drifts.
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
  return <>{children}</>;
}
