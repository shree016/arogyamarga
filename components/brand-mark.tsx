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
        {/* Light mode logo */}
        <Image
          src="/logo-light.png"
          alt="ArogyaMaarga logo"
          fill
          sizes="(max-width: 640px) 168px, 208px"
          className="rounded-2xl object-contain dark:hidden"
          priority
        />
        {/* Dark mode logo */}
        <Image
          src="/logo-dark.png"
          alt="ArogyaMaarga logo"
          fill
          sizes="(max-width: 640px) 168px, 208px"
          className="rounded-2xl object-contain hidden dark:block"
          priority
        />
      </div>
    </Link>
  );
}
