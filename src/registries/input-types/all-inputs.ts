/**
 * Registered Input Types List
 * Explicit array of all content sources supported by the application.
 */

import { rssInput } from "./rss";
import { manualUrlInput } from "./manual-url";
import { youtubeInput } from "./youtube";
import { videoUploadInput } from "./video-upload";
import { InputTypeDefinition } from "../types";

export const ALL_INPUTS: InputTypeDefinition[] = [
  rssInput,
  manualUrlInput,
  youtubeInput,
  videoUploadInput,
];
