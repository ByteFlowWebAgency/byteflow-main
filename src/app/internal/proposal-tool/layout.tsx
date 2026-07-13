import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/proposal-tool/session';

// Defense-in-depth: the /internal middleware already gates this route, but the session
// is re-verified here so the tool never renders without one even if the middleware
// matcher ever drifts (07-INTEGRATION-AND-QA.md).
export default async function ProposalToolLayout({
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
