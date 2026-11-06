/**
 * Registered Formats List
 * Explicit array of all platform-agnostic format definitions in the application.
 */

import { textPostFormat } from "./text-post";
import { threadFormat } from "./thread";
import { cardFormat } from "./card";
import { carouselFormat } from "./carousel";
import { FormatDefinition } from "../types";

export const ALL_FORMATS: FormatDefinition[] = [
  textPostFormat,
  threadFormat,
  cardFormat,
  carouselFormat,
];

