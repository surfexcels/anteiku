export type DashboardIconName =
  | "overview"
  | "waste"
  | "products"
  | "carbon"
  | "insights"
  | "reports"
  | "imports"
  | "inventory"
  | "floor"
  | "settings"
  | "clipboard"
  | "upload";

type IconProps = {
  name: DashboardIconName;
  size?: number;
  className?: string;
};

export function DashboardIcon({ name, size = 18, className }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...props}>
          <rect height="7" rx="1.5" width="7" x="3" y="3" />
          <rect height="7" rx="1.5" width="7" x="14" y="3" />
          <rect height="7" rx="1.5" width="7" x="3" y="14" />
          <rect height="7" rx="1.5" width="7" x="14" y="14" />
        </svg>
      );
    case "waste":
      return (
        <svg {...props}>
          <path d="M9 3h6l1 3H8l1-3Z" />
          <path d="M6 8h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8Z" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      );
    case "products":
      return (
        <svg {...props}>
          <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
          <path d="M4 12.5 12 17l8-4.5" />
          <path d="M4 17.5 12 22l8-4.5" />
        </svg>
      );
    case "carbon":
      return (
        <svg {...props}>
          <path d="M12 22c4-3 7-7 7-11a7 7 0 1 0-14 0c0 4 3 8 7 11Z" />
          <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        </svg>
      );
    case "insights":
      return (
        <svg {...props}>
          <path d="M9.5 18h5" />
          <path d="M10 21h4" />
          <path d="M12 3a6 6 0 0 1 4 10.7V16H8v-2.3A6 6 0 0 1 12 3Z" />
        </svg>
      );
    case "reports":
      return (
        <svg {...props}>
          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6M9 17h6" />
        </svg>
      );
    case "imports":
      return (
        <svg {...props}>
          <path d="M12 3v12" />
          <path d="m8 11 4 4 4-4" />
          <path d="M5 21h14" />
        </svg>
      );
    case "inventory":
      return (
        <svg {...props}>
          <path d="M4 7h16v13H4V7Z" />
          <path d="M8 7V5h8v2" />
          <path d="M8 11h8M8 15h5" />
        </svg>
      );
    case "floor":
      return (
        <svg {...props}>
          <rect height="16" rx="2" width="12" x="6" y="4" />
          <path d="M9 9h6M9 13h4" />
          <path d="M4 20h16" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...props}>
          <path d="M9 5h6a2 2 0 0 1 2 2v14H7V7a2 2 0 0 1 2-2Z" />
          <path d="M9 3h6v4H9V3Z" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case "upload":
      return (
        <svg {...props}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M4 20h16" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function NavIcon({ name }: { name: string }) {
  return <DashboardIcon name={name as DashboardIconName} />;
}

export function EmptyStateVisual({
  icon,
  animated = true,
}: {
  icon: DashboardIconName;
  animated?: boolean;
}) {
  return (
    <div
      className={[
        "empty-state-visual",
        animated ? "is-animated" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="empty-state-visual-ring" aria-hidden />
      <span className="empty-state-visual-icon">
        <DashboardIcon name={icon} size={24} />
      </span>
    </div>
  );
}

export function ConnectionIconTile({ icon }: { icon: DashboardIconName }) {
  return (
    <span className="connection-icon-tile" aria-hidden>
      <DashboardIcon name={icon} size={20} />
    </span>
  );
}

export function ChecklistMarker({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="checklist-marker done" aria-hidden>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }

  return <span className="checklist-marker" aria-hidden />;
}

export function StatusDot({ closed }: { closed: boolean }) {
  if (closed) {
    return (
      <span className="status-dot closed" aria-hidden>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }

  return <span className="status-dot open" aria-hidden />;
}
