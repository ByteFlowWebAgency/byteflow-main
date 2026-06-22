import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeFeatureCard'
 * @name TypeFeatureCardFields
 * @type {TypeFeatureCardFields}
 * @memberof TypeFeatureCard
 */
export interface TypeFeatureCardFields {
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
     * Field type definition for field 'title' (Title)
     * @name Title
     * @localized false
     */
    title?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'tagline' (Tagline)
     * @name Tagline
     * @localized false
     */
    tagline?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'description' (Description)
     * @name Description
     * @localized false
     */
    description?: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'icon' (Icon)
     * @name Icon
     * @localized false
     */
    icon?: EntryFieldTypes.AssetLink;
    /**
     * Field type definition for field 'bullets' (Bullets)
     * @name Bullets
     * @localized false
     */
    bullets?: EntryFieldTypes.Array<EntryFieldTypes.Symbol>;
}

/**
 * Entry skeleton type definition for content type 'featureCard' (Feature Card)
 * @name TypeFeatureCardSkeleton
 * @type {TypeFeatureCardSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:14:05.912Z
 * @version 1
 */
export type TypeFeatureCardSkeleton = EntrySkeletonType<TypeFeatureCardFields, "featureCard">;
/**
 * Entry type definition for content type 'featureCard' (Feature Card)
 * @name TypeFeatureCard
 * @type {TypeFeatureCard}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:14:05.912Z
 * @version 1
 */
export type TypeFeatureCard<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeFeatureCardSkeleton, Modifiers, Locales>;

export function isTypeFeatureCard<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeFeatureCard<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'featureCard'
}

export type TypeFeatureCardWithoutLinkResolutionResponse = TypeFeatureCard<"WITHOUT_LINK_RESOLUTION">;
export type TypeFeatureCardWithoutUnresolvableLinksResponse = TypeFeatureCard<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeFeatureCardWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeFeatureCard<"WITH_ALL_LOCALES", Locales>;
export type TypeFeatureCardWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeFeatureCard<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeFeatureCardWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeFeatureCard<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
