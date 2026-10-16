import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";
import { SERVICE_OPTIONS } from "@/lib/contact-schema";
import { ClientStatusBadge } from "@/components/ui/client-status-badge";
import { ClientAssignmentPanel } from "@/components/sections/client-assignment-panel";
import { ClientNotesPanel } from "@/components/sections/client-notes-panel";
import { formatDateTime } from "@/lib/format-date";

type Client = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAtUtc: string;
  assignedToUserId: number | null;
  assignedToName: string | null;
};

type ClientNote = {
  id: number;
  message: string;
  authorName: string;
  createdAtUtc: string;
};

type TeamUser = { id: number; fullName: string };

const SERVICE_LABELS = Object.fromEntries(SERVICE_OPTIONS.map((option) => [option.value, option.label]));

async function getClient(id: string, token: string): Promise<Client | null> {
  try {
    const response = await fetch(`${getApiUrl()}/api/clients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getNotes(id: string, token: string): Promise<ClientNote[]> {
  try {
    const response = await fetch(`${getApiUrl()}/api/clients/${id}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

async function getUsers(token: string): Promise<TeamUser[]> {
  try {
    const response = await fetch(`${getApiUrl()}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export default async function ClienteDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getSessionToken();
  if (!token) notFound();

  const [client, notes, users] = await Promise.all([getClient(id, token), getNotes(id, token), getUsers(token)]);
  if (!client) notFound();

  return (
    <div>
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          {client.fullName}
        </h1>
        <ClientStatusBadge status={client.status} />
      </div>
      <p className="mt-1.5 text-sm text-ink-500">
        {SERVICE_LABELS[client.service] ?? client.service} · {formatDateTime(client.createdAtUtc)}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-lg bg-white shadow-card p-6">
            <h2 className="text-base font-semibold text-ink-950">Datos de contacto</h2>
            <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-ink-500">Correo</dt>
                <dd className="min-w-0 truncate font-medium text-ink-950">
                  <a href={`mailto:${client.email}`} className="hover:underline">
                    {client.email}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-ink-500">Teléfono</dt>
                <dd className="font-medium text-ink-950">{client.phone}</dd>
              </div>
            </dl>
            <h3 className="mt-6 text-sm font-medium text-ink-950">Mensaje</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {client.message}
            </p>
          </section>

          <ClientNotesPanel
            clientId={client.id}
            notes={notes.map((note) => ({ ...note, createdAtLabel: formatDateTime(note.createdAtUtc) }))}
          />
        </div>

        <ClientAssignmentPanel
          clientId={client.id}
          status={client.status}
          assignedToUserId={client.assignedToUserId}
          users={users}
        />
      </div>
    </div>
  );
}
