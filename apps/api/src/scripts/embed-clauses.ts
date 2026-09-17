/**
 * Computes and stores the sentence embedding of every clause.
 *
 * Run automatically by scripts/setup.mjs after seeding. Safe to re-run: it
 * overwrites. If the model cannot be loaded the script exits non-zero and
 * setup treats the step as optional — the matcher then runs BM25 + controlled
 * vocabulary only, and the Settings page reports "embeddings unavailable".
 */
import { prisma } from "@meddevaudit/db";
import { getEmbedder, embeddingStatus } from "../services/embeddings";

async function main() {
  const clauses = await prisma.clause.findMany({ orderBy: { sortOrder: "asc" } });
  if (clauses.length === 0) {
    console.error("[embed] no clauses in the database — run the seed first");
    process.exit(1);
  }

  console.log(`[embed] loading ${embeddingStatus().model} (first run downloads ~23 MB)…`);
  const embedder = await getEmbedder();
  if (!embedder) {
    console.error(`[embed] model unavailable: ${embeddingStatus().error}`);
    process.exit(2);
  }

  // Embed the same text the matcher will query with, so the two sides of the
  // cosine are computed from identical representations.
  const texts = clauses.map((c) => `${c.title}. ${c.requirementText}`);
  const vectors = await embedder.embed(texts);

  for (let i = 0; i < clauses.length; i += 1) {
    await prisma.clause.update({
      where: { id: clauses[i].id },
      data: { embedding: JSON.stringify(vectors[i].map((v) => Number(v.toFixed(6)))) },
    });
  }
  console.log(`[embed] stored ${vectors.length} clause embeddings (${vectors[0].length} dims)`);
}

main()
  .catch((error) => {
    console.error("[embed]", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
