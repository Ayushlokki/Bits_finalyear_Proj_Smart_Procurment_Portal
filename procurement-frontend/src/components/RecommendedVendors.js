import React, { useEffect, useState } from "react";
import axios from "axios";

function RecommendedVendors({ tenderId }) {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const res = await axios.get(
        `ai/recommend-vendors/${tenderId}`
      );
      setVendors(res.data.recommended_vendors);
    };
    fetchRecommendations();
  }, [tenderId]);

  return (
    <div className="card mt-3">
      <div className="card-header bg-primary text-white">AI Recommended Vendors</div>
      <div className="card-body">
        {vendors.length === 0 ? (
          <p>No recommendations found</p>
        ) : (
          <ul>
            {vendors.map((v) => (
              <li key={v.id}>
                <strong>{v.name}</strong> — {v.category}
                <span className="badge bg-success ms-2">{v.similarity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RecommendedVendors;
