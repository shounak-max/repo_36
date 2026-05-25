import { z } from "zod";

export const taskStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
export const taskPriorities = ["low", "medium", "high", "critical"] as const;
export const apiKeyScopes = ["tasks:read", "tasks:write"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type ApiKeyScope = (typeof apiKeyScopes)[number];

const isoDateTime = z
  .string()
  .datetime({ offset: true })
  .refine((value) => Number.isFinite(Date.parse(value)), "Must be a valid ISO datetime.");

const optionalNullableDate = isoDateTime.nullable().optional();

export const uuidSchema = z.string().uuid();

export const createTaskSchema = z
  .object({
    name: z.string().trim().min(1, "Field \"name\" is required.").max(120),
    description: z.string().max(10_000).nullable().optional(),
    status: z.enum(taskStatuses).default("pending"),
    priority: z.enum(taskPriorities).default("medium"),
    due_date: optionalNullableDate
  })
  .strict();

export const replaceTaskSchema = z
  .object({
    name: z.string().trim().min(1, "Field \"name\" is required.").max(120),
    description: z.string().max(10_000).nullable().optional(),
    status: z.enum(taskStatuses),
    priority: z.enum(taskPriorities),
    due_date: optionalNullableDate
  })
  .strict();

export const patchTaskSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(10_000).nullable().optional(),
    status: z.enum(taskStatuses).optional(),
    priority: z.enum(taskPriorities).optional(),
    due_date: optionalNullableDate
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

const integerFromQuery = (fallback: number, min: number, max?: number) =>
  z
    .preprocess((value) => (value === undefined ? fallback : Number(value)), z.number().int().min(min))
    .refine((value) => (max === undefined ? true : value <= max), `Must be less than or equal to ${max}.`);

const allowedSortFields = ["created_at", "updated_at", "due_date", "priority", "status", "name"] as const;

export const listTasksQuerySchema = z
  .object({
    status: z.enum(taskStatuses).optional(),
    priority: z.enum(taskPriorities).optional(),
    page: integerFromQuery(1, 1),
    limit: integerFromQuery(20, 1, 100),
    sort: z
      .string()
      .default("-created_at")
      .refine((value) => {
        const field = value.startsWith("-") ? value.slice(1) : value;
        return (allowedSortFields as readonly string[]).includes(field);
      }, "Unsupported sort field.")
  })
  .strict();

export const adminCreateApiKeySchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    expires_at: optionalNullableDate,
    scopes: z.array(z.enum(apiKeyScopes)).min(1).default(["tasks:read", "tasks:write"])
  })
  .strict();

export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}
