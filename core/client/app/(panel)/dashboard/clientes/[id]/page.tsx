import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";
import { SERVICE_OPTIONS } from "@/lib/contact-schema";
import { ClientStatusBadge } from "@/components/ui/client-status-badge";
import { ClientAssignmentPanel } from "@/components/sections/client-assignment-panel";
import { ClientNotesPanel } from "@/components/sections/client-notes-panel";

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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink-950">{client.fullName}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          <p className="mt-1 text-sm text-slate">
            {SERVICE_LABELS[client.service] ?? client.service} · {formatDateTime(client.createdAtUtc)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-paper p-6">
            <p className="font-display text-sm font-bold text-ink-950">Datos de contacto</p>
            <dl className="mt-4 flex flex-col divide-y divide-line text-sm">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate">Correo</dt>
                <dd className="font-medium text-ink-950">
                  <a href={`mailto:${client.email}`} className="hover:text-brass-500">
                    {client.email}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate">Teléfono</dt>
                <dd className="font-medium text-ink-950">{client.phone}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate">Mensaje</p>
            <p className="mt-1.5 text-sm text-ink-950">{client.message}</p>
          </div>

          <ClientNotesPanel clientId={client.id} notes={notes} />
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
