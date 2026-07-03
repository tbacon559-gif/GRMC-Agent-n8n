import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { addNoteSchema } from "@/lib/validation/customer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = addNoteSchema.parse(await request.json());
  const note = await customerRepository.addNote(id, body.body);
  return NextResponse.json({ note }, { status: 201 });
});
