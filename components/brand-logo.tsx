import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  inverse?: boolean;
  compact?: boolean;
};

export default function BrandLogo({ className = "", inverse = false, compact = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      <Image
        src="/images/unza_logo.jpg"
        alt="UNZA"
        width={36}
        height={36}
        className="rounded-full object-cover"
      />
      {!compact && (
        <span className={`text-md font-black uppercase tracking-wider ${inverse ? "text-white" : "text-[#055a28]"}`}>
          UNZA<span className={inverse ? "text-white/75" : "text-black"}>Nav</span>
        </span>
      )}
    </span>
  );
}