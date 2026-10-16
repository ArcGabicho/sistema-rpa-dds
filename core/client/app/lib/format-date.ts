// Always format in Lima time. The panel is server-rendered on Vercel (UTC)
// and hydrated in the viewer's browser, so using the runtime's own time zone
// would both show the wrong hour and make the server and client output
// differ (a React hydration mismatch).
const LOCALE = "es-PE";
const TIME_ZONE = "America/Lima";

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
  });
}

// Only call this from server components: the "a. m." / "p. m." it includes
// is spaced differently by Node and by each browser's Intl data (a regular
// space vs. U+00A0), which breaks hydration if a client component renders it.
// Pass the formatted string down as a prop instead.
export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}
