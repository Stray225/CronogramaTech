import { NextRequest, NextResponse } from "next/server";
import { kvGetSchedule, kvSetSchedule } from "@/lib/kv";
import { isMonthSchedule } from "@/types/schedule";

type Params = { params: Promise<{ id: string }> };

/** GET /api/schedule/[id] — fetch one month's schedule */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const schedule = await kvGetSchedule(id);
  if (!schedule) return NextResponse.json(null, { status: 200 });
  return NextResponse.json(schedule);
}

/** PUT /api/schedule/[id] — upsert a month's schedule */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isMonthSchedule(body)) {
    return NextResponse.json({ error: "Invalid schedule shape" }, { status: 400 });
  }

  if (body.id !== id) {
    return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
  }

  await kvSetSchedule(id, body);
  return NextResponse.json({ ok: true });
}
