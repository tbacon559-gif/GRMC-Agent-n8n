import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { lawnCareClientRepository } from "@/modules/lawn-care/repositories/lawn-care-client.repository";

export const dynamic = "force-dynamic";

export default async function LawnCarePage() {
  const clients = await lawnCareClientRepository.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Lawn Care</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Clients, service schedules, and quotes.</p>
      </div>
      <Card>
        <CardBody className="flex flex-col gap-3">
          {clients.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No clients yet.</p>}
          {clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between border-b border-slate-50 pb-3 text-sm last:border-0 last:pb-0 dark:border-slate-800/60">
              <div>
                <Link href={`/contacts/${client.contactId}`} className="font-medium text-slate-900 hover:underline dark:text-slate-50">
                  {client.contact.name}
                </Link>
                <p className="text-slate-500 dark:text-slate-400">{client.propertyAddress}</p>
              </div>
              <div className="text-right text-slate-500 dark:text-slate-400">
                {client.serviceFrequency && <p>{client.serviceFrequency}</p>}
                {client.nextServiceAt && <p>Next: {new Date(client.nextServiceAt).toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
