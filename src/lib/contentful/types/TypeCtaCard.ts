import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeNavLinkSkeleton } from "./TypeNavLink";

/**
 * Fields type definition for content type 'TypeCtaCard'
 * @name TypeCtaCardFields
 * @type {TypeCtaCardFields}
 * @memberof TypeCtaCard
 */
export interface TypeCtaCardFields {
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
 * Entry skeleton type definition for content type 'ctaCard' (CTA Card)
 * @name TypeCtaCardSkeleton
 * @type {TypeCtaCardSkeleton}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:04:40.060Z
 * @version 1
 */
export type TypeCtaCardSkeleton = EntrySkeletonType<TypeCtaCardFields, "ctaCard">;
/**
 * Entry type definition for content type 'ctaCard' (CTA Card)
 * @name TypeCtaCard
 * @type {TypeCtaCard}
 * @author 5ysrXkNSKQJJcrbYtc8Yxs
 * @since 2026-06-12T02:04:40.060Z
 * @version 1
 */
export type TypeCtaCard<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeCtaCardSkeleton, Modifiers, Locales>;

export function isTypeCtaCard<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeCtaCard<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'ctaCard'
}

export type TypeCtaCardWithoutLinkResolutionResponse = TypeCtaCard<"WITHOUT_LINK_RESOLUTION">;
export type TypeCtaCardWithoutUnresolvableLinksResponse = TypeCtaCard<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeCtaCardWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeCtaCard<"WITH_ALL_LOCALES", Locales>;
export type TypeCtaCardWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeCtaCard<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeCtaCardWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeCtaCard<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
