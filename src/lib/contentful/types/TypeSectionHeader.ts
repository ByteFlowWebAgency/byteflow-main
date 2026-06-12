import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeSectionHeader'
 * @name TypeSectionHeaderFields
 * @type {TypeSectionHeaderFields}
 * @memberof TypeSectionHeader
 */
export interface TypeSectionHeaderFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'eyebrow' (Eyebrow)
     * @name Eyebrow
     * @localized false
     */
    eyebrow?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'heading' (Heading)
     * @name Heading
     * @localized false
     */
    heading?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'subText' (Sub Text)
     * @name Sub Text
     * @localized false
     */
    subText?: EntryFieldTypes.Symbol;
}

/**
 * Entry skeleton type definition for content type 'sectionHeader' (Section Header)
 * @name TypeSectionHeaderSkeleton
 * @type {TypeSectionHeaderSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:22:51.917Z
 * @version 1
 */
export type TypeSectionHeaderSkeleton = EntrySkeletonType<TypeSectionHeaderFields, "sectionHeader">;
/**
 * Entry type definition for content type 'sectionHeader' (Section Header)
 * @name TypeSectionHeader
 * @type {TypeSectionHeader}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:22:51.917Z
 * @version 1
 */
export type TypeSectionHeader<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeSectionHeaderSkeleton, Modifiers, Locales>;

export function isTypeSectionHeader<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeSectionHeader<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'sectionHeader'
}

export type TypeSectionHeaderWithoutLinkResolutionResponse = TypeSectionHeader<"WITHOUT_LINK_RESOLUTION">;
export type TypeSectionHeaderWithoutUnresolvableLinksResponse = TypeSectionHeader<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeSectionHeaderWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeSectionHeader<"WITH_ALL_LOCALES", Locales>;
export type TypeSectionHeaderWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeSectionHeader<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeSectionHeaderWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeSectionHeader<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
