import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeCaseStudySkeleton } from "./TypeCaseStudy";
import type { TypeFeatureCardSkeleton } from "./TypeFeatureCard";
import type { TypeSectionHeaderSkeleton } from "./TypeSectionHeader";

/**
 * Fields type definition for content type 'TypeSection'
 * @name TypeSectionFields
 * @type {TypeSectionFields}
 * @memberof TypeSection
 */
export interface TypeSectionFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'header' (Header)
     * @name Header
     * @localized false
     */
    header?: EntryFieldTypes.EntryLink<TypeSectionHeaderSkeleton>;
    /**
     * Field type definition for field 'cards' (Cards)
     * @name Cards
     * @localized false
     */
    cards?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeCaseStudySkeleton | TypeFeatureCardSkeleton>>;
    /**
     * Field type definition for field 'variant' (Variant)
     * @name Variant
     * @localized false
     */
    variant?: EntryFieldTypes.Symbol;
}

/**
 * Entry skeleton type definition for content type 'section' (Section)
 * @name TypeSectionSkeleton
 * @type {TypeSectionSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:23:57.304Z
 * @version 3
 */
export type TypeSectionSkeleton = EntrySkeletonType<TypeSectionFields, "section">;
/**
 * Entry type definition for content type 'section' (Section)
 * @name TypeSection
 * @type {TypeSection}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:23:57.304Z
 * @version 3
 */
export type TypeSection<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeSectionSkeleton, Modifiers, Locales>;

export function isTypeSection<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeSection<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'section'
}

export type TypeSectionWithoutLinkResolutionResponse = TypeSection<"WITHOUT_LINK_RESOLUTION">;
export type TypeSectionWithoutUnresolvableLinksResponse = TypeSection<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeSectionWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeSection<"WITH_ALL_LOCALES", Locales>;
export type TypeSectionWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeSection<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeSectionWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeSection<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
