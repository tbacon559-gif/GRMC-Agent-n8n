import { BookOpen } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { publishingProjectRepository } from "@/modules/publishing/repositories/publishing-project.repository";

export const publishingModule: ModuleManifest = {
  id: "publishing",
  name: "Publishing",
  nav: { href: "/publishing", label: "Publishing", icon: BookOpen },

  async dashboardWidget() {
    const projects = await publishingProjectRepository.list();
    const drafting = projects.filter((p) => p.status === "drafting");
    return {
      id: "publishing",
      title: "Publishing",
      stats: [
        { label: "Projects", value: String(projects.length) },
        { label: "Drafting", value: String(drafting.length) },
      ],
      items: projects.slice(0, 5).map((p) => ({ label: p.title })),
    };
  },

  async getContactSummary(contactId: string) {
    const projects = await publishingProjectRepository.listByContact(contactId);
    if (!projects.length) return null;
    return { label: "Publishing", detail: `${projects.length} project(s)` };
  },
};
