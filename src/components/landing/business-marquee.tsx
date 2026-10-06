import {
  BookOpen,
  Cake,
  Church,
  GraduationCap,
  Palette,
  Scissors,
  Shirt,
  Smartphone,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

const ITEMS = [
  { label: "Bookshops", Icon: BookOpen },
  { label: "Barbers and salons", Icon: Scissors },
  { label: "Fashion and fabrics", Icon: Shirt },
  { label: "Caterers and chop bars", Icon: UtensilsCrossed },
  { label: "Tutors", Icon: GraduationCap },
  { label: "Phone and gadget shops", Icon: Smartphone },
  { label: "Bakers", Icon: Cake },
  { label: "Designers and creators", Icon: Palette },
  { label: "Mechanics and repairs", Icon: Wrench },
  { label: "Churches and groups", Icon: Church },
];

/** A slow strip of the kinds of businesses the platform fits. Pauses on hover. */
export function BusinessMarquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {ITEMS.map(({ label, Icon }) => (
        <li
          key={label}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-(--color-border) bg-(--color-surface) px-3.5 py-2 text-sm text-(--color-ink)"
        >
          <Icon className="h-4 w-4 text-(--color-brand)" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee relative overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <p className="sr-only">Works for bookshops, salons, fashion, food, tutors, gadgets, bakers, creators, repairs and churches.</p>
      <div className="marquee-track flex w-max">
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
