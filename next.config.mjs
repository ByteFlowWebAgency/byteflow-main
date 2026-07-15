/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "images.prismic.io" },
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "images.ctfassets.net" },
        ],
    },
    // pptxgenjs (Presentations tool, client-side .pptx export) has two guarded, runtime-only
    // `await import('node:fs')` / `await import('node:https')` calls used solely on its
    // Node.js codepath (writing a file straight to disk, fetching a remote image URL) — both
    // unreachable in a browser. Neither the package's own "browser" field (maps bare "fs",
    // not the "node:"-scheme form actually used) nor `resolve.fallback`/`resolve.alias`
    // (both tested; webpack5 doesn't apply either to a *dynamic* `import()` target) stop
    // webpack from still trying to statically resolve them at build time, which hard-fails
    // the client build even though the code would never run. IgnorePlugin is the correct
    // mechanism for a guarded-but-unreachable dynamic import: it replaces the import target
    // with an empty module instead of resolving it, without touching server-side rendering
    // (only added to the client compilation).
    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^node:(fs|https)$/ }));
        }
        return config;
    },
};

export default nextConfig;
