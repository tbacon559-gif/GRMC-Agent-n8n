import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { contactRepository } from "@/core/repositories/contact.repository";
import { taskRepository } from "@/core/repositories/task.repository";

describe("taskRepository (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("supports founder-level, module-level, and contact-level tasks", async () => {
    const contact = await contactRepository.create({ name: "Task Test Contact" });

    const founderTask = await taskRepository.create({ title: "Renew business insurance" });
    const moduleTask = await taskRepository.create({ title: "Restock packing tape", module: "marketplace" });
    const contactTask = await taskRepository.create({ title: "Call about the mixer", contactId: contact.id });

    expect(founderTask.module).toBeNull();
    expect(founderTask.contactId).toBeNull();
    expect(moduleTask.module).toBe("marketplace");
    expect(moduleTask.contactId).toBeNull();
    expect(contactTask.contactId).toBe(contact.id);

    const contactTasks = await taskRepository.list({ contactId: contact.id });
    expect(contactTasks.map((t) => t.id)).toEqual([contactTask.id]);
  });

  it("listDue only returns pending tasks due at or before now", async () => {
    const now = new Date("2026-03-01T00:00:00Z");
    const overdue = await taskRepository.create({ title: "Overdue task", dueAt: new Date("2026-02-01T00:00:00Z") });
    const future = await taskRepository.create({ title: "Future task", dueAt: new Date("2026-04-01T00:00:00Z") });

    const due = await taskRepository.listDue(now, 50);
    const dueIds = due.map((t) => t.id);
    expect(dueIds).toContain(overdue.id);
    expect(dueIds).not.toContain(future.id);
  });

  it("marking a task done stamps completedAt", async () => {
    const task = await taskRepository.create({ title: "Mark me done" });
    const updated = await taskRepository.update(task.id, { status: "done" });
    expect(updated.status).toBe("done");
    expect(updated.completedAt).not.toBeNull();
  });
});
