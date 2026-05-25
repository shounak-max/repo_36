import { describe, expect, it } from "vitest";
import { createTaskSchema, listTasksQuerySchema, patchTaskSchema } from "@/lib/validators";

describe("validators", () => {
  it("applies create-task defaults", () => {
    const parsed = createTaskSchema.parse({
      name: "Design login screen"
    });

    expect(parsed).toMatchObject({
      name: "Design login screen",
      status: "pending",
      priority: "medium"
    });
  });

  it("validates query defaults and pagination limits", () => {
    expect(listTasksQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sort: "-created_at"
    });

    expect(() => listTasksQuerySchema.parse({ limit: "101" })).toThrow();
  });

  it("requires at least one patch field", () => {
    expect(() => patchTaskSchema.parse({})).toThrow();
    expect(patchTaskSchema.parse({ priority: "critical" })).toMatchObject({ priority: "critical" });
  });
});
