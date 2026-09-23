"use client";

import React, { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated button/link with a cosmic rotating gradient border effect.
 * Keyframes and GPU layer acceleration configured for flicker-free 60fps rendering.
 */

export type CosmicButtonProps<E extends "a" | "button" = "button"> = {
  /** The HTML element to render as. @default "button" */
  as?: E;
} & ComponentPropsWithoutRef<E>;

export const CosmicButton = forwardRef<HTMLElement, CosmicButtonProps<any>>(
  function CosmicButton(
    { as, className, children, ...props },
    ref
  ) {
    const Element = as ?? "button";
    const isAnchor = Element === "a";

    const baseClassName = cn(
      "group/cosmic relative inline-flex items-center justify-center rounded-[15px] p-[2px] cursor-pointer select-none",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#adfa1b] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0c0912]",
      "disabled:pointer-events-none disabled:opacity-50",
      "hover:shadow-[0_0_18px_rgba(173,250,27,0.38)] active:scale-[0.98]",
      className
    );

    const content = (
      <>
        {/* Animated cosmic border - strictly pointer-events-none and static inset-0 to prevent hit-test flickering */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[13px]"
          style={{ transform: "translateZ(0)" }}
        >
          <span
            className="absolute inset-[-200%] animate-cosmic-spin bg-[conic-gradient(from_0deg,#adfa1b,#c9ff63,#efffb7,#8cd413,#6f9f19,#92d61b,#adfa1b)] opacity-95"
            style={{ willChange: "transform", transform: "translateZ(0)" }}
          />
        </span>

        {/* Secondary ambient overlay - hardware accelerated and pointer-events-none */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[13px] opacity-40 transition-opacity duration-200 group-hover/cosmic:opacity-75"
          style={{ transform: "translateZ(0)" }}
        >
          <span
            className="absolute inset-[-200%] animate-cosmic-spin-slow bg-[conic-gradient(from_180deg,#efffb7_0%,transparent_30%,#adfa1b_50%,transparent_70%,#7fbf17_100%)]"
            style={{ willChange: "transform", transform: "translateZ(0)" }}
          />
        </span>

        {/* Theme-aware inner background - flexes cleanly to container */}
        <span className="relative z-10 flex h-full w-full items-center justify-center gap-1.5 rounded-[11px] bg-[#090c12] px-3.5 py-1 text-inherit shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.45)] transition-all duration-200 group-hover/cosmic:bg-[#0c1017] group-hover/cosmic:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.55)]">
          <span className="font-semibold text-inherit tracking-wide text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
            {children ?? "Button"}
          </span>
        </span>
      </>
    );

    if (isAnchor) {
      const { href, rel, target, ...rest } = props as ComponentPropsWithoutRef<"a">;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
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
        ref={ref as React.Ref<HTMLButtonElement>}
        className={baseClassName}
        {...(props as ComponentPropsWithoutRef<"button">)}
      >
        {content}
      </button>
    );
  }
);

CosmicButton.displayName = "CosmicButton";

export default CosmicButton;

