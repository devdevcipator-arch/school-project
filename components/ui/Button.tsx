import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "dark";
type Size = "md" | "lg" | "xl";

// Buttons always use palette gradients; hover slides the gradient.
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border font-semibold text-surface bg-[length:220%_100%] bg-left transition-[background-position,translate,box-shadow] duration-500 ease-nav hover:-translate-y-1 hover:bg-right";

const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-linear-135 from-primary via-accent to-primary shadow-[0_8px_22px_rgba(29,84,109,.35)] hover:shadow-[0_14px_30px_rgba(29,84,109,.45)]",
  dark: "border-surface/20 bg-linear-135 from-ink via-primary to-ink hover:shadow-[0_14px_30px_rgba(6,30,41,.45)]",
};

const sizes: Record<Size, string> = {
  md: "px-[22px] py-[11px] text-[.95rem]",
  lg: "px-[26px] py-3.5 text-base",
  xl: "px-8 py-[17px] text-[1.05rem]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className = "", ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
