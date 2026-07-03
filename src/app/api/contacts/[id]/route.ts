import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { contactRepository } from "@/core/repositories/contact.repository";
import { updateContactSchema } from "@/core/validation/contact";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const contact = await contactRepository.getByIdOrThrow(id);
  return NextResponse.json({ contact });
});

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = updateContactSchema.parse(await request.json());
  const contact = await contactRepository.update(id, body);
  return NextResponse.json({ contact });
});

export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  await contactRepository.delete(id);
  return NextResponse.json({ success: true });
});
