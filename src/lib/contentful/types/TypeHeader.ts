import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeNavLinkSkeleton } from "./TypeNavLink";

/**
 * Fields type definition for content type 'TypeHeader'
 * @name TypeHeaderFields
 * @type {TypeHeaderFields}
 * @memberof TypeHeader
 */
export interface TypeHeaderFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'logo' (Logo)
     * @name Logo
     * @localized false
     */
    logo?: EntryFieldTypes.AssetLink;
    /**
     * Field type definition for field 'navLinks' (Nav Links)
     * @name Nav Links
     * @localized false
     */
    navLinks?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeNavLinkSkeleton>>;
    /**
     * Field type definition for field 'ctaButton' (CTA Button)
     * @name CTA Button
     * @localized false
     */
    ctaButton?: EntryFieldTypes.EntryLink<TypeNavLinkSkeleton>;
}

/**
 * Entry skeleton type definition for content type 'header' (Header)
 * @name TypeHeaderSkeleton
 * @type {TypeHeaderSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:44:13.558Z
 * @version 15
 */
export type TypeHeaderSkeleton = EntrySkeletonType<TypeHeaderFields, "header">;
/**
 * Entry type definition for content type 'header' (Header)
 * @name TypeHeader
 * @type {TypeHeader}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:44:13.558Z
 * @version 15
 */
export type TypeHeader<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeHeaderSkeleton, Modifiers, Locales>;

export function isTypeHeader<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeHeader<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'header'
}

export type TypeHeaderWithoutLinkResolutionResponse = TypeHeader<"WITHOUT_LINK_RESOLUTION">;
export type TypeHeaderWithoutUnresolvableLinksResponse = TypeHeader<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeHeaderWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeHeader<"WITH_ALL_LOCALES", Locales>;
export type TypeHeaderWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeHeader<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeHeaderWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeHeader<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
