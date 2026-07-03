import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { aiProductProjectRepository } from "@/modules/ai-products/repositories/ai-product-project.repository";

export const dynamic = "force-dynamic";

export default async function AiProductsPage() {
  const projects = await aiProductProjectRepository.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">AI Products</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Client projects, prompt library, automations.</p>
      </div>
      <Card>
        <CardBody className="flex flex-col gap-3">
          {projects.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No projects yet.</p>}
          {projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between border-b border-slate-50 pb-3 text-sm last:border-0 last:pb-0 dark:border-slate-800/60">
              <span className="font-medium text-slate-900 dark:text-slate-50">{project.name}</span>
              <Badge>{project.status}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
