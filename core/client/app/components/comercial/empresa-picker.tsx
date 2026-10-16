"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Building2, Loader2, Search, X } from "lucide-react";
import { INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { EmpresaItem, Paged } from "@/lib/comercial";
import { panelFetch } from "@/lib/panel-api";

export type EmpresaOption = { id: number; nombreComercial: string; ruc: string | null };

// Search-as-you-type combobox over the companies (by name, legal name or
// RUC prefix). With the base at thousands of rows, a plain <select> won't do.
export function EmpresaPicker({
  id,
  value,
  onChange,
  hasError = false,
  describedBy,
}: {
  id: string;
  value: EmpresaOption | null;
  onChange: (empresa: EmpresaOption | null) => void;
  hasError?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmpresaOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  // Debounced search; only the latest request's answer is kept.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  function search(value: string) {
    setQuery(value);
    setOpen(true);
    clearTimeout(timer.current);

    const term = value.trim();
    const request = ++latest.current;
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timer.current = setTimeout(async () => {
      const result = await panelFetch<Paged<EmpresaItem>>(`empresas?q=${encodeURIComponent(term)}&pageSize=8`);
      if (request !== latest.current) return;
      setResults(result.ok ? result.data.items : []);
      setActive(0);
      setLoading(false);
    }, 250);
  }

  function select(empresa: EmpresaOption) {
    onChange({ id: empresa.id, nombreComercial: empresa.nombreComercial, ruc: empresa.ruc });
    search("");
    setOpen(false);
  }

  if (value) {
    return (
      <div className={`${INPUT_BASE} ${inputState(false)} flex items-center justify-between gap-3`}>
        <span className="flex min-w-0 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-ink-400" />
          <span className="truncate font-medium">{value.nombreComercial}</span>
          {value.ruc && <span className="shrink-0 font-mono text-xs text-ink-400">{value.ruc}</span>}
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label="Cambiar de empresa"
          className="rounded p-0.5 text-ink-400 transition-colors hover:text-ink-950"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const showList = open && query.trim().length >= 2;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${results[active].id}` : undefined}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        value={query}
        placeholder="Busca por nombre o RUC"
        onChange={(e) => search(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!showList || results.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + results.length) % results.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            select(results[active]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`${INPUT_BASE} ${inputState(hasError)} pl-9`}
      />
      {loading && <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400" />}

      {showList && !loading && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-line bg-white py-1 shadow-flyout"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-ink-500">Ninguna empresa coincide.</li>
          ) : (
            results.map((empresa, index) => (
              <li
                key={empresa.id}
                id={`${listId}-${empresa.id}`}
                role="option"
                aria-selected={index === active}
                // mousedown, not click: it fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(empresa);
                }}
                onMouseEnter={() => setActive(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                  index === active ? "bg-brand-100" : ""
                }`}
              >
                <span className="truncate text-ink-950">{empresa.nombreComercial}</span>
                {empresa.ruc && <span className="shrink-0 font-mono text-xs text-ink-400">{empresa.ruc}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
