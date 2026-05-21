import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center", className)}
      aria-label="Go to home page"
    >
      <div className="relative flex h-18 w-42 items-center justify-center overflow-hidden sm:h-20 sm:w-52">
        <Image
          src="/main-logo.png"
          alt="ArogyaMaarga logo"
          fill
          sizes="(max-width: 640px) 96px, 112px"
          className="rounded-2xl object-contain"
          priority
        />
      </div>
    </Link>
  );
}
