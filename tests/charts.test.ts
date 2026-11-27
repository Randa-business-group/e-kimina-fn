import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { compact, monthLabel, rwf } from "@/components/charts/charts";

describe("chart helpers", () => {
  it("compacts axis numbers", () => {
    assert.equal(compact(950), "950");
    assert.equal(compact(1500), "1.5k");
    assert.equal(compact(250_000), "250k");
    assert.equal(compact(1_200_000), "1.2M");
    assert.equal(compact(12_000_000), "12M");
    assert.equal(compact(-1500), "-1.5k");
  });

  it("formats money for tooltips", () => {
    assert.equal(rwf(5003000), "5,003,000 RWF");
    assert.equal(rwf(0.4), "0 RWF");
  });

  it("labels months in UTC", () => {
    assert.equal(monthLabel("2026-01"), "Jan");
    assert.equal(monthLabel("2026-12"), "Dec");
  });
});
