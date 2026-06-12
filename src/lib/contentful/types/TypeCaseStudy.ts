import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeCaseStudy'
 * @name TypeCaseStudyFields
 * @type {TypeCaseStudyFields}
 * @memberof TypeCaseStudy
 */
export interface TypeCaseStudyFields {
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
     * Field type definition for field 'category' (Category)
     * @name Category
     * @localized false
     */
    category?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'description' (Description)
     * @name Description
     * @localized false
     */
    description?: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'thumbnail' (Thumbnail)
     * @name Thumbnail
     * @localized false
     */
    thumbnail?: EntryFieldTypes.AssetLink;
    /**
     * Field type definition for field 'url' (URL)
     * @name URL
     * @localized false
     */
    url?: EntryFieldTypes.Symbol;
}

/**
 * Entry skeleton type definition for content type 'caseStudy' (Case Study)
 * @name TypeCaseStudySkeleton
 * @type {TypeCaseStudySkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:16:23.782Z
 * @version 1
 */
export type TypeCaseStudySkeleton = EntrySkeletonType<TypeCaseStudyFields, "caseStudy">;
/**
 * Entry type definition for content type 'caseStudy' (Case Study)
 * @name TypeCaseStudy
 * @type {TypeCaseStudy}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:16:23.782Z
 * @version 1
 */
export type TypeCaseStudy<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeCaseStudySkeleton, Modifiers, Locales>;

export function isTypeCaseStudy<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeCaseStudy<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'caseStudy'
}

export type TypeCaseStudyWithoutLinkResolutionResponse = TypeCaseStudy<"WITHOUT_LINK_RESOLUTION">;
export type TypeCaseStudyWithoutUnresolvableLinksResponse = TypeCaseStudy<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeCaseStudyWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeCaseStudy<"WITH_ALL_LOCALES", Locales>;
export type TypeCaseStudyWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeCaseStudy<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeCaseStudyWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeCaseStudy<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
