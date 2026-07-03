import { describe, expect, it } from "vitest";
import { MODULES } from "@/core/modules/registry";
import { MODULE_IDS } from "@/core/constants/enums";

describe("module registry", () => {
  it("has a unique id per module", () => {
    const ids = MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every module id is a recognized MODULE_ID", () => {
    for (const mod of MODULES) {
      expect(MODULE_IDS).toContain(mod.id);
    }
  });

  it("every module contributes a valid nav entry", () => {
    for (const mod of MODULES) {
      expect(mod.nav.href.startsWith("/")).toBe(true);
      expect(mod.nav.label.length).toBeGreaterThan(0);
      expect(mod.nav.icon).toBeDefined();
    }
  });
});
