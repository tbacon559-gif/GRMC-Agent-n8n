import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { contactRepository } from "@/core/repositories/contact.repository";
import { addNoteSchema } from "@/core/validation/contact";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = addNoteSchema.parse(await request.json());
  const note = await contactRepository.addNote(id, body.body);
  return NextResponse.json({ note }, { status: 201 });
});
