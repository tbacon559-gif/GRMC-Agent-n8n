import { Sprout } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { lawnCareClientRepository } from "@/modules/lawn-care/repositories/lawn-care-client.repository";

export const lawnCareModule: ModuleManifest = {
  id: "lawn-care",
  name: "Lawn Care",
  nav: { href: "/lawn-care", label: "Lawn Care", icon: Sprout },

  async dashboardWidget() {
    const clients = await lawnCareClientRepository.list();
    const now = new Date();
    const dueSoon = clients.filter((c) => c.nextServiceAt && c.nextServiceAt <= now);
    return {
      id: "lawn-care",
      title: "Lawn Care",
      stats: [
        { label: "Clients", value: String(clients.length) },
        { label: "Service due", value: String(dueSoon.length) },
      ],
      items: dueSoon.slice(0, 5).map((c) => ({ label: `${c.contact.name} — ${c.propertyAddress}` })),
    };
  },

  async getContactSummary(contactId: string) {
    const client = await lawnCareClientRepository.findByContactId(contactId);
    if (!client) return null;
    return {
      label: "Lawn Care",
      detail: `${client.propertyAddress}${client.serviceFrequency ? ` · ${client.serviceFrequency}` : ""}`,
    };
  },
};
