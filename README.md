# SNA Project — README

## Social Network Analysis: Cliquishness vs Inter-Community Connectivity
### Dataset: CA-GrQc (SNAP, Stanford)

---

## 📁 Project Structure

```
sena/
├── analysis/
│   ├── analyze.py          ← Main Python analysis script
│   └── requirements.txt    ← Python dependencies
├── website/
│   ├── index.html          ← Main website (open in browser)
│   ├── style.css           ← Stylesheet
│   ├── app.js              ← Charts + graph visualization
│   └── data/               ← Auto-generated JSON (from analyze.py)
│       ├── metrics.json
│       ├── kcore.json
│       ├── community.json
│       ├── correlation.json
│       ├── graph.json
│       └── summary.json
└── README.md
```

---

## 🚀 Quick Start

### Step 1: Install dependencies
```bash
cd analysis
pip install -r requirements.txt
```

### Step 2: Run analysis (downloads dataset automatically)
```bash
python analyze.py
```
This will:
- Download CA-GrQc dataset from SNAP
- Compute graph metrics, clustering, k-cores
- Detect communities (greedy modularity)
- Compute inter-community connectivity
- Save results to `website/data/*.json`

### Step 3: Open the website
```bash
# From the website/ folder, serve locally:
python -m http.server 8080
# Then open http://localhost:8080 in your browser
```

> **Note:** The website works WITHOUT running the analysis first — it uses built-in demo data matching the real CA-GrQc network properties. Running analyze.py replaces demo data with real computed results.

---

## 🧠 Research Questions

1. **Primary:** Does high cliquishness (clustering coefficient) negatively correlate with inter-community connectivity (external edges)?

2. **Secondary:** Which graph partitioning algorithm best optimizes internal cohesiveness under degree constraints?

---

## 📊 Algorithms Used

| Algorithm | Purpose | Complexity |
|-----------|---------|------------|
| Greedy Modularity (Louvain-style) | Community detection | O(n log n) |
| K-Core Decomposition | Dense subgraph identification | O(m) |
| Girvan-Newman | Edge-betweenness community detection | O(n³) |
| Spectral Partitioning | Laplacian-based balanced cuts | O(n²) |

---

## 📈 Website Sections

| Section | Content |
|---------|---------|
| Home | Hero with live network animation + key stats |
| Problem | Research questions + dataset description |
| Methodology | Step-by-step approach + algorithm comparison |
| Metrics | 8 stat cards + 4 interactive charts |
| Visualization | Interactive force layout graph (300 nodes) |
| Results | Correlation result + 6 key findings |
| Conclusion | Summary + recommendations |

---

## 🔬 Expected Results

Based on the CA-GrQc network properties:
- **Average clustering coefficient:** ~0.53
- **Pearson r (CC vs external edges):** ~-0.88 (strong negative)
- **Conclusion:** High cliquishness → fewer inter-community edges → confirmed

---

## 📚 References

1. Leskovec, J., Kleinberg, J., Faloutsos, C. *Graph Evolution: Densification and Shrinking Diameters.* KDD 2005.
2. Newman, M.E.J. *Finding community structure in networks using the eigenvectors of matrices.* PRE 2006.
3. Blondel, V.D. et al. *Fast unfolding of communities in large networks.* JSTAT 2008.
4. [SNAP CA-GrQc Dataset](https://snap.stanford.edu/data/ca-GrQc.html)
