/**
 * Template Slot & Brand Token Resolver
 * Injects dynamic format slot values and brand kit tokens into template element properties.
 * System Layer: render
 */

import { Template, TemplateElement, TemplatePage, TextElement, ImageElement } from "../template-schema";

export interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontHeading: string;
  fontBody: string;
  logoUrl?: string;
  brandName?: string;
}

export const DEFAULT_BRAND_THEME: BrandTheme = {
  primaryColor: "#18181b",
  secondaryColor: "#2563eb",
  backgroundColor: "#ffffff",
  textColor: "#09090b",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
};

/**
 * Traverses an object path like "cover_slide.title", "body_slides.0.title", or "kicker".
 */
export function getNestedSlotValue(data: Record<string, unknown>, path?: string): string | undefined {
  if (!path) return undefined;
  const parts = path.split(".");
  let current: any = data;

  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[p];
  }

  if (typeof current === "string") return current;
  if (typeof current === "number") return String(current);
  return undefined;
}

/**
 * Resolves a color or font token like "$brand_primary" or "$font_heading".
 */
export function resolveThemeToken(token: string | undefined, theme: BrandTheme): string {
  if (!token) return "";
  switch (token) {
    case "$brand_primary":
      return theme.primaryColor;
    case "$brand_secondary":
      return theme.secondaryColor;
    case "$brand_background":
      return theme.backgroundColor;
    case "$brand_text":
      return theme.textColor;
    case "$font_heading":
      return theme.fontHeading;
    case "$font_body":
      return theme.fontBody;
    default:
      return token;
  }
}

/**
 * Resolves a template element with live slot data and brand styling.
 * Guaranteed never to leak template default text when real article data is present.
 */
export function resolveElement(
  element: TemplateElement,
  slotData: Record<string, unknown>,
  theme: BrandTheme = DEFAULT_BRAND_THEME
): TemplateElement {
  if (element.type === "text") {
    const boundText = getNestedSlotValue(slotData, element.slot);
    const hasSlotData = slotData != null && Object.keys(slotData).length > 0;

    let resolvedText: string;
    if (boundText !== undefined && boundText !== null) {
      resolvedText = boundText;
    } else if (element.slot === "attribution" && theme.brandName) {
      resolvedText = theme.brandName;
    } else if (element.slot && hasSlotData) {
      // Optional slot not provided by article data: resolve to empty, do not leak template placeholder
      resolvedText = "";
    } else {
      resolvedText = element.default_text || "";
    }

    const resolvedFont = resolveThemeToken(element.font_family, theme);
    const resolvedColor = resolveThemeToken(element.color, theme);

    return {
      ...element,
      default_text: resolvedText,
      font_family: resolvedFont || element.font_family,
      color: resolvedColor || element.color,
    } as TextElement;
  }

  if (element.type === "shape") {
    const resolvedFill = resolveThemeToken(element.fill, theme);
    const resolvedStroke = resolveThemeToken(element.stroke, theme);
    return {
      ...element,
      fill: resolvedFill || element.fill,
      stroke: resolvedStroke || element.stroke,
    };
  }

  if (element.type === "image") {
    const imgEl = element as ImageElement;
    const hasSlotData = slotData != null && Object.keys(slotData).length > 0;
    let resolvedUrl: string | undefined;

    if (imgEl.slot === "brand.logo" || imgEl.slot === "logo") {
      resolvedUrl = theme.logoUrl || (typeof slotData?.logo === "string" ? slotData.logo : undefined);
    } else if (imgEl.slot) {
      const candidate = getNestedSlotValue(slotData, imgEl.slot);
      if (candidate && !candidate.toLowerCase().includes("placeholder")) {
        resolvedUrl = candidate;
      } else if (imgEl.slot === "article_image" || imgEl.slot === "image") {
        const directImage = slotData.article_image;
        if (typeof directImage === "string" && directImage && !directImage.toLowerCase().includes("placeholder")) {
          resolvedUrl = directImage;
        } else {
          const images = slotData.in_article_images;
          if (Array.isArray(images) && images.length > 0) {
            const valid = images.find(
              (img): img is string => typeof img === "string" && !img.toLowerCase().includes("placeholder")
            );
            if (valid) resolvedUrl = valid;
          }
        }
      }
    }

    if (!resolvedUrl) {
      if (hasSlotData && imgEl.slot) {
        resolvedUrl = "";
      } else {
        resolvedUrl = imgEl.default_url || "";
      }
    }

    return {
      ...imgEl,
      default_url: resolvedUrl,
    } as ImageElement;
  }

  return element;
}

/**
 * Expands a 3-page base carousel template (Cover, Body prototype, Closing prototype)
 * into a dynamic N-page presentation matching the exact body_slides array in slotData.
 */
export function expandCarouselTemplate(
  baseTemplate: Template,
  slotData: Record<string, unknown>
): Template {
  const bodySlides = Array.isArray(slotData?.body_slides) ? (slotData.body_slides as any[]) : [];
  if (bodySlides.length === 0) {
    return baseTemplate;
  }

  const coverPrototype = baseTemplate.pages[0];
  const bodyPrototype = baseTemplate.pages[1] || baseTemplate.pages[0];
  const closingPrototype = baseTemplate.pages[2] || baseTemplate.pages[0];

  const pages: TemplatePage[] = [];

  // Page 0: Cover Slide
  if (coverPrototype) {
    pages.push({
      ...coverPrototype,
      page_index: 0,
    });
  }

  // Pages 1..N: One page per body slide
  bodySlides.forEach((slide, idx) => {
    const pageIndex = idx + 1;
    const clonedElements = bodyPrototype.elements.map((el): TemplateElement => {
      if (el.type === "text" || el.type === "image") {
        let mappedSlot = el.slot;
        if (el.slot && el.slot.startsWith("body_slide.")) {
          const field = el.slot.replace("body_slide.", "");
          mappedSlot = `body_slides.${idx}.${field}`;
        }
        return {
          ...el,
          id: `${el.id}-${pageIndex}`,
          slot: mappedSlot,
        } as TemplateElement;
      }
      return {
        ...el,
        id: `${el.id}-${pageIndex}`,
      };
    });

    pages.push({
      page_index: pageIndex,
      background: { ...bodyPrototype.background },
      elements: clonedElements,
    });
  });

  // Page N+1: Closing Slide
  if (closingPrototype) {
    pages.push({
      ...closingPrototype,
      page_index: bodySlides.length + 1,
    });
  }

  return {
    ...baseTemplate,
    pages,
  };
}
