import RitualRing from "../components/RitualRing";

export default function ProgressTracking() {
  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Coming in Milestone 2+</div>
        <h1>Progress Tracking</h1>
      </div>
      <div className="card empty-state">
        <RitualRing size={72} progress={0.1} color="var(--color-accent)" />
        <h3>Your timeline starts once tracking begins</h3>
        <p>
          Not Available
        </p>
      </div>
    </div>
  );
}