import { NextRequest, NextResponse } from "next/server";
import { handleApi, readJsonBody } from "@/lib/http";
import { createTask, listTasks } from "@/lib/tasks";
import { createTaskSchema, listTasksQuerySchema, searchParamsToObject } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleApi(
    request,
    async ({ request }) => {
      const query = listTasksQuerySchema.parse(searchParamsToObject(request.nextUrl.searchParams));
      const result = await listTasks(query);
      return NextResponse.json(result);
    },
    { auth: { scopes: ["tasks:read"] } }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApi(
    request,
    async ({ request }) => {
      const body = createTaskSchema.parse(await readJsonBody(request));
      const task = await createTask(body);
      return NextResponse.json(task, { status: 201 });
    },
    { auth: { scopes: ["tasks:write"] } }
  );
}
