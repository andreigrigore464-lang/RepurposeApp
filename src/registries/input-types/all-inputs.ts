/**
 * Registered Input Types List
 * Explicit array of all input sources registered in the application.
 */

import { rssInput } from "./rss";
import { manualUrlInput } from "./manual-url";
import { InputTypeDefinition } from "../types";

export const ALL_INPUTS: InputTypeDefinition[] = [
  rssInput,
  manualUrlInput,
];

