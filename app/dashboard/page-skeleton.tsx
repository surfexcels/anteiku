export function PageSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="page-skeleton">
      <div className="skeleton-line wide" />
      <div className="skeleton-line" />
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className={tall ? "skeleton-panel tall" : "skeleton-panel"} />
    </div>
  );
}
