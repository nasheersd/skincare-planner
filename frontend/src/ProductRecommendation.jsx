import RitualRing from "../components/RitualRing";

export default function ProductRecommendation() {
  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Coming in Milestone 2+</div>
        <h1>Product Recommendations</h1>
      </div>
      <div className="card empty-state">
        <RitualRing size={72} progress={0.2} color="var(--color-gold)" />
        <h3>Not built yet — by design</h3>
        <p>
          Not Available
        </p>
      </div>
    </div>
  );
}