/**
 * Registered Digest Kinds List
 * Explicit array of all digest factual categories registered in the application.
 */

import { coreThesisKind } from "./core-thesis";
import { keyTakeawayKind } from "./key-takeaway";
import { statisticOrDataKind } from "./statistic-or-data";
import { directQuoteKind } from "./direct-quote";
import { counterIntuitiveInsightKind } from "./counter-intuitive-insight";
import { problemContextKind } from "./problem-context";
import { solutionExampleKind } from "./solution-example";
import { DigestKindDefinition } from "../types";

export const ALL_DIGEST_KINDS: DigestKindDefinition[] = [
  coreThesisKind,
  keyTakeawayKind,
  statisticOrDataKind,
  directQuoteKind,
  counterIntuitiveInsightKind,
  problemContextKind,
  solutionExampleKind,
];

