import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

loadEnvFiles([".env.local", ".env"]);

const connectionString = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL_NON_POOLING or POSTGRES_URL is required to run migrations.");
}

const client = new Client({
  connectionString,
  ssl:
    connectionString.includes("sslmode=require") || process.env.POSTGRES_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined
});

const migrationSql = `
create extension if not exists pgcrypto;

do $$
begin
  create type task_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type task_priority as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null check (length(trim(name)) > 0),
  description text,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_date timestamptz,
  completed_at timestamptz,
  constraint completed_at_requires_completed_status check (
    completed_at is null or status = 'completed'
  )
);

create or replace function enforce_task_lifecycle()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'completed' and new.status <> old.status then
      raise exception 'Task status cannot transition from completed to %', new.status using errcode = '23514';
    end if;

    if old.status = 'cancelled' and new.status <> old.status then
      raise exception 'Task status cannot transition from cancelled to %', new.status using errcode = '23514';
    end if;

    if old.status = 'pending' and new.status not in ('pending', 'in_progress', 'cancelled') then
      raise exception 'Task status cannot transition from pending to %', new.status using errcode = '23514';
    end if;

    if old.status = 'in_progress' and new.status not in ('in_progress', 'completed', 'cancelled') then
      raise exception 'Task status cannot transition from in_progress to %', new.status using errcode = '23514';
    end if;

    new.updated_at = now();
  end if;

  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;

  if new.status <> 'completed' then
    new.completed_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_lifecycle_trigger on tasks;
create trigger tasks_lifecycle_trigger
before insert or update on tasks
for each row
execute function enforce_task_lifecycle();

create index if not exists tasks_status_idx on tasks (status);
create index if not exists tasks_priority_idx on tasks (priority);
create index if not exists tasks_due_date_idx on tasks (due_date);
create index if not exists tasks_created_at_idx on tasks (created_at);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  label varchar(120) not null check (length(trim(label)) > 0),
  key_hash text not null,
  scopes text[] not null default array['tasks:read', 'tasks:write'],
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint api_keys_supported_scopes check (
    scopes <@ array['tasks:read', 'tasks:write']::text[]
  )
);

create index if not exists api_keys_active_idx
on api_keys (id)
where revoked_at is null;
`;

async function main(): Promise<void> {
  await client.connect();

  try {
    await client.query("begin");
    await client.query(migrationSql);
    await client.query("commit");
    console.log("Database migration completed.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

function loadEnvFiles(files: string[]): void {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) {
      continue;
    }

    const contents = readFileSync(path, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
