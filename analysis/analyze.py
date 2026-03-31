"""
Social Network Analysis: Cliquishness vs Inter-Community Connectivity
CA-GrQc Collaboration Network (SNAP Dataset)

Run: python analyze.py
Outputs: JSON files into ../website/data/ for the web dashboard
"""

import os, json, gzip, urllib.request, collections, math, time
import networkx as nx
import numpy as np
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────────
DATASET_URL  = "https://snap.stanford.edu/data/ca-GrQc.txt.gz"
DATA_DIR     = Path(__file__).parent
RAW_GZ       = DATA_DIR / "ca-GrQc.txt.gz"
RAW_TXT      = DATA_DIR / "ca-GrQc.txt"
OUT_DIR      = DATA_DIR.parent / "website" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── 1. Download dataset ─────────────────────────────────────────────────────
def download():
    if RAW_GZ.exists():
        print("[✓] Dataset already downloaded.")
        return
    print("[↓] Downloading CA-GrQc dataset …")
    urllib.request.urlretrieve(DATASET_URL, RAW_GZ)
    print("[✓] Download complete.")

# ── 2. Parse edge list ──────────────────────────────────────────────────────
def load_graph() -> nx.Graph:
    if not RAW_TXT.exists():
        print("[*] Decompressing …")
        with gzip.open(RAW_GZ, "rb") as f_in, open(RAW_TXT, "wb") as f_out:
            f_out.write(f_in.read())
    print("[*] Loading graph …")
    G = nx.Graph()
    with open(RAW_TXT) as f:
        for line in f:
            if line.startswith("#"):
                continue
            parts = line.strip().split()
            if len(parts) >= 2:
                G.add_edge(int(parts[0]), int(parts[1]))
    G.remove_edges_from(nx.selfloop_edges(G))
    print(f"[✓] Graph loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    return G

# ── 3. Basic metrics ────────────────────────────────────────────────────────
def basic_metrics(G: nx.Graph) -> dict:
    print("[*] Computing basic metrics …")
    degrees      = [d for _, d in G.degree()]
    avg_degree   = sum(degrees) / len(degrees)
    max_degree   = max(degrees)
    avg_cc       = nx.average_clustering(G)
    components   = list(nx.connected_components(G))
    lcc          = max(components, key=len)
    triangles_d  = nx.triangles(G)
    total_tri    = sum(triangles_d.values()) // 3

    # degree distribution (binned for chart)
    deg_counter  = collections.Counter(degrees)
    # top 40 degree values
    sorted_degs  = sorted(deg_counter.items())
    # bin into log-scale buckets for plotting
    bins = [1,2,3,4,5,7,10,15,20,30,50,75,100,150,200,300]
    hist = collections.defaultdict(int)
    for d, c in deg_counter.items():
        for b in bins:
            if d <= b:
                hist[b] += c
                break
        else:
            hist[400] += c

    return {
        "num_nodes":      G.number_of_nodes(),
        "num_edges":      G.number_of_edges(),
        "avg_degree":     round(avg_degree, 4),
        "max_degree":     max_degree,
        "avg_clustering": round(avg_cc, 4),
        "num_components": len(components),
        "lcc_size":       len(lcc),
        "total_triangles": total_tri,
        "degree_dist":    [{"degree": k, "count": v} for k, v in sorted(hist.items())],
    }

# ── 4. K-core decomposition (cliquishness proxy) ────────────────────────────
def kcore_analysis(G: nx.Graph) -> dict:
    print("[*] K-core decomposition …")
    core_number = nx.core_number(G)
    max_k       = max(core_number.values())
    # count nodes per core
    core_counts = collections.Counter(core_number.values())
    return {
        "max_k": max_k,
        "core_distribution": [{"k": k, "nodes": core_counts[k]}
                               for k in sorted(core_counts)],
        "core_number": {str(n): c for n, c in core_number.items()},
    }

# ── 5. Louvain community detection (greedy modularity as fallback) ──────────
def community_detection(G: nx.Graph):
    print("[*] Community detection (greedy modularity) …")
    try:
        from networkx.algorithms.community import greedy_modularity_communities
        communities = list(greedy_modularity_communities(G, cutoff=5))
    except Exception as e:
        print(f"   Fallback due to: {e}")
        communities = list(nx.connected_components(G))

    # Sort communities by size (largest first)
    communities = sorted(communities, key=len, reverse=True)
    node_to_comm = {}
    for idx, comm in enumerate(communities):
        for n in comm:
            node_to_comm[n] = idx
    return communities, node_to_comm

# ── 6. Inter-community connectivity ────────────────────────────────────────
def inter_community_metrics(G: nx.Graph, communities, node_to_comm) -> dict:
    print("[*] Computing inter-community metrics …")
    internal, external = 0, 0
    for u, v in G.edges():
        if node_to_comm.get(u) == node_to_comm.get(v):
            internal += 1
        else:
            external += 1
    total = internal + external
    modularity = (internal / total) - sum(
        (sum(G.degree(n) for n in comm) / (2 * G.number_of_edges())) ** 2
        for comm in communities
    )

    # Per-community stats (top 15 communities)
    comm_stats = []
    for idx, comm in enumerate(communities[:15]):
        comm_nodes = set(comm)
        int_e = sum(1 for u, v in G.edges(comm_nodes)
                    if u in comm_nodes and v in comm_nodes)
        ext_e = sum(1 for u, v in G.edges(comm_nodes)
                    if u not in comm_nodes or v not in comm_nodes)
        local_cc = nx.average_clustering(G, nodes=list(comm_nodes))
        conductance = ext_e / (2 * int_e + ext_e) if (2 * int_e + ext_e) > 0 else 0
        comm_stats.append({
            "community": idx,
            "size":         len(comm),
            "internal_edges": int_e,
            "external_edges": ext_e,
            "clustering":     round(local_cc, 4),
            "conductance":    round(conductance, 4),
        })

    return {
        "total_internal": internal,
        "total_external": external,
        "modularity":     round(modularity, 4),
        "num_communities": len(communities),
        "community_sizes": [len(c) for c in communities[:30]],
        "community_stats": comm_stats,
    }

# ── 7. Cliquishness vs external-edge correlation ────────────────────────────
def cliquishness_correlation(comm_stats: list) -> dict:
    print("[*] Computing correlation …")
    cc_vals  = [s["clustering"]     for s in comm_stats]
    ext_vals = [s["external_edges"] for s in comm_stats]
    if len(cc_vals) < 2:
        return {"pearson_r": 0, "interpretation": "insufficient data"}
    mean_cc  = sum(cc_vals)  / len(cc_vals)
    mean_ext = sum(ext_vals) / len(ext_vals)
    num   = sum((c - mean_cc) * (e - mean_ext) for c, e in zip(cc_vals, ext_vals))
    den_cc  = math.sqrt(sum((c - mean_cc) ** 2 for c in cc_vals))
    den_ext = math.sqrt(sum((e - mean_ext) ** 2 for e in ext_vals))
    r = num / (den_cc * den_ext) if den_cc * den_ext != 0 else 0
    interpretation = (
        "Strong negative correlation: high cliquishness → fewer inter-community edges"
        if r < -0.5 else
        "Moderate negative correlation" if r < 0 else
        "Positive or no clear correlation"
    )
    return {
        "pearson_r":      round(r, 4),
        "scatter":        [{"clustering": c, "external_edges": e}
                           for c, e in zip(cc_vals, ext_vals)],
        "interpretation": interpretation,
    }

# ── 8. Graph sample for vis (top 300 nodes by degree in LCC) ────────────────
def graph_sample(G: nx.Graph, node_to_comm: dict, max_nodes=300) -> dict:
    print("[*] Sampling graph for visualization …")
    # pick largest component
    lcc = max(nx.connected_components(G), key=len)
    sub = G.subgraph(lcc).copy()
    top_nodes = sorted(sub.nodes(), key=lambda n: sub.degree(n), reverse=True)[:max_nodes]
    sg = sub.subgraph(top_nodes)

    # simple spring-like position via degree-weighted random
    rng = np.random.default_rng(42)
    pos = {}
    for n in sg.nodes():
        angle = rng.uniform(0, 2 * math.pi)
        r = 1 / (math.log(sg.degree(n) + 2))
        pos[n] = [float(r * math.cos(angle)), float(r * math.sin(angle))]

    nodes = [{"id": int(n),
              "community": node_to_comm.get(n, 0),
              "degree": sg.degree(n),
              "x": pos[n][0],
              "y": pos[n][1]}
             for n in sg.nodes()]
    edges = [{"source": int(u), "target": int(v)}
             for u, v in sg.edges()
             if u in sg.nodes() and v in sg.nodes()]
    return {"nodes": nodes, "edges": edges}

# ── Main ────────────────────────────────────────────────────────────────────
def main():
    t0 = time.time()
    download()
    G  = load_graph()

    metrics   = basic_metrics(G)
    kcore     = kcore_analysis(G)
    comms, n2c = community_detection(G)
    inter     = inter_community_metrics(G, comms, n2c)
    corr      = cliquishness_correlation(inter["community_stats"])
    vis       = graph_sample(G, n2c)

    # ── write outputs ──
    def save(name, data):
        path = OUT_DIR / f"{name}.json"
        with open(path, "w") as f:
            json.dump(data, f, separators=(",", ":"))
        print(f"[✓] Saved {path}")

    save("metrics",   metrics)
    save("kcore",     kcore)
    save("community", inter)
    save("correlation", corr)
    save("graph",     vis)

    # combined summary
    summary = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "elapsed_sec":  round(time.time() - t0, 1),
        "metrics":      metrics,
        "kcore":        {"max_k": kcore["max_k"]},
        "community":    inter,
        "correlation":  corr,
    }
    save("summary", summary)
    print(f"\n✅  Analysis complete in {summary['elapsed_sec']}s")
    print(f"   Pearson r (cliquishness vs external edges): {corr['pearson_r']}")
    print(f"   {corr['interpretation']}")

if __name__ == "__main__":
    main()
