import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeNavLinkSkeleton } from "./TypeNavLink";

/**
 * Fields type definition for content type 'TypeFooterColumn'
 * @name TypeFooterColumnFields
 * @type {TypeFooterColumnFields}
 * @memberof TypeFooterColumn
 */
export interface TypeFooterColumnFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'title' (Title)
     * @name Title
     * @localized false
     */
    title?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'links' (Links)
     * @name Links
     * @localized false
     */
    links?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeNavLinkSkeleton>>;
}

/**
 * Entry skeleton type definition for content type 'footerColumn' (Footer Column)
 * @name TypeFooterColumnSkeleton
 * @type {TypeFooterColumnSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:50:59.043Z
 * @version 5
 */
export type TypeFooterColumnSkeleton = EntrySkeletonType<TypeFooterColumnFields, "footerColumn">;
/**
 * Entry type definition for content type 'footerColumn' (Footer Column)
 * @name TypeFooterColumn
 * @type {TypeFooterColumn}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:50:59.043Z
 * @version 5
 */
export type TypeFooterColumn<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeFooterColumnSkeleton, Modifiers, Locales>;

export function isTypeFooterColumn<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeFooterColumn<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'footerColumn'
}

export type TypeFooterColumnWithoutLinkResolutionResponse = TypeFooterColumn<"WITHOUT_LINK_RESOLUTION">;
export type TypeFooterColumnWithoutUnresolvableLinksResponse = TypeFooterColumn<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeFooterColumnWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeFooterColumn<"WITH_ALL_LOCALES", Locales>;
export type TypeFooterColumnWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeFooterColumn<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeFooterColumnWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeFooterColumn<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
