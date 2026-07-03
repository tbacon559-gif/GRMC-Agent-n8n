import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { updateCustomerSchema } from "@/lib/validation/customer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const customer = await customerRepository.getByIdOrThrow(id);
  return NextResponse.json({ customer });
});

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const body = updateCustomerSchema.parse(await request.json());
  const customer = await customerRepository.update(id, body);
  return NextResponse.json({ customer });
});

export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  await customerRepository.delete(id);
  return NextResponse.json({ success: true });
});
