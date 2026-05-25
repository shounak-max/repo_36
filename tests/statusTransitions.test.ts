import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { assertStatusTransition, canTransitionStatus } from "@/lib/statusTransitions";

describe("status transitions", () => {
  it("allows PRD-supported lifecycle transitions", () => {
    expect(canTransitionStatus("pending", "in_progress")).toBe(true);
    expect(canTransitionStatus("pending", "cancelled")).toBe(true);
    expect(canTransitionStatus("in_progress", "completed")).toBe(true);
    expect(canTransitionStatus("in_progress", "cancelled")).toBe(true);
    expect(canTransitionStatus("completed", "completed")).toBe(true);
  });

  it("rejects terminal and skipped transitions", () => {
    expect(() => assertStatusTransition("pending", "completed")).toThrow(ApiError);
    expect(() => assertStatusTransition("completed", "in_progress")).toThrow(ApiError);
    expect(() => assertStatusTransition("cancelled", "pending")).toThrow(ApiError);
  });
});
