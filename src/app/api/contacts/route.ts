import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { contactRepository } from "@/core/repositories/contact.repository";
import { createContactSchema, listContactsQuerySchema } from "@/core/validation/contact";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = listContactsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const [contacts, total] = await Promise.all([
    contactRepository.list(query),
    contactRepository.count(query),
  ]);
  return NextResponse.json({ contacts, total });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = createContactSchema.parse(await request.json());
  const contact = await contactRepository.create(body);
  return NextResponse.json({ contact }, { status: 201 });
});
