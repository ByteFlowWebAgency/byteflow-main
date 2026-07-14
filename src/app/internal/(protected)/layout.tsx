import { redirect } from 'next/navigation';
import { getCurrentInternalUser } from '@/lib/internal-tools/auth/server';
import '@/components/internal-tools/tokens.css';
import InternalHeader from '@/components/internal-tools/InternalHeader';
import InternalFooter from '@/components/internal-tools/InternalFooter';
import shell from '@/components/internal-tools/InternalShell.module.css';

// THE gate + chrome for everything under /internal except the login/signup pages. The
// (protected) route group wraps the hub and every tool: it checks the Supabase Auth
// session (defense in depth with src/middleware.ts) and then renders the internal app
// shell — its own header and footer, independent of the marketing site's
// Contentful-driven chrome.
export default async function InternalToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentInternalUser();
  if (!user) {
    redirect('/internal/login');
  }

  return (
    <div className={`bfScope ${shell.shell}`}>
      {/* Pre-paint chrome-mode restore: light chrome (bf-app-dark-mode=false) must not
          flash dark on load. Chrome only — documents pin their own variables inline. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(localStorage.getItem('bf-app-dark-mode')==='false')document.documentElement.setAttribute('data-bf-chrome','light')}catch(e){}",
        }}
      />
      <InternalHeader email={user.email ?? ''} />
      <div className={shell.main}>{children}</div>
      <InternalFooter year={new Date().getFullYear()} />
    </div>
  );
}
