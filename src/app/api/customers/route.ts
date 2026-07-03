import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/handler";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { createCustomerSchema, listCustomersQuerySchema } from "@/lib/validation/customer";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = listCustomersQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const [customers, total] = await Promise.all([
    customerRepository.list(query),
    customerRepository.count(query),
  ]);
  return NextResponse.json({ customers, total });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = createCustomerSchema.parse(await request.json());
  const customer = await customerRepository.create(body);
  return NextResponse.json({ customer }, { status: 201 });
});
