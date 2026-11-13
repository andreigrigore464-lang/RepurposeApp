import { describe, it, expect } from "vitest";
import { loadAndValidateRegistries, RegistryValidationError } from "./load-registries";
import { getAllMatrixPaths, MATRIX_DEFINITION } from "./matrix";
import { ALL_INPUTS } from "./input-types/all-inputs";
import { ALL_PLATFORMS } from "./platforms/all-platforms";

describe("Registries & Matrix Pure Validation", () => {
  it("successfully loads and validates all live registries without errors", () => {
    const loaded = loadAndValidateRegistries();
    expect(loaded.inputs.size).toBeGreaterThan(0);
    expect(loaded.digestKinds.size).toBeGreaterThan(0);
    expect(loaded.formats.size).toBeGreaterThan(0);
    expect(loaded.platforms.size).toBeGreaterThan(0);
  });

  it("resolves valid matrix paths for inputs, formats, and platforms", () => {
    const paths = getAllMatrixPaths();
    expect(paths.length).toBeGreaterThan(0);

    // Verify rss produces standard text-post and carousel paths
    const rssPaths = paths.filter((p) => p.input === "rss");
    expect(rssPaths.some((p) => p.format === "text-post")).toBe(true);
    expect(rssPaths.some((p) => p.format === "carousel")).toBe(true);
  });

  it("throws RegistryValidationError on missing required fields", () => {
    const brokenInputs = [
      ...ALL_INPUTS,
      { id: "invalid-input", name: "", description: "Missing fields" },
    ];
    expect(() => loadAndValidateRegistries(brokenInputs as any)).toThrowError(
      RegistryValidationError
    );
  });

  it("throws RegistryValidationError on duplicate IDs", () => {
    const duplicatePlatforms = [...ALL_PLATFORMS, ALL_PLATFORMS[0]];
    expect(() =>
      loadAndValidateRegistries(undefined, undefined, undefined, duplicatePlatforms)
    ).toThrowError(RegistryValidationError);
  });

  it("throws RegistryValidationError on non-existent matrix references", () => {
    const brokenMatrix = {
      ...MATRIX_DEFINITION,
      formatToPlatforms: {
        ...MATRIX_DEFINITION.formatToPlatforms,
        "text-post": ["non-existent-platform"],
      },
    };
    expect(() =>
      loadAndValidateRegistries(undefined, undefined, undefined, undefined, brokenMatrix)
    ).toThrowError(RegistryValidationError);
  });
});
