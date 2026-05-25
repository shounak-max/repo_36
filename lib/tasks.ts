import { query } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { assertStatusTransition } from "@/lib/statusTransitions";
import type { TaskPriority, TaskStatus } from "@/lib/validators";

export type Task = {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  completed_at: string | null;
};

type TaskRow = {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: Date;
  updated_at: Date;
  due_date: Date | null;
  completed_at: Date | null;
};

type TaskInput = {
  name: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
};

type TaskPatchInput = Partial<TaskInput>;

type ListTasksInput = {
  status?: TaskStatus;
  priority?: TaskPriority;
  page: number;
  limit: number;
  sort: string;
};

const sortableColumns: Record<string, string> = {
  created_at: "created_at",
  updated_at: "updated_at",
  due_date: "due_date",
  priority: "priority",
  status: "status",
  name: "name"
};

function serializeTask(row: TaskRow): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    due_date: row.due_date ? row.due_date.toISOString() : null,
    completed_at: row.completed_at ? row.completed_at.toISOString() : null
  };
}

export async function listTasks(input: ListTasksInput): Promise<{
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (input.status) {
    params.push(input.status);
    where.push(`status = $${params.length}`);
  }

  if (input.priority) {
    params.push(input.priority);
    where.push(`priority = $${params.length}`);
  }

  const whereSql = where.length > 0 ? `where ${where.join(" and ")}` : "";
  const countResult = await query<{ count: string }>(`select count(*)::text as count from tasks ${whereSql}`, params);
  const total = Number(countResult.rows[0]?.count ?? 0);

  const offset = (input.page - 1) * input.limit;
  const descending = input.sort.startsWith("-");
  const sortField = descending ? input.sort.slice(1) : input.sort;
  const sortColumn = sortableColumns[sortField] ?? "created_at";

  const dataParams = [...params, input.limit, offset];
  const dataResult = await query<TaskRow>(
    `select id, name, description, status, priority, created_at, updated_at, due_date, completed_at
     from tasks
     ${whereSql}
     order by ${sortColumn} ${descending ? "desc" : "asc"} nulls last, id asc
     limit $${dataParams.length - 1}
     offset $${dataParams.length}`,
    dataParams
  );

  return {
    data: dataResult.rows.map(serializeTask),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      total_pages: Math.ceil(total / input.limit)
    }
  };
}

export async function createTask(input: TaskInput): Promise<Task> {
  const result = await query<TaskRow>(
    `insert into tasks (name, description, status, priority, due_date, completed_at)
     values ($1, $2, $3, $4, $5, case when $3 = 'completed' then now() else null end)
     returning id, name, description, status, priority, created_at, updated_at, due_date, completed_at`,
    [input.name, input.description ?? null, input.status, input.priority, input.due_date ?? null]
  );

  return serializeTask(result.rows[0]);
}

export async function getTask(id: string): Promise<Task> {
  return serializeTask(await getTaskRow(id));
}

export async function replaceTask(id: string, input: TaskInput): Promise<Task> {
  const existing = await getTaskRow(id);
  assertStatusTransition(existing.status, input.status);

  const result = await query<TaskRow>(
    `update tasks
     set name = $1,
         description = $2,
         status = $3,
         priority = $4,
         due_date = $5,
         completed_at = case
           when $3 = 'completed' and completed_at is null then now()
           when $3 <> 'completed' then null
           else completed_at
         end,
         updated_at = now()
     where id = $6
     returning id, name, description, status, priority, created_at, updated_at, due_date, completed_at`,
    [input.name, input.description ?? null, input.status, input.priority, input.due_date ?? null, id]
  );

  return serializeTask(result.rows[0]);
}

export async function patchTask(id: string, input: TaskPatchInput): Promise<Task> {
  const existing = await getTaskRow(id);
  const nextStatus = input.status ?? existing.status;
  assertStatusTransition(existing.status, nextStatus);

  const result = await query<TaskRow>(
    `update tasks
     set name = $1,
         description = $2,
         status = $3,
         priority = $4,
         due_date = $5,
         completed_at = case
           when $3 = 'completed' and completed_at is null then now()
           when $3 <> 'completed' then null
           else completed_at
         end,
         updated_at = now()
     where id = $6
     returning id, name, description, status, priority, created_at, updated_at, due_date, completed_at`,
    [
      input.name ?? existing.name,
      Object.prototype.hasOwnProperty.call(input, "description") ? input.description ?? null : existing.description,
      nextStatus,
      input.priority ?? existing.priority,
      Object.prototype.hasOwnProperty.call(input, "due_date") ? input.due_date ?? null : existing.due_date,
      id
    ]
  );

  return serializeTask(result.rows[0]);
}

export async function deleteTask(id: string): Promise<void> {
  const result = await query<{ id: string }>("delete from tasks where id = $1 returning id", [id]);
  if (result.rowCount === 0) {
    throw notFound("Task not found.");
  }
}

export async function getTaskStats(): Promise<{
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  avg_completion_hours: number;
}> {
  const result = await query<{
    total: string;
    pending: string;
    in_progress: string;
    completed: string;
    cancelled: string;
    avg_completion_hours: string | null;
  }>(
    `select
       count(*)::text as total,
       (count(*) filter (where status = 'pending'))::text as pending,
       (count(*) filter (where status = 'in_progress'))::text as in_progress,
       (count(*) filter (where status = 'completed'))::text as completed,
       (count(*) filter (where status = 'cancelled'))::text as cancelled,
       round(
         (
           avg(extract(epoch from (coalesce(completed_at, updated_at) - created_at)) / 3600)
             filter (where status = 'completed')
         )::numeric,
         1
       )::text as avg_completion_hours
     from tasks`
  );

  const row = result.rows[0];
  return {
    total: Number(row.total),
    pending: Number(row.pending),
    in_progress: Number(row.in_progress),
    completed: Number(row.completed),
    cancelled: Number(row.cancelled),
    avg_completion_hours: row.avg_completion_hours ? Number(row.avg_completion_hours) : 0
  };
}

async function getTaskRow(id: string): Promise<TaskRow> {
  const result = await query<TaskRow>(
    `select id, name, description, status, priority, created_at, updated_at, due_date, completed_at
     from tasks
     where id = $1`,
    [id]
  );

  const row = result.rows[0];
  if (!row) {
    throw notFound("Task not found.");
  }

  return row;
}
