"use client";

import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated button/link with a cosmic rotating gradient border effect.
 * Keyframes and animations configured in Tailwind config.
 */

export type CosmicButtonProps<E extends "a" | "button" = "button"> = {
  /** The HTML element to render as. @default "button" */
  as?: E;
} & ComponentPropsWithoutRef<E>;

export function CosmicButton<E extends "a" | "button" = "button">({
  as,
  className,
  children,
  ...props
}: CosmicButtonProps<E>) {
  const Element = as ?? "button";
  const isAnchor = Element === "a";

  const baseClassName = cn(
    "group/cosmic relative inline-flex min-h-9 min-w-9 items-center justify-center gap-2 rounded-[15px] p-[2.5px] transition-transform cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#adfa1b] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0c0912]",
    "disabled:pointer-events-none disabled:opacity-50",
    className
  );

  const content = (
    <>
      {/* Animated cosmic border - rotates and enlarges on hover */}
      <span className="absolute inset-0 overflow-hidden rounded-[15px] transition-all duration-300 ease-out group-hover/cosmic:inset-[-2.5px] group-hover/cosmic:rounded-[15px]">
        <span className="absolute inset-[-200%] animate-cosmic-spin bg-[conic-gradient(from_0deg,#adfa1b,#c9ff63,#efffb7,#8cd413,#6f9f19,#92d61b,#adfa1b)] opacity-95" />
      </span>

      {/* Noise/texture overlay on the border - counter-rotates and enlarges on hover */}
      <span className="absolute inset-0 overflow-hidden rounded-[15px] opacity-45 mix-blend-soft-light transition-all duration-300 ease-out group-hover/cosmic:inset-[-2.5px] group-hover/cosmic:rounded-[15px] dark:opacity-60 dark:mix-blend-overlay">
        <span className="absolute inset-[-200%] animate-cosmic-spin-slow bg-[conic-gradient(from_180deg,#efffb7_0%,transparent_30%,#adfa1b_50%,transparent_70%,#7fbf17_100%)]" />
      </span>

      {/* Theme-aware inner background */}
      <span className="relative z-10 flex h-full w-full items-center justify-center gap-2 rounded-[12px] bg-[#090c12] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.5),0_1px_1px_rgba(0,0,0,0.45),0_6px_20px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover/cosmic:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.55),0_10px_26px_rgba(0,0,0,0.42)] active:scale-[0.98]">
        <span className="font-semibold text-sm tracking-wide text-white inline-flex items-center justify-center gap-2">
          {children ?? "Button"}
        </span>
      </span>
    </>
  );

  if (isAnchor) {
    const { href, rel, target, ...rest } = props as ComponentPropsWithoutRef<"a">;
    return (
      <a
        className={baseClassName}
        href={href ?? "#"}
        rel={rel ?? "noopener noreferrer"}
        target={target}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={baseClassName}
      {...(props as ComponentPropsWithoutRef<"button">)}
    >
      {content}
    </button>
  );
}

export default CosmicButton;
