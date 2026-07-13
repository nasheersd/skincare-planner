import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

export default function ProductRecommendation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api
      .get("/recommendations/")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          setError("profile_incomplete");
        } else if (err.response?.status === 503) {
          setError("catalog_empty");
        } else {
          setError("generic_error");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    if (!data?.recommendations) return ["all"];
    const cats = new Set(data.recommendations.map((p) => p.category));
    return ["all", ...cats];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data?.recommendations) return [];
    return data.recommendations.filter((p) => {
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key_ingredients.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [data, selectedCategory, searchQuery]);

  if (loading) return <LoadingState label="Analyzing your skin profile & finding product matches…" />;

  if (error === "profile_incomplete") {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Personalized recommendations"
          title="Product Recommendations"
          description="View products custom-matched to your unique skin profile."
        />
        <div className="card empty-state" style={{ maxWidth: "500px", margin: "3rem auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◎</div>
          <h3>Skin Profile Incomplete</h3>
          <p style={{ margin: "1rem 0 1.5rem 0", color: "var(--color-fg-muted)" }}>
            Please select your skin type and list any concerns in your skin profile so that we can curate recommendations for you.
          </p>
          <Link to="/skin-profile" className="btn btn-primary">
            Complete Skin Profile
          </Link>
        </div>
      </div>
    );
  }

  if (error === "catalog_empty") {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Personalized recommendations"
          title="Product Recommendations"
          description="View products custom-matched to your unique skin profile."
        />
        <div className="card empty-state" style={{ maxWidth: "500px", margin: "3rem auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
          <h3>Catalog is Empty</h3>
          <p style={{ margin: "1rem 0 1.5rem 0", color: "var(--color-fg-muted)" }}>
            The skincare product catalog is currently empty. Please ask an administrator to seed the products database.
          </p>
        </div>
      </div>
    );
  }

  if (error === "generic_error" || !data) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Personalized recommendations"
          title="Product Recommendations"
          description="View products custom-matched to your unique skin profile."
        />
        <div className="card empty-state" style={{ maxWidth: "500px", margin: "3rem auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", color: "var(--color-error)" }}>⚠</div>
          <h3>Couldn't Load Recommendations</h3>
          <p style={{ margin: "1rem 0 1.5rem 0", color: "var(--color-fg-muted)" }}>
            We encountered an unexpected error while retrieving your matches. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Personalized recommendations"
        title="Product Recommendations"
        description="We analyze your skin profile and concerns to rank products in our catalog. No AI is used; these are direct matches based on dermatological skin-type suitability."
      />

      {/* Profile Summary Snapshot */}
      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderLeft: "4px solid var(--color-gold)" }}>
        <div>
          <span className="eyebrow">Your Skin Profile</span>
          <h2 style={{ margin: "0.25rem 0", textTransform: "capitalize" }}>{data.skin_type} Skin</h2>
          {data.skin_concerns.length > 0 ? (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {data.skin_concerns.map((concern) => (
                <span key={concern} className="status-pill status-pending" style={{ textTransform: "capitalize", fontSize: "0.8rem", padding: "0.15rem 0.6rem" }}>
                  {concern}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>No active concerns registered.</p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="eyebrow">Catalog Matches Found</span>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-gold)" }}>
            {data.recommendations.length}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div className="tab-row" style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-secondary"}`}
              style={{ textTransform: "capitalize", padding: "0.4rem 1rem", fontSize: "0.9rem" }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <input
            type="text"
            className="input"
            style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.9rem" }}
            placeholder="Search by brand, name, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card empty-state" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <h3>No matches found</h3>
          <p style={{ color: "var(--color-fg-muted)" }}>Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredProducts.map((product) => (
            <div key={product.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", transition: "transform 0.2s, box-shadow 0.2s" }}>
              
              {/* Match Badge */}
              <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                <span className={`status-pill ${product.match_score > 3 ? "status-accepted" : "status-pending"}`} style={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                  Score: {product.match_score}
                </span>
              </div>

              <div>
                <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.75rem", tracking: "0.05em" }}>{product.brand}</span>
                <h3 style={{ margin: "0.25rem 0 0.5rem 0", fontSize: "1.2rem", paddingRight: "4rem" }}>{product.name}</h3>
                
                <div style={{ display: "inline-block", background: "var(--color-bg-card-hover)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", textTransform: "capitalize", color: "var(--color-fg-muted)", marginBottom: "1rem" }}>
                  {product.category}
                </div>

                <p style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", margin: "0 0 1.25rem 0", lineHeight: "1.4" }}>
                  {product.description}
                </p>
                
                {/* Ingredients list */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <strong style={{ fontSize: "0.8rem", color: "var(--color-gold)", display: "block", marginBottom: "0.25rem" }}>Key Ingredients:</strong>
                  <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--color-fg-muted)" }}>
                    {product.key_ingredients.join(", ")}
                  </p>
                </div>

                {/* Matched concerns badges */}
                {product.matched_concerns.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <strong style={{ fontSize: "0.8rem", color: "var(--color-fg-muted)", display: "block", marginBottom: "0.25rem" }}>Addresses:</strong>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {product.matched_concerns.map((c) => (
                        <span key={c} className="status-pill status-accepted" style={{ textTransform: "capitalize", fontSize: "0.7rem", padding: "0.05rem 0.4rem" }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginTop: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", display: "block" }}>Price</span>
                  <strong style={{ fontSize: "1.1rem", color: "var(--color-gold)" }}>₹{product.price_inr}</strong>
                </div>
                
                <span className="hint" style={{ fontSize: "0.75rem" }}>
                  Suitable for: {product.suitable_skin_types.join(", ")}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
