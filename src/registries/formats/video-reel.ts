/**
 * Video Reel Format Definition
 * Vertical 9:16 video clip with burned karaoke captions, smart framing, and social hook text.
 */

import { z } from "zod";
import { FormatDefinition } from "../types";

export const VideoReelSlotSchema = z.object({
  hook_title: z.string().min(5).max(120),
  video_url: z.string().url().or(z.string().min(1)),
  duration_seconds: z.number().positive(),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  caption_transcript: z.string().min(10),
  aspect_ratio: z.literal("9:16"),
  template_id: z.string().optional(),
  storage_key: z.string().optional(),
  thumbnail_url: z.string().optional(),
  source_item_ids: z.array(z.string()).default([]),
});

export type VideoReelSlots = z.infer<typeof VideoReelSlotSchema>;

export const videoReelFormat: FormatDefinition = {
  id: "video-reel",
  name: "Short Video Reel",
  description: "Vertical 9:16 video clip with burned active-word subtitles, smart speaker framing, and hook headline.",
  mediaType: "video",
  slotSchema: VideoReelSlotSchema,
  promptTemplateGuidance: "Select standalone, compelling spoken segments with a clear hook and conclusion for vertical reels.",
};
