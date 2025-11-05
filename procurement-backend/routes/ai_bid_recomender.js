const express = require("express");
const natural = require("natural");
const cosineSimilarity = require("cosine-similarity");
const stringSim = require("string-similarity"); // ✅ NEW IMPORT

const router = express.Router();

function cleanText(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeAndStem(text) {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(cleanText(text));
  return tokens.join(" ");
}

router.get("/recommend-vendors/:tenderId", async (req, res) => {
  const pool = req.app.get("db");
  try {
    const { tenderId } = req.params;

    // 1️⃣ Fetch tender
    const tenderResult = await pool.query(
      "SELECT description FROM tenders WHERE id = $1",
      [tenderId]
    );
    if (tenderResult.rows.length === 0)
      return res.status(404).json({ message: "Tender not found" });

    const tenderDescription = tokenizeAndStem(tenderResult.rows[0].description || "");

    // 2️⃣ Fetch vendors
    const vendorResult = await pool.query(
      "SELECT id, company_name, category FROM vendors"
    );
    const vendors = vendorResult.rows;
    if (vendors.length === 0)
      return res.status(404).json({ message: "No vendors available" });

    // 3️⃣ Build TF-IDF model
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    tfidf.addDocument(tenderDescription);
    vendors.forEach((v) => {
      const vendorDoc = tokenizeAndStem(`${v.company_name} ${v.category}`);
      tfidf.addDocument(vendorDoc);
    });

    // 4️⃣ Compute similarities
    const scores = vendors.map((vendor, index) => {
      const vendorDoc = tokenizeAndStem(`${vendor.company_name} ${vendor.category}`);

      const terms = new Set([
        ...tenderDescription.split(/\s+/),
        ...vendorDoc.split(/\s+/),
      ]);

      const tenderVector = [];
      const vendorVector = [];

      Array.from(terms).forEach((term) => {
        const tenderWeight = tfidf.tfidf(term, 0);
        const vendorWeight = tfidf.tfidf(term, index + 1);
        tenderVector.push(tenderWeight);
        vendorVector.push(vendorWeight);
      });

      // 🧮 Cosine Similarity (TF-IDF based)
      const cosineSim = cosineSimilarity(tenderVector, vendorVector) || 0;

      // 🧩 String Similarity (fallback for non-overlapping words)
      const stringSimScore = stringSim.compareTwoStrings(tenderDescription, vendorDoc) || 0;

      // 🧠 Combine both (50% weight each)
      const finalScore = (cosineSim + stringSimScore) / 2;

      return { ...vendor, similarity: finalScore };
    });

    // 5️⃣ Sort & respond
    const topVendors = scores.sort((a, b) => b.similarity - a.similarity).slice(0, 5);

    res.json({
      tenderId,
      recommended_vendors: topVendors.map((v) => ({
        id: v.id,
        name: v.company_name,
        category: v.category,
        similarity: (v.similarity * 100).toFixed(2) + "%",
      })),
    });
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    res.status(500).json({ message: "AI Recommendation failed" });
  }
});

module.exports = router;
