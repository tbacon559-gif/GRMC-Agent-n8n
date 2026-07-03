import { Bot } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { aiProductProjectRepository } from "@/modules/ai-products/repositories/ai-product-project.repository";

export const aiProductsModule: ModuleManifest = {
  id: "ai-products",
  name: "AI Products",
  nav: { href: "/ai-products", label: "AI Products", icon: Bot },

  async dashboardWidget() {
    const projects = await aiProductProjectRepository.list();
    return {
      id: "ai-products",
      title: "AI Products",
      stats: [{ label: "Projects", value: String(projects.length) }],
      items: projects.slice(0, 5).map((p) => ({ label: `${p.name} (${p.status})` })),
    };
  },

  async getContactSummary(contactId: string) {
    const projects = await aiProductProjectRepository.listByContact(contactId);
    if (!projects.length) return null;
    return { label: "AI Products", detail: `${projects.length} project(s)` };
  },
};
