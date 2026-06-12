import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeFooterColumnSkeleton } from "./TypeFooterColumn";

/**
 * Fields type definition for content type 'TypeFooter'
 * @name TypeFooterFields
 * @type {TypeFooterFields}
 * @memberof TypeFooter
 */
export interface TypeFooterFields {
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
     * Field type definition for field 'tagline' (Tagline)
     * @name Tagline
     * @localized false
     */
    tagline?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'columns' (Columns)
     * @name Columns
     * @localized false
     */
    columns?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeFooterColumnSkeleton>>;
    /**
     * Field type definition for field 'copyrightText' (Copyright Text)
     * @name Copyright Text
     * @localized false
     */
    copyrightText?: EntryFieldTypes.Symbol;
}

/**
 * Entry skeleton type definition for content type 'footer' (Footer)
 * @name TypeFooterSkeleton
 * @type {TypeFooterSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:52:06.752Z
 * @version 1
 */
export type TypeFooterSkeleton = EntrySkeletonType<TypeFooterFields, "footer">;
/**
 * Entry type definition for content type 'footer' (Footer)
 * @name TypeFooter
 * @type {TypeFooter}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:52:06.752Z
 * @version 1
 */
export type TypeFooter<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeFooterSkeleton, Modifiers, Locales>;

export function isTypeFooter<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeFooter<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'footer'
}

export type TypeFooterWithoutLinkResolutionResponse = TypeFooter<"WITHOUT_LINK_RESOLUTION">;
export type TypeFooterWithoutUnresolvableLinksResponse = TypeFooter<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeFooterWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeFooter<"WITH_ALL_LOCALES", Locales>;
export type TypeFooterWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeFooter<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeFooterWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeFooter<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
