/**
 * Video Upload Input Type Definition
 * Represents direct user-uploaded media files (.mp4, .mov) via Cloudflare R2 presigned URLs.
 */

import { InputTypeDefinition } from "../types";

export const videoUploadInput: InputTypeDefinition = {
  id: "video-upload",
  name: "Direct Video Upload",
  description: "Processes user-uploaded MP4 or MOV files directly uploaded to Cloudflare R2 storage.",
  requiresUrl: false,
  supportsPolling: false,
};

