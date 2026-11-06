/**
 * Registered Platforms List
 * Explicit array of all platform constraint definitions registered in the application.
 */

import { linkedinPlatform } from "./linkedin";
import { xPlatform } from "./x";
import { instagramPlatform } from "./instagram";
import { facebookPlatform } from "./facebook";
import { threadsPlatform } from "./threads";
import { PlatformDefinition } from "../types";

export const ALL_PLATFORMS: PlatformDefinition[] = [
  linkedinPlatform,
  xPlatform,
  instagramPlatform,
  facebookPlatform,
  threadsPlatform,
];

