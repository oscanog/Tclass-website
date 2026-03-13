import { cn } from "@/lib/utils";

type CertificateTrackIconProps = {
  badge: string;
  className?: string;
};

export function CertificateTrackIcon({ badge, className }: CertificateTrackIconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      role="img"
      aria-label={`Certificate icon ${badge}`}
      className={cn("h-20 w-20", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="64" cy="64" r="58" className="fill-current opacity-10" />
      <rect x="26" y="24" width="76" height="58" rx="10" className="fill-current opacity-18" />
      <rect x="26" y="24" width="76" height="58" rx="10" className="stroke-current opacity-70" strokeWidth="3" />
      <path d="M38 44H90" className="stroke-current opacity-70" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 56H74" className="stroke-current opacity-55" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 68H68" className="stroke-current opacity-45" strokeWidth="3" strokeLinecap="round" />

      <circle cx="88" cy="74" r="14" className="fill-current opacity-85" />
      <path d="M82 86L85 102L89 96L94 101L97 86" className="stroke-current opacity-85" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M88 67L90 71H95L91 74L93 79L88 76L83 79L85 74L81 71H86L88 67Z" className="fill-white dark:fill-slate-900" />

      <rect x="42" y="12" width="44" height="18" rx="9" className="fill-white dark:fill-slate-900" />
      <rect x="42" y="12" width="44" height="18" rx="9" className="stroke-current opacity-60" strokeWidth="2" />
      <text x="64" y="25" textAnchor="middle" className="fill-current text-[11px] font-black">
        {badge}
      </text>
    </svg>
  );
}

