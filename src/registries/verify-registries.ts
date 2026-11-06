/**
 * Registry Verification & Test Script
 * 1. Loads and validates all live registry definitions and matrix routes.
 * 2. Prints all valid Input -> Format -> Platform paths.
 * 3. Deliberately injects invalid definitions to verify that startup fails with clear errors.
 */

import { loadAndValidateRegistries, RegistryValidationError } from "./load-registries";
import { getAllMatrixPaths } from "./matrix";
import { ALL_INPUTS } from "./input-types/all-inputs";
import { ALL_DIGEST_KINDS } from "./digest-kinds/all-digest-kinds";
import { ALL_FORMATS } from "./formats/all-formats";
import { ALL_PLATFORMS } from "./platforms/all-platforms";
import { MATRIX_DEFINITION } from "./matrix";

function runVerification() {
  console.log("==================================================");
  console.log("       PHASE 2: REGISTRY VALIDATION TEST          ");
  console.log("==================================================");

  // 1. Validate Live Registries
  console.log("\n[1/3] Validating Live Registries...");
  const loaded = loadAndValidateRegistries();
  console.log(`✓ Successfully loaded ${loaded.inputs.size} Inputs: [${Array.from(loaded.inputs.keys()).join(", ")}]`);
  console.log(`✓ Successfully loaded ${loaded.digestKinds.size} Digest Kinds: [${Array.from(loaded.digestKinds.keys()).join(", ")}]`);
  console.log(`✓ Successfully loaded ${loaded.formats.size} Formats: [${Array.from(loaded.formats.keys()).join(", ")}]`);
  console.log(`✓ Successfully loaded ${loaded.platforms.size} Platforms: [${Array.from(loaded.platforms.keys()).join(", ")}]`);

  // 2. Print All Matrix Paths
  console.log("\n[2/3] Printing All Permissible Matrix Paths (Input -> Format -> Platform)...");
  const paths = getAllMatrixPaths();
  console.log(`Total valid paths through matrix: ${paths.length}\n`);

  // Format as a clean table
  console.log("| #  | Input Source  | Content Format | Destination Platform |");
  console.log("|----|---------------|----------------|----------------------|");
  paths.forEach((p, idx) => {
    const num = String(idx + 1).padStart(2, " ");
    const input = p.input.padEnd(13, " ");
    const format = p.format.padEnd(14, " ");
    const platform = p.platform.padEnd(20, " ");
    console.log(`| ${num} | ${input} | ${format} | ${platform} |`);
  });

  // 3. Negative Tests: Deliberately Broken Registries
  console.log("\n[3/3] Testing Startup Failure On Broken Definitions...");

  // Test 3a: Invalid Schema Field
  let caughtSchemaError = false;
  try {
    const brokenInputs = [
      ...ALL_INPUTS,
      { id: "invalid-input", name: "", description: "Missing fields" },
    ];
    loadAndValidateRegistries(brokenInputs as any);
  } catch (err) {
    if (err instanceof RegistryValidationError) {
      caughtSchemaError = true;
      console.log(`✓ Correctly caught invalid schema: "${err.message}"`);
    } else {
      throw err;
    }
  }
  if (!caughtSchemaError) {
    throw new Error("FAILED: Expected schema error for invalid input was not thrown!");
  }

  // Test 3b: Duplicate Entity ID
  let caughtDuplicateError = false;
  try {
    const duplicatePlatforms = [...ALL_PLATFORMS, ALL_PLATFORMS[0]];
    loadAndValidateRegistries(undefined, undefined, undefined, duplicatePlatforms);
  } catch (err) {
    if (err instanceof RegistryValidationError) {
      caughtDuplicateError = true;
      console.log(`✓ Correctly caught duplicate ID: "${err.message}"`);
    } else {
      throw err;
    }
  }
  if (!caughtDuplicateError) {
    throw new Error("FAILED: Expected duplicate ID error was not thrown!");
  }

  // Test 3c: Broken Matrix Reference (Non-existent platform)
  let caughtMatrixError = false;
  try {
    const brokenMatrix = {
      ...MATRIX_DEFINITION,
      formatToPlatforms: {
        ...MATRIX_DEFINITION.formatToPlatforms,
        "text-post": ["non-existent-platform"],
      },
    };
    loadAndValidateRegistries(undefined, undefined, undefined, undefined, brokenMatrix);
  } catch (err) {
    if (err instanceof RegistryValidationError) {
      caughtMatrixError = true;
      console.log(`✓ Correctly caught broken matrix mapping: "${err.message}"`);
    } else {
      throw err;
    }
  }
  if (!caughtMatrixError) {
    throw new Error("FAILED: Expected matrix mapping error was not thrown!");
  }

  console.log("\n==================================================");
  console.log("       ALL REGISTRY VALIDATION CHECKS PASSED      ");
  console.log("==================================================\n");
}

runVerification();

