import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { VALUES } from "@/lib/values";

export function AboutValues() {
  return (
    <section className="bg-brand-50 py-14">
      <Container>
        <ul className="flex flex-wrap justify-center gap-x-10 gap-y-4">
          {VALUES.map((value) => (
            <li key={value} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2.5} />
              <span className="text-sm font-medium text-ink-950">{value}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
