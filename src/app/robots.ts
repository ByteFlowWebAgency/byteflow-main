import type { MetadataRoute } from 'next';

// Serves /robots.txt. The internal tools namespace and the API are not public surface:
// crawlers are told to stay out here, every /internal page additionally carries
// robots noindex metadata, and the real protection is the auth gate (middleware +
// (protected) layout + per-request session checks on the API routes). Everything else
// remains crawlable exactly as it was without a robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: ['/internal', '/api'],
    },
  };
}
