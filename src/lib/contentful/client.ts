import { createClient, type ContentfulClientApi } from 'contentful';

const clientCache: {
  published?: ContentfulClientApi<undefined>;
  preview?: ContentfulClientApi<undefined>;
} = {};

export const getContentfulClient = (isDraft?: boolean) => {
  const cacheKey = isDraft ? "preview" : "published";
  const cached = clientCache[cacheKey];
  if (cached) {
    return cached;
  }

  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("CONTENTFUL_ACCESS_TOKEN must be set");
  }
  if (!process.env.CONTENTFUL_SPACE_ID) {
    throw new Error("CONTENTFUL_SPACE_ID must be set");
  }

  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken,
    host: isDraft ? "preview.contentful.com" : "cdn.contentful.com",
  });

  clientCache[cacheKey] = client;

  return client;
};
