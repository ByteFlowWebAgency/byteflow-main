/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "images.prismic.io" },
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "images.ctfassets.net" },
        ],
    },
};

export default nextConfig;
