import PageHeader from "../components/PageHeader";
import RitualRing from "../components/RitualRing";

export default function ProgressTracking() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Coming in Milestone 2+"
        title="Progress Tracking"
        description="Monitor your skin journey with photos, hydration scores, and breakout trends."
      />
      <div className="card empty-state">
        <RitualRing size={72} progress={0.1} color="var(--color-accent)" />
        <h3>Your timeline starts soon</h3>
        <p>
          Progress tracking is scaffolded at the database level and will be built out
          in a later milestone with charts, photo uploads, and trend analysis.
        </p>
      </div>
    </div>
  );
}
