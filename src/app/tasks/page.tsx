import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TaskActions } from "@/components/forms/TaskActions";
import { taskRepository } from "@/core/repositories/task.repository";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await taskRepository.list({ status: "pending", take: 100 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Tasks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Every to-do across every business and contact, in one list.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3">
          {tasks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nothing pending.</p>}
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3 text-sm last:border-0 last:pb-0 dark:border-slate-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-50">{task.title}</span>
                  {task.module && <Badge>{task.module}</Badge>}
                  {task.priority === "high" && <Badge tone="danger">high</Badge>}
                </div>
                {task.contact && (
                  <Link href={`/contacts/${task.contact.id}`} className="text-slate-500 hover:underline dark:text-slate-400">
                    {task.contact.name}
                  </Link>
                )}
                {task.dueAt && (
                  <p className="text-slate-500 dark:text-slate-400">Due {new Date(task.dueAt).toLocaleDateString()}</p>
                )}
              </div>
              <TaskActions taskId={task.id} />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
