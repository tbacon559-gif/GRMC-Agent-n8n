import type { Customer } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from "@/lib/validation/customer";
import { tagRepository } from "@/lib/repositories/tag.repository";

const customerWithDetails = {
  include: {
    tags: { include: { tag: true } },
    notes: { orderBy: { createdAt: "desc" } as const },
    interests: { orderBy: { createdAt: "desc" } as const, include: { category: true } },
    reminders: { orderBy: { dueAt: "asc" } as const },
    purchases: { orderBy: { dateSold: "desc" } as const },
  },
} as const;

export type CustomerWithDetails = NonNullable<
  Awaited<ReturnType<typeof customerRepository.findById>>
>;

export const customerRepository = {
  async list(query: ListCustomersQuery = {}) {
    const { status, search, tag, take = 50, skip = 0 } = query;
    return prisma.customer.findMany({
      where: {
        status,
        tags: tag ? { some: { tag: { name: tag } } } : undefined,
        OR: search
          ? [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    });
  },

  async count(query: ListCustomersQuery = {}) {
    const { status, search, tag } = query;
    return prisma.customer.count({
      where: {
        status,
        tags: tag ? { some: { tag: { name: tag } } } : undefined,
        OR: search
          ? [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
    });
  },

  async findById(id: string) {
    return prisma.customer.findUnique({ where: { id }, ...customerWithDetails });
  },

  async getByIdOrThrow(id: string) {
    const customer = await this.findById(id);
    if (!customer) throw new NotFoundError("Customer", id);
    return customer;
  },

  async findByMessengerThreadId(messengerThreadId: string) {
    return prisma.customer.findUnique({ where: { messengerThreadId } });
  },

  async create(input: CreateCustomerInput): Promise<Customer> {
    const { tags, facebookProfileUrl, email, ...rest } = input;
    const customer = await prisma.customer.create({
      data: {
        ...rest,
        facebookProfileUrl: facebookProfileUrl || null,
        email: email || null,
      },
    });
    if (tags?.length) {
      await tagRepository.attachToCustomer(customer.id, tags);
    }
    return customer;
  },

  /** Used by the n8n webhook: find-or-create a customer by Messenger thread. */
  async upsertByMessengerThreadId(params: {
    messengerThreadId: string;
    name: string;
    facebookProfileUrl?: string;
  }): Promise<Customer> {
    const existing = await this.findByMessengerThreadId(params.messengerThreadId);
    if (existing) return existing;
    return prisma.customer.create({
      data: {
        messengerThreadId: params.messengerThreadId,
        name: params.name,
        facebookProfileUrl: params.facebookProfileUrl || null,
        status: "prospect",
      },
    });
  },

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const { tags, facebookProfileUrl, email, ...rest } = input;
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        facebookProfileUrl: facebookProfileUrl === "" ? null : facebookProfileUrl,
        email: email === "" ? null : email,
      },
    });
    if (tags) {
      await tagRepository.replaceCustomerTags(id, tags);
    }
    return customer;
  },

  async touchLastContact(customerId: string, at: Date): Promise<void> {
    await prisma.customer.update({
      where: { id: customerId },
      data: { lastContactAt: at },
    });
  },

  async updateAiSummary(customerId: string, aiSummary: string): Promise<void> {
    await prisma.customer.update({ where: { id: customerId }, data: { aiSummary } });
  },

  /** Called when a sale is recorded against this customer as buyer. */
  async recordPurchase(customerId: string, amountCents: number): Promise<void> {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalPurchases: { increment: 1 },
        lifetimeSpendCents: { increment: amountCents },
        status: "buyer",
      },
    });
  },

  async addNote(customerId: string, body: string) {
    await this.getByIdOrThrow(customerId);
    return prisma.note.create({ data: { customerId, body } });
  },

  async delete(id: string): Promise<void> {
    await prisma.customer.delete({ where: { id } });
  },
};
