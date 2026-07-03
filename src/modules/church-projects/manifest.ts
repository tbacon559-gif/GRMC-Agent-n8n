import { Church } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { churchProjectRepository } from "@/modules/church-projects/repositories/church-project.repository";

export const churchProjectsModule: ModuleManifest = {
  id: "church-projects",
  name: "Church Projects",
  nav: { href: "/church-projects", label: "Church Projects", icon: Church },

  async dashboardWidget() {
    const projects = await churchProjectRepository.list();
    return {
      id: "church-projects",
      title: "Church Projects",
      stats: [{ label: "Projects", value: String(projects.length) }],
      items: projects.slice(0, 5).map((p) => ({ label: `${p.title} (${p.status})` })),
    };
  },

  async getContactSummary(contactId: string) {
    const projects = await churchProjectRepository.listByContact(contactId);
    if (!projects.length) return null;
    return { label: "Church Projects", detail: `${projects.length} project(s)` };
  },
};
