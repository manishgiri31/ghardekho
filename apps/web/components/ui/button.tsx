import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Shared = { children: ReactNode; variant?: "primary" | "secondary" | "quiet"; className?: string };
type ButtonProps = Shared & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type LinkProps = Shared & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const styles = {
  primary: "bg-forest text-white hover:bg-forest-deep",
  secondary: "border border-line bg-white text-ink hover:border-forest/40 hover:bg-paper",
  quiet: "text-forest hover:bg-forest-soft",
};

export function Button(props: ButtonProps | LinkProps) {
  if ("href" in props && typeof props.href === "string") {
    const { href, children, variant = "primary", className = "", ...linkProps } = props;
    const classes = `inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${styles[variant]} ${className}`;
    return <Link href={href} className={classes} {...linkProps}>{children}</Link>;
  }
  const { children, variant = "primary", className = "", ...buttonProps } = props;
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${styles[variant]} ${className}`;
  return <button className={classes} {...(buttonProps as ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}
