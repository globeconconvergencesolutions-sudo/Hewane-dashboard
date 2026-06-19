import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/icon.svg"
      alt="Hewane School of Music logo"
      width={1664}
      height={928}
      priority={priority}
      unoptimized
      className={cn("object-contain", className)}
    />
  );
}
