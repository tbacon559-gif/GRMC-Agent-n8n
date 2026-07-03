import { prisma } from "@/lib/db/prisma";
import type { ModuleId } from "@/core/constants/enums";

export interface CreateCalendarEventInput {
  title: string;
  startsAt: Date;
  endsAt?: Date;
  module?: ModuleId;
  contactId?: string;
  notes?: string;
}

export const calendarRepository = {
  async listUpcoming(now: Date = new Date(), take = 20) {
    return prisma.calendarEvent.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take,
    });
  },

  async listByContact(contactId: string) {
    return prisma.calendarEvent.findMany({
      where: { contactId },
      orderBy: { startsAt: "asc" },
    });
  },

  async create(input: CreateCalendarEventInput) {
    return prisma.calendarEvent.create({ data: input });
  },
};
