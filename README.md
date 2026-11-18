# AMR Prism

**Genotype → phenotype intelligence for antimicrobial resistance.**

AMR Prism is a browser-based dashboard that compares resistance determinants reported by
AMRFinderPlus with phenotypic antimicrobial susceptibility testing (AST) results. Every
comparison is traced through an explicit, first-principles reasoning chain — premise,
mechanism, drug context, prediction, observation, and conclusion — rather than an opaque
model score.

The app is a dependency-free static site. It runs entirely in the browser, works offline,
and can be hosted on GitHub Pages.

> **Research and education use only.** AMR Prism is not a clinical decision-support device.
> The included breakpoints are illustrative defaults. Verify species, breakpoints, methods,
> and results against local laboratory standards before any clinical interpretation.

## Features

- **Genotype–phenotype concordance** across every tested drug–isolate pair.
- **Transparent reasoning chains** for each comparison, including alternative hypotheses
  and suggested next tests when evidence disagrees.
- **Species-intrinsic resistance rules** (for example, *E. faecium* ampicillin/penicillin
  via PBP5) kept separate from acquired determinants.
- **Multimodal import**: AMRFinderPlus tables, AST tables, narrative text, JSON datasets,
  and evidence images.
- **Lab results entry**: a 50-isolate study scaffold with direct S/I/R entry, optional MIC or
  zone diameter, progress tracking, and CSV export for Excel.
- **Concordance matrix** with concordance, observed SIR, and gene-presence views.
- **Reasoning lab** for tracing one isolate from molecular evidence to phenotype.
- **Ask AMR Prism** chat with a Conversation/Visual toggle; visual answers render annotated
  mechanism maps and evidence chains.
- **Detailed PDF report** with cover, methods, cohort analysis, per-isolate reasoning,
  mismatch hypotheses, and an evidence appendix. Charts and images are embedded.

## Quick start

No build step or package installation is required.

```powershell
# From the project directory
python -m http.server 8080 --bind 127.0.0.1
```

Open <http://127.0.0.1:8080/>.

You can also open `index.html` directly, though some browsers restrict local file access
for imported images. A local static server is recommended.

## Final-year study workflow

The app boots into a blank **50-isolate study template**: 10 strains each of *Escherichia
coli*, *Proteus mirabilis*, *Klebsiella pneumoniae*, *Enterococcus spp.*, and
*Pseudomonas aeruginosa*. The analysis panel is fixed to eight drugs: ampicillin,
amoxicillin, cefuroxime, ceftriaxone, cefepime, ciprofloxacin, gentamicin, and imipenem.

1. **Load the study template** from the Overview or Import data view. Isolate IDs run from
   `EC-01` to `PA-10`.
2. **Import the AMRFinderPlus resistance gene table** for the public genomes. Use the
   isolate IDs in the study template as the `Isolate` / `Sample` column so gene calls merge
   into the correct isolate.
3. **Enter the lab AST results** in **Lab results**. Choose S, I, or R for each isolate and
   drug. Optionally record an MIC in mg/L, or a zone diameter with the `mm` suffix (for
   example `18 mm`). If only an MIC is entered, the knowledge-base breakpoint interprets it.
4. **Download the blank lab CSV** if the results are being collected in Excel first. The
   long-format template has one row per isolate and drug and can be re-imported through
   **Import data** as an AST table.
5. **Review concordance** in the Overview, Concordance matrix, and Reasoning lab, then
   generate the PDF report.

The synthetic 13-isolate demo remains available from **Import data → Load demo** for
teaching and for checking the reasoning chains.

## Using the app

1. **Overview** — cohort-level concordance, resistance, and teaching signals.
2. **Isolates** — browse isolates and open a drawer with determinants, phenotypes, and
   per-drug reasoning.
3. **Lab results** — enter or update the S/I/R phenotype for each isolate and study drug,
   with optional MIC or zone values and a progress counter.
4. **Concordance matrix** — compare all isolates against all drugs; switch between
   concordance status, observed SIR, and gene presence.
5. **Reasoning lab** — select an isolate and inspect the full chain for each drug.
6. **Ask AMR Prism** — ask about an isolate, gene, drug, or the cohort. Toggle between
   conversational and annotated visual answers.
7. **Import data** — paste or drop AMRFinderPlus/AST tables, narratives, JSON, or images.
8. **Report builder** — configure and generate a multi-page PDF report.

## Reasoning model

For each drug–isolate pair, the engine:

1. Resolves detected genes and narrative mechanisms to a curated mechanism entry.
2. Determines whether the mechanism has a valid biochemical path to the drug or its class.
3. Applies species-intrinsic rules and conditional logic (for example, β-lactamase
   expression or target mutations).
4. Predicts R, I, or S and compares that prediction with the observed AST result.
5. Classifies the comparison as concordant R/S, partial, silent determinant, unexplained
   resistance, not tested, or no call.
6. Produces a confidence estimate and, for disagreement, ranked alternative hypotheses
   with the next discriminating test.

The model is deliberately explicit and falsifiable. It does not learn from the data and
does not send data anywhere.

## Data format

The importer auto-detects common AMRFinderPlus and AST tables. A simple narrative format is
also supported:

```text
EC-9999
Escherichia coli urine isolate
blaCTX-M-15 detected
meropenem MIC 8 R
```

JSON datasets use the following shape:

```json
{
  "name": "My cohort",
  "isolates": [
    {
      "id": "EC-0001",
      "species": "Escherichia coli",
      "source": "Urine",
      "genes": [
        { "symbol": "blaCTX-M-15", "identity": 100, "coverage": 100, "method": "EXACTX" }
      ],
      "phenotypes": [
        { "drug": "meropenem", "mic": "8", "sir": "R" },
        { "drug": "gentamicin", "zone": "12 mm", "sir": "R" }
      ],
      "notes": "Free-text narrative"
    }
  ],
  "images": []
}
```

## Project structure

```text
index.html                 App shell and script order
assets/css/styles.css      Dashboard styling
assets/js/knowledge.js     Drugs, species, intrinsic rules, axioms
assets/js/genes.js         Gene/mechanism knowledge base
assets/js/data.js          Synthetic teaching dataset and 50-isolate study scaffold
assets/js/engine.js        Parsers, MIC/SIR interpretation, dataset merge
assets/js/reasoner.js      First-principles concordance engine
assets/js/charts.js        Dependency-free SVG charts
assets/js/pdf.js           Minimal PDF writer and SVG rasterizer
assets/js/report.js        Report assembly and HTML preview
assets/js/chat.js          Intent routing and conversational/visual answers
assets/js/app.js           View rendering and application controller
```

## Deployment

The site is static, so GitHub Pages can serve it directly from the repository root.
No server-side code is required.

## Disclaimer

AMR Prism is intended for research, teaching, and demonstration. The bundled dataset is
synthetic. Do not use the app as the sole basis for patient care.
