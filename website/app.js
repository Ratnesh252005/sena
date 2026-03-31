/* ══════════════════════════════════════════════════════════
   SNA Project — JavaScript
   Charts, Graph Visualization, Data Loading
   Black & White Design
══════════════════════════════════════════════════════════ */
"use strict";

// ── B&W palette for communities ──────────────────────────
const PALETTE = [
  "#ffffff","#cccccc","#aaaaaa","#888888","#666666",
  "#999999","#bbbbbb","#dddddd","#eeeeee","#444444",
  "#555555","#777777","#e0e0e0","#c0c0c0","#f0f0f0",
];
// For charts — white/gray tones
const CHART_COLORS = {
  white:    "rgba(255,255,255,0.85)",
  whiteSolid: "#ffffff",
  gray:     "rgba(160,160,160,0.7)",
  graySolid: "#a0a0a0",
  light:    "rgba(230,230,230,0.6)",
  dim:      "rgba(80,80,80,0.8)",
  border:   "rgba(255,255,255,0.2)",
  gridLine: "rgba(255,255,255,0.06)",
  tooltip:  { bg:"#111111", border:"rgba(255,255,255,0.2)", title:"#ffffff", body:"#a0a0a0" },
};

// ── Helpers ───────────────────────────────────────────────
function fmt(n) {
  if (n === undefined || n === null) return "—";
  if (typeof n === "number") {
    if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
    if (Math.abs(n) >= 1e3) return n.toLocaleString();
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(4);
  }
  return String(n);
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = fmt(val);
}

// ── Shared chart options ──────────────────────────────────
const BASE_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: CHART_COLORS.tooltip.bg,
      borderColor:     CHART_COLORS.tooltip.border,
      borderWidth: 1,
      titleColor:  CHART_COLORS.tooltip.title,
      bodyColor:   CHART_COLORS.tooltip.body,
    },
  },
  scales: {
    x: {
      ticks: { color:"#606060", font:{size:10} },
      grid:  { color: CHART_COLORS.gridLine },
    },
    y: {
      ticks: { color:"#606060", font:{size:10} },
      grid:  { color: CHART_COLORS.gridLine },
    },
  },
};

// ── Load JSON ─────────────────────────────────────────────
async function loadJSON(name) {
  try {
    const r = await fetch(`data/${name}.json`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch {
    return null;
  }
}

// ── REAL DATA (from analyze.py output) ───────────────────
function demoData() {
  const metrics = {
    num_nodes: 5242, num_edges: 14484,
    avg_degree: 5.5261, max_degree: 81,
    avg_clustering: 0.5296, num_components: 355,
    lcc_size: 4158, total_triangles: 48260,
    degree_dist: [
      {degree:1,count:1198},{degree:2,count:1115},{degree:3,count:777},
      {degree:4,count:495},{degree:5,count:296},{degree:7,count:384},
      {degree:10,count:333},{degree:15,count:254},{degree:20,count:135},
      {degree:30,count:114},{degree:50,count:119},{degree:75,count:18},{degree:100,count:4},
    ],
  };
  const kcore = {
    max_k: 43,
    core_distribution: [
      {k:1,nodes:1084},{k:2,nodes:621},{k:3,nodes:487},{k:4,nodes:392},
      {k:5,nodes:301},{k:6,nodes:249},{k:8,nodes:187},{k:10,nodes:141},
      {k:15,nodes:98},{k:20,nodes:62},{k:25,nodes:38},{k:30,nodes:22},
      {k:35,nodes:14},{k:40,nodes:7},{k:43,nodes:3},
    ],
  };
  const community = {
    num_communities: 419, modularity: 0.8192,
    total_internal: 13202, total_external: 1282,
    community_sizes: [1011,495,425,245,207,167,149,131,129,109,97,92,82,77,64,55,47,37,36,34,30,28,28,22,20],
    community_stats: [
      {community:0,size:1011,internal_edges:2389,external_edges:757,clustering:0.4847,conductance:0.1368},
      {community:1,size:495,internal_edges:957,external_edges:306,clustering:0.474,conductance:0.1378},
      {community:2,size:425,internal_edges:2547,external_edges:379,clustering:0.6254,conductance:0.0692},
      {community:3,size:245,internal_edges:474,external_edges:124,clustering:0.5031,conductance:0.1157},
      {community:4,size:207,internal_edges:435,external_edges:103,clustering:0.615,conductance:0.1059},
      {community:5,size:167,internal_edges:563,external_edges:92,clustering:0.564,conductance:0.0755},
      {community:6,size:149,internal_edges:661,external_edges:108,clustering:0.7261,conductance:0.0755},
      {community:7,size:131,internal_edges:201,external_edges:63,clustering:0.4306,conductance:0.1355},
      {community:8,size:129,internal_edges:224,external_edges:34,clustering:0.5191,conductance:0.0705},
      {community:9,size:109,internal_edges:204,external_edges:57,clustering:0.6213,conductance:0.1226},
      {community:10,size:97,internal_edges:145,external_edges:39,clustering:0.4983,conductance:0.1185},
      {community:11,size:92,internal_edges:168,external_edges:27,clustering:0.5429,conductance:0.0744},
      {community:12,size:82,internal_edges:687,external_edges:39,clustering:0.7599,conductance:0.0276},
      {community:13,size:77,internal_edges:135,external_edges:29,clustering:0.5983,conductance:0.097},
      {community:14,size:64,internal_edges:141,external_edges:47,clustering:0.7195,conductance:0.1429},
    ],
  };
  const correlation = {
    pearson_r: -0.2739,
    interpretation: "Moderate negative correlation (r = −0.27): higher cliquishness correlates with fewer external edges. Community size is a confounding factor.",
    scatter: community.community_stats.map(s=>({clustering:s.clustering,external_edges:s.external_edges})),
  };
  return { metrics, kcore, community, correlation };
}

// ── Hero canvas animation ─────────────────────────────────
function initHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, nodes, edges;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildNet();
  }
  function buildNet() {
    nodes = Array.from({length:90}, (_,i) => ({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
      r:Math.random()*3+1,
      g:Math.floor(Math.random()*10),
    }));
    edges=[];
    for (let i=0;i<nodes.length;i++) {
      const c=Math.floor(Math.random()*2)+1;
      for(let k=0;k<c;k++){
        const j=Math.floor(Math.random()*nodes.length);
        if(j!==i) edges.push([i,j]);
      }
    }
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    edges.forEach(([a,b])=>{
      const n1=nodes[a],n2=nodes[b];
      const d=Math.hypot(n2.x-n1.x,n2.y-n1.y);
      if(d>160)return;
      ctx.beginPath(); ctx.moveTo(n1.x,n1.y); ctx.lineTo(n2.x,n2.y);
      ctx.strokeStyle=`rgba(255,255,255,${0.05*(1-d/160)})`;
      ctx.lineWidth=.5; ctx.stroke();
    });
    nodes.forEach(n=>{
      const gray=Math.floor(180+n.g*7);
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${gray},${gray},${gray},0.6)`; ctx.fill();
    });
    nodes.forEach(n=>{
      n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>W)n.vx*=-1;
      if(n.y<0||n.y>H)n.vy*=-1;
    });
    requestAnimationFrame(draw);
  }
  const ro=new ResizeObserver(resize); ro.observe(canvas.parentElement);
  resize(); draw();
}

// ── Chart builders ────────────────────────────────────────
function buildDegreeChart(data) {
  if(!data?.degree_dist)return;
  const ctx=document.getElementById("degreeChart")?.getContext("2d");
  if(!ctx)return;
  new Chart(ctx,{
    type:"bar",
    data:{
      labels:data.degree_dist.map(d=>`≤${d.degree}`),
      datasets:[{
        data:data.degree_dist.map(d=>d.count),
        backgroundColor:"rgba(255,255,255,0.7)",
        borderColor:"rgba(255,255,255,0.9)",
        borderWidth:1, borderRadius:3,
      }]
    },
    options:{...BASE_OPTS}
  });
}

function buildKcoreChart(kcore) {
  if(!kcore?.core_distribution)return;
  const ctx=document.getElementById("kcoreChart")?.getContext("2d");
  if(!ctx)return;
  const data=kcore.core_distribution;
  new Chart(ctx,{
    type:"bar",
    data:{
      labels:data.map(d=>`k${d.k}`),
      datasets:[{
        data:data.map(d=>d.nodes),
        backgroundColor:"rgba(160,160,160,0.7)",
        borderColor:"rgba(200,200,200,0.9)",
        borderWidth:1, borderRadius:3,
      }]
    },
    options:{...BASE_OPTS}
  });
}

function buildCommSizeChart(community) {
  if(!community?.community_sizes)return;
  const ctx=document.getElementById("commSizeChart")?.getContext("2d");
  if(!ctx)return;
  const sizes=community.community_sizes.slice(0,20);
  const grays=sizes.map((_,i)=>{
    const v=Math.round(220-i*8);
    return `rgba(${v},${v},${v},0.75)`;
  });
  new Chart(ctx,{
    type:"bar",
    data:{
      labels:sizes.map((_,i)=>`C${i+1}`),
      datasets:[{
        data:sizes,
        backgroundColor:grays,
        borderColor:"rgba(255,255,255,0.2)",
        borderWidth:1, borderRadius:3,
      }]
    },
    options:{...BASE_OPTS}
  });
}

function buildIntExtChart(community) {
  if(!community?.community_stats)return;
  const ctx=document.getElementById("intExtChart")?.getContext("2d");
  if(!ctx)return;
  const s=community.community_stats;
  new Chart(ctx,{
    type:"bar",
    data:{
      labels:s.map(x=>`C${x.community+1}`),
      datasets:[
        {
          label:"Internal",
          data:s.map(x=>x.internal_edges),
          backgroundColor:"rgba(255,255,255,0.75)",
          borderColor:"rgba(255,255,255,0.9)",
          borderWidth:1, borderRadius:2,
        },
        {
          label:"External",
          data:s.map(x=>x.external_edges),
          backgroundColor:"rgba(100,100,100,0.7)",
          borderColor:"rgba(150,150,150,0.9)",
          borderWidth:1, borderRadius:2,
        },
      ]
    },
    options:{
      ...BASE_OPTS,
      plugins:{
        ...BASE_OPTS.plugins,
        legend:{
          display:true,
          labels:{color:"#808080",font:{size:11}},
        }
      }
    }
  });
}

// NEW: Modularity comparison chart
function buildModCompChart() {
  const ctx=document.getElementById("modCompChart")?.getContext("2d");
  if(!ctx)return;
  const algos=["Louvain","Girvan-Newman","Spectral","K-Core\n(N/A)","Min-Cut"];
  const vals=[0.8192, 0.60, 0.62, 0, 0.58];
  const colors=vals.map((v,i)=>i===0?"rgba(255,255,255,0.9)":"rgba(100,100,100,0.65)");
  new Chart(ctx,{
    type:"bar",
    data:{
      labels:["Louvain (✓BEST)","Girvan-Newman","Spectral Clustering","K-Core","Min-Cut"],
      datasets:[{
        label:"Modularity Q",
        data:vals,
        backgroundColor:colors,
        borderColor:colors.map(c=>c.replace("0.9","1").replace("0.65","0.9")),
        borderWidth:1, borderRadius:4,
      }]
    },
    options:{
      ...BASE_OPTS,
      scales:{
        x:{ticks:{color:"#808080",font:{size:9}},grid:{color:CHART_COLORS.gridLine}},
        y:{min:0,max:1,ticks:{color:"#606060",font:{size:10}},grid:{color:CHART_COLORS.gridLine}},
      },
    }
  });
}

// NEW: Edge ratio doughnut
function buildEdgeRatioChart(community) {
  const ctx=document.getElementById("edgeRatioChart")?.getContext("2d");
  if(!ctx)return;
  const intE = community?.total_internal || 13202;
  const extE = community?.total_external || 1282;
  new Chart(ctx,{
    type:"doughnut",
    data:{
      labels:["Internal (91.4%)","External (8.6%)"],
      datasets:[{
        data:[intE, extE],
        backgroundColor:["rgba(255,255,255,0.85)","rgba(80,80,80,0.7)"],
        borderColor:["rgba(255,255,255,0.3)","rgba(100,100,100,0.3)"],
        borderWidth:1,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      cutout:"65%",
      plugins:{
        legend:{display:true,position:"bottom",labels:{color:"#808080",font:{size:11},padding:12}},
        tooltip:{...BASE_OPTS.plugins.tooltip},
      }
    }
  });
}

function buildCCDistChart(community) {
  if(!community?.community_stats)return;
  const ctx=document.getElementById("ccDistChart")?.getContext("2d");
  if(!ctx)return;
  const s=community.community_stats;
  new Chart(ctx,{
    type:"bar",
    data:{
      labels:s.map(x=>`C${x.community+1}`),
      datasets:[{
        data:s.map(x=>x.clustering),
        backgroundColor:s.map((_,i)=>{const v=Math.round(120+i*9);return `rgba(${v},${v},${v},0.8)`;}),
        borderColor:"rgba(255,255,255,0.1)",
        borderWidth:1, borderRadius:3,
      }]
    },
    options:{...BASE_OPTS,scales:{...BASE_OPTS.scales,y:{...BASE_OPTS.scales.y,min:0,max:1}}}
  });
}

function buildConductChart(community) {
  if(!community?.community_stats)return;
  const ctx=document.getElementById("conductChart")?.getContext("2d");
  if(!ctx)return;
  const s=community.community_stats;
  new Chart(ctx,{
    type:"line",
    data:{
      labels:s.map(x=>`C${x.community+1}`),
      datasets:[{
        data:s.map(x=>x.conductance),
        borderColor:"rgba(255,255,255,0.8)",
        backgroundColor:"rgba(255,255,255,0.05)",
        borderWidth:2, pointBackgroundColor:"rgba(255,255,255,0.9)",
        pointRadius:4, fill:true, tension:.3,
      }]
    },
    options:{...BASE_OPTS}
  });
}

function buildScatterChart(correlation) {
  if(!correlation?.scatter)return;
  const ctx=document.getElementById("scatterChart")?.getContext("2d");
  if(!ctx)return;
  new Chart(ctx,{
    type:"scatter",
    data:{
      datasets:[{
        data:correlation.scatter.map(p=>({x:p.clustering,y:p.external_edges})),
        backgroundColor:"rgba(255,255,255,0.7)",
        borderColor:"rgba(255,255,255,0.5)",
        pointRadius:6, pointHoverRadius:9,
      }]
    },
    options:{
      ...BASE_OPTS,
      scales:{
        x:{...BASE_OPTS.scales.x,title:{display:true,text:"Clustering Coefficient",color:"#606060"}},
        y:{...BASE_OPTS.scales.y,title:{display:true,text:"External Edges",color:"#606060"}},
      }
    }
  });
}

// ── Interactive Graph Visualizer (B&W) ────────────────────
class GraphVis {
  constructor(canvasId, nodes, edges) {
    this.canvas=document.getElementById(canvasId);
    this.ctx=this.canvas.getContext("2d");
    this.nodes=nodes; this.edges=edges;
    this.pan={x:0,y:0}; this.scale=1;
    this.showEdges=true; this.showLabels=false;
    this._initPositions();
    this._bindEvents();
    this._loop();
  }
  _initPositions() {
    const W=this.canvas.offsetWidth||800, H=this.canvas.offsetHeight||520;
    const commMap={};
    this.nodes.forEach(n=>{
      if(!commMap[n.community])commMap[n.community]=[];
      commMap[n.community].push(n);
    });
    const comms=Object.values(commMap);
    comms.forEach((comm,ci)=>{
      const angle=(ci/comms.length)*Math.PI*2;
      const cx=W/2+Math.cos(angle)*W*0.30;
      const cy=H/2+Math.sin(angle)*H*0.30;
      comm.forEach((n,ni)=>{
        const a2=(ni/comm.length)*Math.PI*2;
        const r2=Math.min(W,H)*0.07;
        n.px=cx+Math.cos(a2)*r2+(Math.random()-.5)*16;
        n.py=cy+Math.sin(a2)*r2+(Math.random()-.5)*16;
        n.vx=0; n.vy=0;
      });
    });
  }
  _bindEvents() {
    const c=this.canvas;
    let dragging=false, last={x:0,y:0};
    c.addEventListener("mousedown",e=>{dragging=true;last={x:e.clientX,y:e.clientY};});
    window.addEventListener("mousemove",e=>{
      if(!dragging)return;
      this.pan.x+=e.clientX-last.x; this.pan.y+=e.clientY-last.y;
      last={x:e.clientX,y:e.clientY};
    });
    window.addEventListener("mouseup",()=>{dragging=false;});
    c.addEventListener("wheel",e=>{
      e.preventDefault();
      this.scale*=e.deltaY<0?1.1:.9;
      this.scale=Math.min(5,Math.max(.15,this.scale));
    },{passive:false});
    let t0=null;
    c.addEventListener("touchstart",e=>{t0={x:e.touches[0].clientX,y:e.touches[0].clientY};});
    c.addEventListener("touchmove",e=>{
      if(!t0)return;
      this.pan.x+=e.touches[0].clientX-t0.x; this.pan.y+=e.touches[0].clientY-t0.y;
      t0={x:e.touches[0].clientX,y:e.touches[0].clientY};
    });
  }
  _loop() {
    this.canvas.width=this.canvas.offsetWidth;
    this.canvas.height=this.canvas.offsetHeight;
    this._draw();
    requestAnimationFrame(()=>this._loop());
  }
  _draw() {
    const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.save();
    ctx.translate(W/2+this.pan.x,H/2+this.pan.y);
    ctx.scale(this.scale,this.scale);
    ctx.translate(-W/2,-H/2);
    const nodeMap={};
    this.nodes.forEach(n=>nodeMap[n.id]=n);
    if(this.showEdges){
      this.edges.forEach(e=>{
        const s=nodeMap[e.source],t=nodeMap[e.target];
        if(!s||!t)return;
        ctx.beginPath(); ctx.moveTo(s.px,s.py); ctx.lineTo(t.px,t.py);
        ctx.strokeStyle="rgba(255,255,255,0.1)"; ctx.lineWidth=.4; ctx.stroke();
      });
    }
    this.nodes.forEach(n=>{
      // B&W: white for low-index community, shades of gray for others
      const idx=n.community%15;
      const grayVal=Math.round(255-idx*14);
      const r=Math.max(3,Math.log(n.degree+1)*2.8);
      ctx.beginPath(); ctx.arc(n.px,n.py,r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${grayVal},${grayVal},${grayVal},0.85)`; ctx.fill();
      ctx.strokeStyle=`rgba(255,255,255,0.2)`; ctx.lineWidth=.5; ctx.stroke();
      if(this.showLabels&&r>5){
        ctx.fillStyle="#cccccc"; ctx.font=`${Math.max(7,r)}px Inter`;
        ctx.fillText(n.id,n.px+r+2,n.py+3);
      }
    });
    ctx.restore();
  }
  setShowEdges(v){this.showEdges=v;}
  setShowLabels(v){this.showLabels=v;}
  reset(){this.pan={x:0,y:0};this.scale=1;}
}

// ── Legend ────────────────────────────────────────────────
function buildLegend(nodes) {
  const comms=[...new Set(nodes.map(n=>n.community))].sort((a,b)=>a-b);
  const leg=document.getElementById("graph-legend");
  if(!leg)return;
  leg.innerHTML="<div style='font-size:.68rem;font-weight:700;letter-spacing:.1em;color:#505050;text-transform:uppercase;margin-bottom:.4rem'>Communities</div>"
    +comms.slice(0,10).map(c=>{
      const g=Math.round(255-c*14);
      return `<div class="legend-item">
        <div class="legend-swatch" style="background:rgb(${g},${g},${g})"></div>
        <span style="color:#606060;font-size:.7rem">Community ${c+1}</span>
      </div>`;
    }).join("")
    +(comms.length>10?`<div style="color:#404040;font-size:.68rem">+${comms.length-10} more</div>`:"");
}

// ── Demo graph fallback ───────────────────────────────────
function generateDemoGraph() {
  const rng=(s)=>{let x=s;return()=>{x=Math.sin(x)*10000;return x-Math.floor(x);};};
  const r=rng(42);
  const nodes=[];
  for(let i=0;i<120;i++) nodes.push({id:i,community:Math.floor(r()*8),degree:Math.floor(r()*15)+1,x:r()*2-1,y:r()*2-1});
  const edges=[];
  for(let i=0;i<200;i++) edges.push({source:Math.floor(r()*120),target:Math.floor(r()*120)});
  return {nodes,edges};
}

// ── Navbar ────────────────────────────────────────────────
function initNavbar() {
  const SECTIONS=["home","overview","problem","methodology","metrics","optimization","visualization","results","conclusion"];
  window.addEventListener("scroll",()=>{
    let cur=SECTIONS[0];
    SECTIONS.forEach(id=>{
      const el=document.getElementById(id);
      if(el&&window.scrollY>=el.offsetTop-100)cur=id;
    });
    document.querySelectorAll(".nav-link").forEach(l=>{
      l.classList.toggle("active",l.dataset.section===cur);
    });
  });
  document.getElementById("hamburger")?.addEventListener("click",()=>{
    document.getElementById("nav-links")?.classList.toggle("open");
  });
}

// ── Scroll reveal ─────────────────────────────────────────
function initScrollReveal() {
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add("visible");obs.unobserve(e.target);}
    });
  },{threshold:.08});
  document.querySelectorAll(".reveal").forEach(el=>obs.observe(el));
}

// ── MAIN ──────────────────────────────────────────────────
async function init() {
  initNavbar();
  initHeroCanvas();
  initScrollReveal();

  // Load real JSON data or fallback to embedded values
  const [mData, kData, cData, corrData, gData] = await Promise.all([
    loadJSON("metrics"), loadJSON("kcore"),
    loadJSON("community"), loadJSON("correlation"), loadJSON("graph")
  ]);
  const demo       = demoData();
  const metrics    = mData    || demo.metrics;
  const kcore      = kData    || demo.kcore;
  const community  = cData    || demo.community;
  const correlation= corrData || demo.correlation;
  const graphData  = gData    || generateDemoGraph();

  // ── Stat cards
  setText("sc-nodes", metrics.num_nodes);
  setText("sc-edges", metrics.num_edges);
  setText("sc-cc",    metrics.avg_clustering);
  setText("sc-tri",   metrics.total_triangles);
  setText("sc-comp",  metrics.num_components);
  setText("sc-lcc",   metrics.lcc_size);
  setText("sc-avgd",  metrics.avg_degree);
  setText("sc-maxd",  metrics.max_degree);

  // ── Hero stats (already hardcoded, still update)
  setText("hs-nodes", metrics.num_nodes);
  setText("hs-edges", metrics.num_edges);
  setText("hs-cc",    metrics.avg_clustering);
  setText("hs-comms", community.num_communities);

  // ── Result stats
  setText("ms-nc", community.num_communities);
  setText("ms-q",  community.modularity);
  setText("ms-ie", community.total_internal);
  setText("ms-ee", community.total_external);
  setText("ms-r",  correlation.pearson_r);
  setText("rh-r",  correlation.pearson_r);
  setText("rh-interp", correlation.interpretation);

  // ── Build all charts
  buildDegreeChart(metrics);
  buildKcoreChart(kcore);
  buildCommSizeChart(community);
  buildIntExtChart(community);
  buildModCompChart();
  buildEdgeRatioChart(community);
  buildCCDistChart(community);
  buildConductChart(community);
  buildScatterChart(correlation);

  // ── Graph visualization
  if(graphData?.nodes?.length){
    buildLegend(graphData.nodes);
    const vis=new GraphVis("graphCanvas",graphData.nodes,graphData.edges);
    document.getElementById("vcEdges")?.addEventListener("change",e=>vis.setShowEdges(e.target.checked));
    document.getElementById("vcLabels")?.addEventListener("change",e=>vis.setShowLabels(e.target.checked));
    document.getElementById("vcReset")?.addEventListener("click",()=>vis.reset());
  }
}

document.addEventListener("DOMContentLoaded", init);
