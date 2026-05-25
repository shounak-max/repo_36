import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Task Manager REST API",
      version: "1.0.0",
      description: "Task lifecycle management API with API-key authentication."
    },
    servers: [
      {
        url: "/",
        description: "Current deployment"
      }
    ],
    tags: [
      { name: "Tasks" },
      { name: "Admin" },
      { name: "Health" }
    ],
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Service and database health check",
          responses: {
            "200": { description: "Service is healthy" },
            "503": { description: "Service or database is unavailable" }
          }
        }
      },
      "/api/tasks": {
        get: {
          tags: ["Tasks"],
          summary: "List tasks",
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: "status", in: "query", schema: { $ref: "#/components/schemas/TaskStatus" } },
            { name: "priority", in: "query", schema: { $ref: "#/components/schemas/TaskPriority" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            { name: "sort", in: "query", schema: { type: "string", default: "-created_at" } }
          ],
          responses: {
            "200": {
              description: "Paginated task list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TaskListResponse" }
                }
              }
            },
            "401": { $ref: "#/components/responses/Error" },
            "429": { $ref: "#/components/responses/Error" }
          }
        },
        post: {
          tags: ["Tasks"],
          summary: "Create a task",
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTaskRequest" }
              }
            }
          },
          responses: {
            "201": { description: "Task created" },
            "400": { $ref: "#/components/responses/Error" },
            "401": { $ref: "#/components/responses/Error" },
            "429": { $ref: "#/components/responses/Error" }
          }
        }
      },
      "/api/tasks/{id}": {
        get: {
          tags: ["Tasks"],
          summary: "Get a task by ID",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/TaskId" }],
          responses: {
            "200": { description: "Task found" },
            "404": { $ref: "#/components/responses/Error" }
          }
        },
        put: {
          tags: ["Tasks"],
          summary: "Replace a task",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/TaskId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReplaceTaskRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Task replaced" },
            "409": { $ref: "#/components/responses/Error" }
          }
        },
        patch: {
          tags: ["Tasks"],
          summary: "Partially update a task",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/TaskId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PatchTaskRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Task updated" },
            "409": { $ref: "#/components/responses/Error" }
          }
        },
        delete: {
          tags: ["Tasks"],
          summary: "Delete a task",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/TaskId" }],
          responses: {
            "204": { description: "Task deleted" },
            "404": { $ref: "#/components/responses/Error" }
          }
        }
      },
      "/api/tasks/stats": {
        get: {
          tags: ["Tasks"],
          summary: "Get aggregate task statistics",
          security: [{ ApiKeyAuth: [] }],
          responses: {
            "200": {
              description: "Task statistics",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TaskStats" }
                }
              }
            }
          }
        }
      },
      "/api/admin/api-keys": {
        post: {
          tags: ["Admin"],
          summary: "Create an API key",
          security: [{ AdminKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateApiKeyRequest" }
              }
            }
          },
          responses: {
            "201": { description: "API key created. Plaintext is returned once." },
            "401": { $ref: "#/components/responses/Error" },
            "403": { $ref: "#/components/responses/Error" }
          }
        }
      },
      "/api/admin/api-keys/{key_id}": {
        delete: {
          tags: ["Admin"],
          summary: "Revoke an API key",
          security: [{ AdminKeyAuth: [] }],
          parameters: [{ name: "key_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "204": { description: "API key revoked" },
            "404": { $ref: "#/components/responses/Error" }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key"
        },
        AdminKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-Admin-Key"
        }
      },
      parameters: {
        TaskId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" }
        }
      },
      responses: {
        Error: {
          description: "Error response",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" }
            }
          }
        }
      },
      schemas: {
        TaskStatus: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "cancelled"]
        },
        TaskPriority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"]
        },
        Task: {
          type: "object",
          required: ["id", "name", "status", "priority", "created_at", "updated_at"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", maxLength: 120 },
            description: { type: ["string", "null"] },
            status: { $ref: "#/components/schemas/TaskStatus" },
            priority: { $ref: "#/components/schemas/TaskPriority" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            due_date: { type: ["string", "null"], format: "date-time" },
            completed_at: { type: ["string", "null"], format: "date-time" }
          }
        },
        CreateTaskRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", maxLength: 120 },
            description: { type: ["string", "null"] },
            status: { $ref: "#/components/schemas/TaskStatus" },
            priority: { $ref: "#/components/schemas/TaskPriority" },
            due_date: { type: ["string", "null"], format: "date-time" }
          }
        },
        ReplaceTaskRequest: {
          allOf: [{ $ref: "#/components/schemas/CreateTaskRequest" }],
          required: ["name", "status", "priority"]
        },
        PatchTaskRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 120 },
            description: { type: ["string", "null"] },
            status: { $ref: "#/components/schemas/TaskStatus" },
            priority: { $ref: "#/components/schemas/TaskPriority" },
            due_date: { type: ["string", "null"], format: "date-time" }
          },
          minProperties: 1
        },
        TaskListResponse: {
          type: "object",
          required: ["data", "pagination"],
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Task" }
            },
            pagination: {
              type: "object",
              required: ["page", "limit", "total", "total_pages"],
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                total_pages: { type: "integer" }
              }
            }
          }
        },
        TaskStats: {
          type: "object",
          required: ["total", "pending", "in_progress", "completed", "cancelled", "avg_completion_hours"],
          properties: {
            total: { type: "integer" },
            pending: { type: "integer" },
            in_progress: { type: "integer" },
            completed: { type: "integer" },
            cancelled: { type: "integer" },
            avg_completion_hours: { type: "number" }
          }
        },
        CreateApiKeyRequest: {
          type: "object",
          required: ["label"],
          properties: {
            label: { type: "string", maxLength: 120 },
            expires_at: { type: ["string", "null"], format: "date-time" },
            scopes: {
              type: "array",
              items: { type: "string", enum: ["tasks:read", "tasks:write"] }
            }
          }
        },
        ErrorEnvelope: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message", "timestamp"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                field: { type: "string" },
                timestamp: { type: "string", format: "date-time" }
              }
            }
          }
        }
      }
    }
  });
}
