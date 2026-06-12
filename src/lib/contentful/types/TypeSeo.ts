import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeSeo'
 * @name TypeSeoFields
 * @type {TypeSeoFields}
 * @memberof TypeSeo
 */
export interface TypeSeoFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'metaTitle' (Meta Title)
     * @name Meta Title
     * @localized false
     */
    metaTitle?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'metaDescription' (Meta Description)
     * @name Meta Description
     * @localized false
     */
    metaDescription?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'ogTitle' (OG Title)
     * @name OG Title
     * @localized false
     */
    ogTitle?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'ogDescription' (OG Description)
     * @name OG Description
     * @localized false
     */
    ogDescription?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'ogImage' (OG Image)
     * @name OG Image
     * @localized false
     */
    ogImage?: EntryFieldTypes.AssetLink;
    /**
     * Field type definition for field 'canonicalUrl' (Canonical URL)
     * @name Canonical URL
     * @localized false
     */
    canonicalUrl?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'noIndex' (No Index)
     * @name No Index
     * @localized false
     */
    noIndex?: EntryFieldTypes.Boolean;
    /**
     * Field type definition for field 'structuredData' (Structured Data)
     * @name Structured Data
     * @localized false
     */
    structuredData?: EntryFieldTypes.Object;
}

/**
 * Entry skeleton type definition for content type 'seo' (SEO)
 * @name TypeSeoSkeleton
 * @type {TypeSeoSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:41:48.777Z
 * @version 1
 */
export type TypeSeoSkeleton = EntrySkeletonType<TypeSeoFields, "seo">;
/**
 * Entry type definition for content type 'seo' (SEO)
 * @name TypeSeo
 * @type {TypeSeo}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:41:48.777Z
 * @version 1
 */
export type TypeSeo<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeSeoSkeleton, Modifiers, Locales>;

export function isTypeSeo<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeSeo<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'seo'
}

export type TypeSeoWithoutLinkResolutionResponse = TypeSeo<"WITHOUT_LINK_RESOLUTION">;
export type TypeSeoWithoutUnresolvableLinksResponse = TypeSeo<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeSeoWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeSeo<"WITH_ALL_LOCALES", Locales>;
export type TypeSeoWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeSeo<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeSeoWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeSeo<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
