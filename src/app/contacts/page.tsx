import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NewContactForm } from "@/components/forms/NewContactForm";
import { contactRepository } from "@/core/repositories/contact.repository";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string; tag?: string }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const { search, tag } = await searchParams;
  const contacts = await contactRepository.list({ take: 100, search: search || undefined, tag: tag || undefined });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Contacts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Every person you&apos;ve ever talked to, across every business — a contact never exists twice.
        </p>
      </div>
      <div className="flex justify-end">
        <NewContactForm />
      </div>

      <form className="flex flex-wrap gap-2 text-sm" action="/contacts">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, email, phone..."
          className="min-w-64 rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Filter
        </button>
        {(search || tag) && (
          <Link href="/contacts" className="self-center text-xs text-slate-500 hover:underline dark:text-slate-400">
            Clear
          </Link>
        )}
      </form>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Tags</th>
                <th className="px-5 py-3">Last contact</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="px-5 py-3">
                    <Link href={`/contacts/${contact.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-50">
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((t) => (
                        <Badge key={t.tagId}>{t.tag.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {contact.lastContactAt ? new Date(contact.lastContactAt).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-slate-500 dark:text-slate-400">
                    No contacts yet — add your first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
