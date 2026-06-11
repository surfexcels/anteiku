export function PageSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="Loading">
      <div className="skeleton-hero">
        <div className="skeleton-line shimmer wide" />
        <div className="skeleton-line shimmer" />
      </div>
      <div className="skeleton-grid">
        <div className="skeleton-card shimmer" />
        <div className="skeleton-card shimmer" />
        <div className="skeleton-card shimmer" />
        <div className="skeleton-card shimmer" />
      </div>
      <div className={`skeleton-panel shimmer${tall ? " tall" : ""}`} />
      <div className="skeleton-panel shimmer" />
    </div>
  );
}
