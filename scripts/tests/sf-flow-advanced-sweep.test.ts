/* SPDX-License-Identifier: Apache-2.0 */

import { describe, expect, it } from "vitest";
import {
  advancedFlowDefinitionDeactivationSource,
  parseAdvancedArgs,
  stageActiveFlowSource,
  stageScheduleSource,
} from "../e2e/sf-flow-advanced-sweep.ts";

describe("SF Flow advanced runtime sweep", () => {
  it("defaults to check-only and requires explicit deployment and runtime", () => {
    expect(parseAdvancedArgs(["--org", "developer-org"])).toEqual({
      org: "developer-org",
      deploy: false,
      runtime: false,
    });
    expect(parseAdvancedArgs(["--org", "developer-org", "--deploy"])).toEqual({
      org: "developer-org",
      deploy: true,
      runtime: false,
    });
    expect(parseAdvancedArgs(["--org", "developer-org", "--runtime"])).toEqual({
      org: "developer-org",
      deploy: true,
      runtime: true,
    });
  });

  it("rejects incomplete or unknown arguments", () => {
    expect(() => parseAdvancedArgs(["--org"])).toThrow(/requires an alias/i);
    expect(() => parseAdvancedArgs(["--org", "developer-org", "--mutate"])).toThrow(
      /unknown argument/i,
    );
  });

  it("stages only Draft Flow status as Active", () => {
    expect(stageActiveFlowSource("<Flow><status>Draft</status></Flow>")).toContain(
      "<status>Active</status>",
    );
    expect(() => stageActiveFlowSource("<Flow><status>Active</status></Flow>")).toThrow(
      /expected one Draft status/i,
    );
  });

  it("stages an exact scheduled start without changing unrelated metadata", () => {
    const source =
      "<Flow><schedule><startDate>2027-01-01</startDate><startTime>00:00:00.000Z</startTime></schedule><status>Draft</status></Flow>";
    expect(stageScheduleSource(source, "2026-09-21", "14:03:00.000Z")).toContain(
      "<startDate>2026-09-21</startDate><startTime>14:03:00.000Z</startTime>",
    );
    expect(() => stageScheduleSource("<Flow/>", "2026-09-21", "14:03:00.000Z")).toThrow(
      /expected one schedule start/i,
    );
  });

  it("uses FlowDefinition activeVersionNumber zero for cleanup", () => {
    const source = advancedFlowDefinitionDeactivationSource();
    expect(source).toContain("<FlowDefinition");
    expect(source).toContain("<activeVersionNumber>0</activeVersionNumber>");
    expect(source).not.toContain("<status>Draft</status>");
  });
});
