import Link from "next/link";
import { ClipboardCheck, Eye, History, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccesoSecreto } from "@/lib/boveda";

const ICONS: Record<string, LucideIcon> = {
  creado: Plus,
  revelado: Eye,
  copiado: ClipboardCheck,
  editado: Pencil,
  rotado: RefreshCw,
  eliminado: Trash2,
};

// The sentence after the user's name: on the secret's own page, and in the
// vault-wide log (followed by the secret's name).
const EN_LA_CREDENCIAL: Record<string, string> = {
  creado: "creó la credencial",
  revelado: "reveló el valor",
  copiado: "copió el valor",
  editado: "editó los datos",
  rotado: "rotó el valor",
  eliminado: "eliminó la credencial",
};
const EN_EL_REGISTRO: Record<string, string> = {
  creado: "creó",
  revelado: "reveló el valor de",
  copiado: "copió el valor de",
  editado: "editó",
  rotado: "rotó el valor de",
  eliminado: "eliminó",
};

export type AccesoItem = AccesoSecreto & {
  // Pre-formatted by the server page: see formatDateTime in lib/format-date.
  createdAtLabel: string;
};

// Who did what with a secret, newest first. With `conSecreto`, each row also
// names (and links) the secret, for the vault-wide log.
export function AccesosList({ accesos, conSecreto = false }: { accesos: AccesoItem[]; conSecreto?: boolean }) {
  if (accesos.length === 0) {
    return <p className="text-sm text-ink-500">Sin accesos registrados.</p>;
  }

  return (
    <ol className="divide-y divide-line">
      {accesos.map((a) => {
        const Icon = ICONS[a.accion] ?? History;
        return (
          <li key={a.id} className="flex items-start gap-3 py-3 text-sm">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                a.accion === "revelado" || a.accion === "copiado" ? "bg-brand-100 text-brand-700" : "bg-brand-50 text-ink-500 ring-1 ring-line"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-ink-700">
                <span className="font-semibold text-ink-950">{a.usuarioNombre}</span>{" "}
                {(conSecreto ? EN_EL_REGISTRO : EN_LA_CREDENCIAL)[a.accion] ?? a.accion}
                {conSecreto && (
                  <>
                    {" "}
                    {a.secretoId ? (
                      <Link href={`/dashboard/boveda/${a.secretoId}`} className="font-medium text-brand-700 hover:underline">
                        {a.secretoNombre}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink-950">{a.secretoNombre}</span>
                    )}
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {a.createdAtLabel}
                {a.ip && <span className="font-mono"> · {a.ip}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
