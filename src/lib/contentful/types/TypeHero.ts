import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeNavLinkSkeleton } from "./TypeNavLink";

/**
 * Fields type definition for content type 'TypeHero'
 * @name TypeHeroFields
 * @type {TypeHeroFields}
 * @memberof TypeHero
 */
export interface TypeHeroFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'heading' (Heading)
     * @name Heading
     * @localized false
     */
    heading?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'eyebrow' (Eyebrow)
     * @name Eyebrow
     * @localized false
     */
    eyebrow?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'subText' (Sub text)
     * @name Sub text
     * @localized false
     */
    subText?: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'primaryCta' (Primary CTA)
     * @name Primary CTA
     * @localized false
     */
    primaryCta?: EntryFieldTypes.EntryLink<TypeNavLinkSkeleton>;
    /**
     * Field type definition for field 'secondaryCta' (Secondary CTA)
     * @name Secondary CTA
     * @localized false
     */
    secondaryCta?: EntryFieldTypes.EntryLink<TypeNavLinkSkeleton>;
}

/**
 * Entry skeleton type definition for content type 'hero' (Hero)
 * @name TypeHeroSkeleton
 * @type {TypeHeroSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:53:52.308Z
 * @version 17
 */
export type TypeHeroSkeleton = EntrySkeletonType<TypeHeroFields, "hero">;
/**
 * Entry type definition for content type 'hero' (Hero)
 * @name TypeHero
 * @type {TypeHero}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T01:53:52.308Z
 * @version 17
 */
export type TypeHero<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeHeroSkeleton, Modifiers, Locales>;

export function isTypeHero<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeHero<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'hero'
}

export type TypeHeroWithoutLinkResolutionResponse = TypeHero<"WITHOUT_LINK_RESOLUTION">;
export type TypeHeroWithoutUnresolvableLinksResponse = TypeHero<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeHeroWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeHero<"WITH_ALL_LOCALES", Locales>;
export type TypeHeroWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeHero<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeHeroWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeHero<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
