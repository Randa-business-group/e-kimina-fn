import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { LOCALES, en, fr, rw } from "@/lib/i18n/dictionaries";
import { formatDate, formatMoney, pickLocale, translate } from "@/lib/i18n/format";
import { navigationConfig } from "@/lib/navigation-config";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  for (const [name, dict] of [
    ["rw", rw],
    ["fr", fr],
  ] as const) {
    it(`${name}: no keys that English does not have`, () => {
      for (const k of Object.keys(dict)) assert.ok(k in en, `${name} has unknown key ${k}`);
    });
    it(`${name}: same placeholders as English`, () => {
      for (const [k, v] of Object.entries(dict)) {
        assert.deepEqual(placeholders(v as string), placeholders(en[k as keyof typeof en]), `${name}.${k}`);
      }
    });
    it(`${name}: translates the whole shell (navigation, home, group tabs)`, () => {
      const needed = Object.keys(en).filter((k) => /^(nav|shell|home|group\.tab)\./.test(k));
      for (const k of needed) assert.ok(k in dict, `${name} is missing ${k}`);
    });
  }

  it("has a label for every navigation item and section", () => {
    for (const s of navigationConfig) {
      assert.ok(`nav.section.${s.id}` in en, s.id);
      for (const i of s.items) assert.ok(`nav.${i.id}` in en, i.id);
    }
  });
});

describe("translate", () => {
  it("fills placeholders and falls back to English", () => {
    assert.equal(translate("en", "home.members", { count: 22 }), "22 members");
    assert.equal(translate("rw", "home.members", { count: 22 }), "Abanyamuryango 22");
    assert.equal(translate("fr", "fines.issue"), "Infliger une amende");
    assert.equal(translate("rw", "common.csv"), "CSV"); // not translated → English
    assert.equal(translate("en", "does.not.exist"), "does.not.exist");
  });
});

describe("formatting", () => {
  it("shows RWF without decimals and other currencies with two", () => {
    assert.match(formatMoney("en", 12500), /^12,500 RWF$/);
    assert.match(formatMoney("en", 12.5, "USD"), /^12\.50 USD$/);
    for (const l of LOCALES) assert.ok(formatMoney(l, 1234567).endsWith(" RWF"));
  });

  it("formats dates per language and tolerates bad input", () => {
    assert.match(formatDate("en", "2026-11-27T10:00:00Z"), /27/);
    assert.match(formatDate("en", "2026-11-27T10:00:00Z"), /2026/);
    assert.equal(formatDate("en", "nope"), "—");
    assert.equal(formatDate("fr", null), "—");
  });

  it("picks the stored language, then the browser's, then English", () => {
    assert.equal(pickLocale("rw", ["fr-FR"]), "rw");
    assert.equal(pickLocale(null, ["fr-FR", "en"]), "fr");
    assert.equal(pickLocale("xx", ["rw-RW"]), "rw");
    assert.equal(pickLocale(undefined, ["de"]), "en");
  });
});
