import { describe, it, expect } from "vitest";
import { TemplateSchema } from "./template-schema";

describe("Template Schema Validation", () => {
  it("validates a standard 1080x1080 social card template", () => {
    const cardTemplate = {
      id: "test-card",
      format: "card",
      name: "Minimalist Card",
      dimensions: {
        width: 1080,
        height: 1080,
      },
      pages: [
        {
          page_index: 0,
          background: {
            color: "#ffffff",
          },
          elements: [
            {
              id: "headline",
              type: "text",
              x: 100,
              y: 100,
              width: 880,
              height: 200,
              font_size: 48,
              font_weight: "bold",
              color: "#111827",
              default_text: "Sample Headline",
            },
          ],
        },
      ],
    };

    const parsed = TemplateSchema.safeParse(cardTemplate);
    expect(parsed.success).toBe(true);
  });

  it("validates a 9:16 video reel template with video and captions layers", () => {
    const reelTemplate = {
      id: "test-reel",
      format: "video-reel",
      name: "Reel Framing",
      dimensions: {
        width: 1080,
        height: 1920,
      },
      pages: [
        {
          page_index: 0,
          background: {
            color: "#000000",
          },
          elements: [
            {
              id: "video-slot",
              type: "video",
              x: 0,
              y: 200,
              width: 1080,
              height: 1520,
              framing_mode: "dynamic_tracking",
            },
            {
              id: "captions",
              type: "captions",
              x: 80,
              y: 1300,
              width: 920,
              height: 300,
              font_family: "Anton",
              font_size: 72,
              primary_color: "#ffffff",
              highlight_color: "#eab308",
            },
          ],
        },
      ],
    };

    const parsed = TemplateSchema.safeParse(reelTemplate);
    expect(parsed.success).toBe(true);
  });

  it("rejects templates with invalid dimensions", () => {
    const invalidTemplate = {
      id: "bad-template",
      format: "card",
      name: "Bad Template",
      dimensions: {
        width: -1080, // invalid negative dimension
        height: 1080,
      },
      pages: [],
    };

    const parsed = TemplateSchema.safeParse(invalidTemplate);
    expect(parsed.success).toBe(false);
  });
});
