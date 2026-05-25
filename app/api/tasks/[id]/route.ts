import { NextRequest, NextResponse } from "next/server";
import { handleApi, readJsonBody } from "@/lib/http";
import { deleteTask, getTask, patchTask, replaceTask } from "@/lib/tasks";
import { patchTaskSchema, replaceTaskSchema, uuidSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IdRouteContext = {
  params: Promise<{ id: string }>;
};

async function getTaskId(context: IdRouteContext): Promise<string> {
  const params = await context.params;
  return uuidSchema.parse(params.id);
}

export async function GET(request: NextRequest, context: IdRouteContext): Promise<NextResponse> {
  return handleApi(
    request,
    async () => {
      const task = await getTask(await getTaskId(context));
      return NextResponse.json(task);
    },
    { auth: { scopes: ["tasks:read"] } }
  );
}

export async function PUT(request: NextRequest, context: IdRouteContext): Promise<NextResponse> {
  return handleApi(
    request,
    async ({ request }) => {
      const id = await getTaskId(context);
      const body = replaceTaskSchema.parse(await readJsonBody(request));
      const task = await replaceTask(id, body);
      return NextResponse.json(task);
    },
    { auth: { scopes: ["tasks:write"] } }
  );
}

export async function PATCH(request: NextRequest, context: IdRouteContext): Promise<NextResponse> {
  return handleApi(
    request,
    async ({ request }) => {
      const id = await getTaskId(context);
      const body = patchTaskSchema.parse(await readJsonBody(request));
      const task = await patchTask(id, body);
      return NextResponse.json(task);
    },
    { auth: { scopes: ["tasks:write"] } }
  );
}

export async function DELETE(request: NextRequest, context: IdRouteContext): Promise<NextResponse> {
  return handleApi(
    request,
    async () => {
      await deleteTask(await getTaskId(context));
      return new NextResponse(null, { status: 204 });
    },
    { auth: { scopes: ["tasks:write"] } }
  );
}
