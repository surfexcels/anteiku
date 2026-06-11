import Link from "next/link";
import type { ReactNode } from "react";

export type AnteikuLogoVariant = "default" | "sidebar" | "auth";
export type AnteikuLogoSize = "sm" | "md" | "lg";

function AnteikuMark({ size }: { size: AnteikuLogoSize }) {
  const px = size === "sm" ? 32 : size === "lg" ? 46 : 38;

  return (
    <span
      className={`anteiku-logo-mark size-${size}`}
      style={{ width: px, height: px }}
      aria-hidden
    >
      <svg fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.2 11.2h12.2c.6 0 1.1.5 1 1.1l-.9 10.8c-.1.6-.6 1-1.1 1H9.1c-.6 0-1.1-.5-1.1-1.1L7.2 12.3c-.1-.6.4-1.1 1-1.1Z"
          fill="currentColor"
        />
        <path
          d="M7.5 11.2h13.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.3"
        />
        <path
          d="M21.8 13.8h1.6a2.1 2.1 0 0 1 0 4.2h-1.6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.35"
        />
        <path
          d="M12.2 8.4c.3-.9 1-1.5 1.8-1.5"
          opacity="0.55"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.1"
        />
        <path
          d="M19.8 8.4c-.3-.9-1-1.5-1.8-1.5"
          opacity="0.55"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.1"
        />
        <path
          className="anteiku-logo-leaf"
          d="M16 3.8c-2.4 1.6-3.6 3.4-3.6 5.6 0 1.4.5 2.5 1.3 3.2"
          stroke="var(--orange)"
          strokeLinecap="round"
          strokeWidth="1.35"
        />
        <path
          className="anteiku-logo-leaf"
          d="M16 3.8c1.1 1.8 1.6 3.1 1.6 4.4 0 .9-.3 1.7-.8 2.3"
          stroke="var(--orange)"
          strokeLinecap="round"
          strokeWidth="1.1"
        />
      </svg>
    </span>
  );
}

export function AnteikuLogo({
  href,
  variant = "default",
  size = "md",
  showWordmark = true,
  tagline,
  className,
}: {
  href?: string;
  variant?: AnteikuLogoVariant;
  size?: AnteikuLogoSize;
  showWordmark?: boolean;
  tagline?: string;
  className?: string;
}) {
  const classes = [
    "anteiku-logo",
    `anteiku-logo--${variant}`,
    `anteiku-logo--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content: ReactNode = (
    <>
      <AnteikuMark size={size} />
      {(showWordmark || tagline) && (
        <span className="anteiku-logo-text">
          {showWordmark && <span className="anteiku-logo-wordmark">anteiku</span>}
          {tagline && <span className="anteiku-logo-tagline">{tagline}</span>}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link className={classes} href={href} prefetch>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
