import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeNavLink'
 * @name TypeNavLinkFields
 * @type {TypeNavLinkFields}
 * @memberof TypeNavLink
 */
export interface TypeNavLinkFields {
    /**
     * Field type definition for field 'label' (Label)
     * @name Label
     * @localized false
     */
    label?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'url' (URL)
     * @name URL
     * @localized false
     */
    url?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'openInNewTab' (Open In New Tab)
     * @name Open In New Tab
     * @localized false
     */
    openInNewTab?: EntryFieldTypes.Boolean;
}

/**
 * Entry skeleton type definition for content type 'navLink' (Nav Link)
 * @name TypeNavLinkSkeleton
 * @type {TypeNavLinkSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:46:30.456Z
 * @version 3
 */
export type TypeNavLinkSkeleton = EntrySkeletonType<TypeNavLinkFields, "navLink">;
/**
 * Entry type definition for content type 'navLink' (Nav Link)
 * @name TypeNavLink
 * @type {TypeNavLink}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:46:30.456Z
 * @version 3
 */
export type TypeNavLink<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeNavLinkSkeleton, Modifiers, Locales>;

export function isTypeNavLink<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeNavLink<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'navLink'
}

export type TypeNavLinkWithoutLinkResolutionResponse = TypeNavLink<"WITHOUT_LINK_RESOLUTION">;
export type TypeNavLinkWithoutUnresolvableLinksResponse = TypeNavLink<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeNavLinkWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeNavLink<"WITH_ALL_LOCALES", Locales>;
export type TypeNavLinkWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeNavLink<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeNavLinkWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeNavLink<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
