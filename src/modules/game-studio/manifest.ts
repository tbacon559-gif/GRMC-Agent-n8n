import { Gamepad2 } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { gameStudioProjectRepository } from "@/modules/game-studio/repositories/game-studio-project.repository";

export const gameStudioModule: ModuleManifest = {
  id: "game-studio",
  name: "Video Game Studio",
  nav: { href: "/game-studio", label: "Game Studio", icon: Gamepad2 },

  async dashboardWidget() {
    const projects = await gameStudioProjectRepository.list();
    return {
      id: "game-studio",
      title: "Video Game Studio",
      stats: [{ label: "Projects", value: String(projects.length) }],
      items: projects.slice(0, 5).map((p) => ({ label: `${p.title} (${p.status})` })),
    };
  },

  async getContactSummary(contactId: string) {
    const projects = await gameStudioProjectRepository.listByContact(contactId);
    if (!projects.length) return null;
    return { label: "Game Studio", detail: `${projects.length} project(s)` };
  },
};
