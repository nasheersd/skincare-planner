import PageHeader from "../components/PageHeader";
import RitualRing from "../components/RitualRing";

export default function ProductRecommendation() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Coming in Milestone 2+"
        title="Product Recommendations"
        description="AI-powered product suggestions tailored to your skin profile and lifestyle."
      />
      <div className="card empty-state">
        <RitualRing size={72} progress={0.2} color="var(--color-gold)" />
        <h3>Not available yet</h3>
        <p>
          Recommendations will connect to the product and ingredient catalog once the
          recommendation engine is built in a later milestone.
        </p>
      </div>
    </div>
  );
}
