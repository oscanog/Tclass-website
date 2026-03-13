import { cn } from "@/lib/utils";

type AcademicVisual = "all" | "1" | "2" | "3" | "4";

type YearLevelSchoolIconProps = {
  badge: string;
  visual: AcademicVisual;
  className?: string;
};

export function YearLevelSchoolIcon({ badge, visual, className }: YearLevelSchoolIconProps) {
  const starCount =
    visual === "all" ? 1 : visual === "1" ? 1 : visual === "2" ? 2 : visual === "3" ? 3 : 4;
  const crownVisible = visual === "4";
  const badgeYOffset = visual === "4" ? 10 : 14;

  return (
    <svg
      viewBox="0 0 128 128"
      role="img"
      aria-label={`Year icon ${badge}`}
      className={cn("h-20 w-20", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="64" cy="64" r="58" className="fill-current opacity-10" />
      <rect x="18" y="72" width="92" height="38" rx="10" className="fill-current opacity-15" />
      <rect x="24" y="78" width="80" height="30" rx="8" className="stroke-current opacity-50" strokeWidth="3" />
      <rect x="58" y="88" width="12" height="20" rx="2" className="fill-current opacity-60" />
      <rect x="34" y="86" width="10" height="10" rx="2" className="fill-current opacity-35" />
      <rect x="84" y="86" width="10" height="10" rx="2" className="fill-current opacity-35" />

      <path d="M64 20L18 40L64 60L110 40L64 20Z" className="fill-current opacity-92" />
      <path d="M90 49V66C90 67.6569 88.6569 69 87 69H41C39.3431 69 38 67.6569 38 66V49" className="stroke-current opacity-90" strokeWidth="4" />
      <path d="M102 44V63" className="stroke-current opacity-90" strokeWidth="4" strokeLinecap="round" />
      <circle cx="102" cy="66" r="5" className="fill-current opacity-90" />

      {Array.from({ length: starCount }).map((_, index) => {
        const x = 43 + index * 14;
        return (
          <path
            key={`star-${index + 1}`}
            d={`M${x} 72L${x + 2.1} 76.3L${x + 7} 76.9L${x + 3.4} 80.3L${x + 4.2} 85L${x} 82.8L${x - 4.2} 85L${x - 3.4} 80.3L${x - 7} 76.9L${x - 2.1} 76.3Z`}
            className="fill-current opacity-95"
          />
        );
      })}

      {crownVisible ? (
        <path
          d="M49 18L56 26L64 18L72 26L79 18L84 31H44L49 18Z"
          className="fill-current opacity-95"
        />
      ) : null}

      <rect x="44" y={badgeYOffset} width="40" height="18" rx="9" className="fill-white dark:fill-slate-900" />
      <rect x="44" y={badgeYOffset} width="40" height="18" rx="9" className="stroke-current opacity-60" strokeWidth="2" />
      <text x="64" y="27" textAnchor="middle" className="fill-current text-[12px] font-black">
        {badge}
      </text>
    </svg>
  );
}
