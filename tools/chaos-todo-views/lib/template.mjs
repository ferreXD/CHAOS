// Renders the self-contained single-page CHAOS Todo dashboard.
// Output: one HTML document with inline CSS + inline JS + embedded JSON data.
// No external network, CDN, fonts, or images. Fully offline.

/** Embed a JS-safe JSON blob inside a <script type="application/json"> tag. */
function embedJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\u003c')
    .replace(/>/g, '\u003e');
}

const CSS = String.raw`
*,*::before,*::after{box-sizing:border-box}
:root{
  --bg:#f6f7fb; --panel:#ffffff; --panel-2:#f0f2f8; --elev:0 1px 2px rgba(20,24,40,.06),0 8px 24px -12px rgba(20,24,40,.18);
  --border:#e6e8f0; --text:#1a1d29; --muted:#5b6172; --faint:#8b90a3;
  --accent:#5b5bd6; --accent-2:#8a5cf6; --accent-soft:#ecebfb;
  --p-BLOCKER:#e5484d; --p-HIGH:#e8710a; --p-MEDIUM:#4a7bf7; --p-LOW:#7c8798;
  --st-open:#d98a1a; --st-done:#2fa96b; --st-blocked:#e5484d; --st-progress:#4a7bf7; --st-decision:#a259e6;
  --ring-track:#e6e8f0;
  --r:14px; --r-sm:9px;
}
:root[data-theme="dark"]{
  --bg:#0d0f17; --panel:#161a25; --panel-2:#1d2230; --elev:0 1px 2px rgba(0,0,0,.4),0 12px 30px -14px rgba(0,0,0,.6);
  --border:#262c3b; --text:#e8eaf2; --muted:#9aa1b5; --faint:#6c7488;
  --accent:#8b8bf5; --accent-2:#a78bfa; --accent-soft:#20233a;
  --p-BLOCKER:#ff6369; --p-HIGH:#ff9f45; --p-MEDIUM:#6b9bff; --p-LOW:#8a93a8;
  --st-open:#f0b64d; --st-done:#43c88a; --st-blocked:#ff6369; --st-progress:#6b9bff; --st-decision:#c08cf5;
  --ring-track:#262c3b;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#0d0f17; --panel:#161a25; --panel-2:#1d2230; --elev:0 1px 2px rgba(0,0,0,.4),0 12px 30px -14px rgba(0,0,0,.6);
  --border:#262c3b; --text:#e8eaf2; --muted:#9aa1b5; --faint:#6c7488;
  --accent:#8b8bf5; --accent-2:#a78bfa; --accent-soft:#20233a;
  --p-BLOCKER:#ff6369; --p-HIGH:#ff9f45; --p-MEDIUM:#6b9bff; --p-LOW:#8a93a8;
  --st-open:#f0b64d; --st-done:#43c88a; --st-blocked:#ff6369; --st-progress:#6b9bff; --st-decision:#c08cf5;
  --ring-track:#262c3b;
}}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px 80px}

/* Top bar */
.topbar{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--border)}
.topbar .row{max-width:1180px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.2px}
.logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--accent-2));display:grid;place-items:center;color:#fff;font-size:15px;box-shadow:0 4px 12px -3px var(--accent)}
.brand small{font-weight:500;color:var(--muted)}
.ctxchip{font-size:12px;color:var(--muted);background:var(--panel);border:1px solid var(--border);padding:5px 10px;border-radius:999px;display:inline-flex;gap:8px;align-items:center}
.ctxchip b{color:var(--text);font-weight:600}
.grow{flex:1 1 auto}
.search{position:relative;min-width:210px;flex:0 1 300px}
.search input{width:100%;background:var(--panel);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:9px 12px 9px 34px;font-size:14px;outline:none;transition:border-color .15s,box-shadow .15s}
.search input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--faint)}
.iconbtn{background:var(--panel);border:1px solid var(--border);color:var(--muted);width:38px;height:38px;border-radius:10px;display:grid;place-items:center;cursor:pointer;transition:.15s}
.iconbtn:hover{color:var(--text);border-color:var(--accent)}

/* Tabs */
.tabs{display:flex;gap:4px;overflow-x:auto;padding:10px 0 0;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{appearance:none;background:transparent;border:0;color:var(--muted);font:inherit;font-weight:600;font-size:14px;padding:9px 14px;border-radius:10px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:7px;transition:.15s}
.tab:hover{color:var(--text);background:var(--panel)}
.tab[aria-selected="true"]{color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:0 6px 16px -8px var(--accent)}
.tab .badge{background:color-mix(in srgb,currentColor 16%,transparent);border-radius:999px;padding:1px 8px;font-size:12px;font-weight:700}
.tab[aria-selected="true"] .badge{background:rgba(255,255,255,.22)}

.panel{display:none;animation:fade .25s ease}
.panel.active{display:block}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

h2.sec{font-size:15px;letter-spacing:.3px;text-transform:uppercase;color:var(--faint);margin:26px 2px 12px;font-weight:700}

/* Hero */
.hero{display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;background:
  radial-gradient(1200px 200px at 0% 0%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 60%),
  var(--panel);border:1px solid var(--border);border-radius:var(--r);padding:22px 24px;box-shadow:var(--elev);margin-top:16px}
.ring{--sz:132px;width:var(--sz);height:var(--sz);position:relative;display:grid;place-items:center}
.ring svg{transform:rotate(-90deg)}
.ring .pct{position:absolute;text-align:center}
.ring .pct b{font-size:26px;font-weight:800;letter-spacing:-.5px}
.ring .pct span{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
.tile{background:var(--panel-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 15px;cursor:pointer;transition:.15s;position:relative;overflow:hidden}
.tile:hover{transform:translateY(-2px);border-color:var(--accent)}
.tile .n{font-size:26px;font-weight:800;letter-spacing:-.5px;line-height:1;color:var(--text)}
.tile .l{font-size:12.5px;color:var(--muted);margin-top:5px}
.tile .dot{position:absolute;right:12px;top:13px;width:9px;height:9px;border-radius:50%}

/* Cards / items */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.rec{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--elev);overflow:hidden;transition:.15s}
.card:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--border))}
.item{background:var(--panel);border:1px solid var(--border);border-radius:12px;transition:.15s}
.item:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--border))}
.item>summary{list-style:none;cursor:pointer;padding:13px 15px;display:flex;gap:11px;align-items:flex-start}
.item>summary::-webkit-details-marker{display:none}
.item[open]{box-shadow:var(--elev)}
.item .chev{margin-left:auto;color:var(--faint);transition:transform .2s;flex:0 0 auto;margin-top:2px}
.item[open] .chev{transform:rotate(90deg)}
.tt{font-weight:650;line-height:1.35}
.tt .meta{display:block;font-weight:500;color:var(--faint);font-size:12px;margin-top:3px}
.detail{padding:2px 15px 15px;border-top:1px solid var(--border);margin-top:2px}
.detail .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);font-weight:700;margin:13px 0 4px}
.detail p{margin:0;color:var(--muted)}
.detail code{background:var(--panel-2);border:1px solid var(--border);border-radius:5px;padding:1px 5px;font-size:12.5px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--text)}
.detail ul{margin:4px 0 0;padding-left:18px;color:var(--muted)}
.detail ul.crit{list-style:none;padding-left:0}
.detail ul.crit li{position:relative;padding-left:24px;margin:5px 0}
.detail ul.crit li::before{content:"";position:absolute;left:0;top:2px;width:16px;height:16px;border-radius:5px;border:1.5px solid var(--faint)}
.detail ul.crit li.met::before{content:"✓";background:var(--st-done);border-color:var(--st-done);color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:16px}
.filelink{font-family:ui-monospace,monospace;font-size:12px}

/* pills + badges */
.pill{font-size:11px;font-weight:800;letter-spacing:.4px;padding:3px 9px;border-radius:999px;color:#fff;flex:0 0 auto;margin-top:1px}
.p-BLOCKER{background:var(--p-BLOCKER)} .p-HIGH{background:var(--p-HIGH)} .p-MEDIUM{background:var(--p-MEDIUM)} .p-LOW{background:var(--p-LOW)}
.badge2{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:5px;border:1px solid transparent}
.st-open{color:var(--st-open);background:color-mix(in srgb,var(--st-open) 15%,transparent)}
.st-done{color:var(--st-done);background:color-mix(in srgb,var(--st-done) 15%,transparent)}
.st-blocked{color:var(--st-blocked);background:color-mix(in srgb,var(--st-blocked) 15%,transparent)}
.st-in-progress{color:var(--st-progress);background:color-mix(in srgb,var(--st-progress) 15%,transparent)}
.st-needs-decision{color:var(--st-decision);background:color-mix(in srgb,var(--st-decision) 15%,transparent)}
.st-dot{width:7px;height:7px;border-radius:50%;background:currentColor}
.chip{font-size:11.5px;color:var(--muted);background:var(--panel-2);border:1px solid var(--border);padding:2px 8px;border-radius:6px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}

/* group headers */
.ghead{display:flex;align-items:center;gap:12px;margin:24px 2px 12px}
.ghead h3{margin:0;font-size:17px;font-weight:750}
.gbar{flex:1 1 auto;height:7px;background:var(--ring-track);border-radius:999px;overflow:hidden;max-width:260px}
.gbar i{display:block;height:100%;background:linear-gradient(90deg,var(--st-done),color-mix(in srgb,var(--st-done) 70%,var(--accent)))}
.gcount{font-size:13px;color:var(--muted)}

/* controls (All items) */
.controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0 4px}
.select{background:var(--panel);border:1px solid var(--border);color:var(--text);border-radius:9px;padding:8px 11px;font:inherit;font-size:13.5px;cursor:pointer;outline:none}
.select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.count-note{font-size:13px;color:var(--muted);margin-left:auto}

.empty{text-align:center;color:var(--muted);padding:44px 20px;border:1px dashed var(--border);border-radius:var(--r);background:var(--panel)}
.empty .big{font-size:34px;margin-bottom:6px}

.provwrap{background:var(--panel);border:1px solid var(--border);border-radius:var(--r);padding:6px 18px 16px;box-shadow:var(--elev)}
.provwrap pre{white-space:pre-wrap;font:13px/1.55 ui-monospace,monospace;color:var(--muted);margin:10px 0 0}

footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--border);color:var(--faint);font-size:12.5px;text-align:center}
footer code{font-family:ui-monospace,monospace}
@media(max-width:640px){.hero{grid-template-columns:1fr;justify-items:center;text-align:center}.count-note{margin-left:0;width:100%}}
`;

const SCRIPT = String.raw`
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("chaos-data").textContent);
  var items = DATA.items;
  var TERMINAL = {done:1,"wont-do":1,superseded:1};
  var PR = {BLOCKER:0,HIGH:1,MEDIUM:2,LOW:3};
  var TR = {"public-alpha":0,v1:1,vNext:2,later:3};
  var TLABEL = {"public-alpha":"Public alpha",v1:"v1",vNext:"vNext",later:"Later",unassigned:"Unassigned"};
  var isOpen = function(it){return !TERMINAL[it.status];};
  var esc = function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});};
  // minimal, safe inline markdown -> html (escape first, then whitelist code/bold/em)
  function md(s){
    if(!s) return "";
    return esc(s)
      .replace(/\`([^\`]+)\`/g,"<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,"$1<em>$2</em>");
  }
  function mdLines(s){ // render a "- item" list or paragraphs
    if(!s) return "";
    var lines=s.split(/\n/), out=[], list=null;
    lines.forEach(function(ln){
      var m=ln.match(/^\s*[-*]\s+(.*)$/);
      if(m){ if(!list){list=[];} list.push("<li>"+md(m[1])+"</li>"); }
      else { if(list){out.push("<ul>"+list.join("")+"</ul>");list=null;} if(ln.trim())out.push("<p>"+md(ln)+"</p>"); }
    });
    if(list)out.push("<ul>"+list.join("")+"</ul>");
    return out.join("");
  }
  function critList(item){
    var arr=item.closureCriteria||[];
    if(!arr.length) return "";
    return "<ul class=\"crit\">"+arr.map(function(c){
      var met=/✓|\bmet\b|\(met\)/i.test(c)|| item.status && TERMINAL[item.status];
      return "<li class=\""+(met?"met":"")+"\">"+md(c.replace(/\s*✓\s*$/,""))+"</li>";
    }).join("")+"</ul>";
  }
  var stCls={open:"st-open","in-progress":"st-in-progress",blocked:"st-blocked","needs-decision":"st-needs-decision",done:"st-done","wont-do":"st-done",superseded:"st-done",stale:"st-blocked"};
  function statusBadge(it){var c=stCls[it.status]||"st-open";return "<span class=\"badge2 "+c+"\"><span class=\"st-dot\"></span>"+esc(it.status)+"</span>";}

  function itemCard(it){
    var meta=[it.type,it.target,(it.sourceIds||[]).join(", ")].filter(Boolean).join(" · ");
    var d=document.createElement("details");
    d.className="item"; d.dataset.id=it.id;
    var evidence=(it.sourceIds||[]).map(function(s){return "<span class=\"chip\">"+esc(s)+"</span>";}).join("");
    var whyHtml = it.why?mdLines(it.why):"";
    var nextHtml = isOpen(it)&&it.nextAction?("<div class=\"lbl\">Next action</div>"+mdLines(it.nextAction)) : "";
    var histHtml = it.history?("<div class=\"lbl\">History</div>"+mdLines(it.history)) : "";
    d.innerHTML =
      "<summary>"+
        "<span class=\"pill p-"+esc(it.priority)+"\">"+esc(it.priority)+"</span>"+
        "<span class=\"tt\">"+esc(it.title)+"<span class=\"meta\">"+esc(meta)+"</span></span>"+
        statusBadge(it)+
        "<span class=\"chev\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\"><path d=\"M9 6l6 6-6 6\"/></svg></span>"+
      "</summary>"+
      "<div class=\"detail\">"+
        (whyHtml?("<div class=\"lbl\">Why this exists</div>"+whyHtml):"")+
        nextHtml+
        (it.closureCriteria&&it.closureCriteria.length?("<div class=\"lbl\">Closure criteria</div>"+critList(it)):"")+
        (evidence?("<div class=\"lbl\">Source evidence</div><div class=\"chips\">"+evidence+"</div>"):"")+
        histHtml+
        "<div class=\"lbl\">Item file</div><p class=\"filelink\"><a href=\"../items/"+esc(it.file)+"\">../items/"+esc(it.file)+"</a>"+
          (it.owner&&it.owner!=="TBD"?(" · owner: "+esc(it.owner)):"")+"</p>"+
      "</div>";
    return d;
  }

  // ---- summary ----
  var openArr=items.filter(isOpen), doneArr=items.filter(function(i){return !isOpen(i);});
  var sum={total:items.length,open:openArr.length,done:doneArr.length,
    donePct:items.length?Math.round(doneArr.length/items.length*100):0,
    blockers:openArr.filter(function(i){return i.priority==="BLOCKER";}).length,
    stale:items.filter(function(i){return i.status==="stale";}).length,
    decision:items.filter(function(i){return i.status==="needs-decision";}).length};

  function recommended(){
    return openArr.slice().sort(function(a,b){
      var pa=PR[a.priority]==null?9:PR[a.priority], pb=PR[b.priority]==null?9:PR[b.priority];
      if(pa!==pb)return pa-pb;
      var ta=TR[a.target]==null?9:TR[a.target], tb=TR[b.target]==null?9:TR[b.target];
      if(ta!==tb)return ta-tb;
      if(a.createdAt!==b.createdAt)return a.createdAt<b.createdAt?-1:1;
      return a.id<b.id?-1:1;
    }).slice(0,5);
  }
  function groupBy(keyFn,order){
    var m={}; items.forEach(function(it){var k=keyFn(it)||"unassigned";(m[k]=m[k]||[]).push(it);});
    return Object.keys(m).sort(function(a,b){
      var ra=order[a]==null?99:order[a], rb=order[b]==null?99:order[b];
      return ra-rb||(a<b?-1:1);
    }).map(function(k){return {key:k,items:m[k]};});
  }
  function sortItems(a,b){
    var oa=isOpen(a)?0:1,ob=isOpen(b)?0:1; if(oa!==ob)return oa-ob;
    var pa=PR[a.priority]==null?9:PR[a.priority],pb=PR[b.priority]==null?9:PR[b.priority]; if(pa!==pb)return pa-pb;
    var ta=TR[a.target]==null?9:TR[a.target],tb=TR[b.target]==null?9:TR[b.target]; if(ta!==tb)return ta-tb;
    return a.id<b.id?-1:1;
  }

  // ---- render helpers ----
  function frag(nodes){var f=document.createDocumentFragment();nodes.forEach(function(n){f.appendChild(n);});return f;}
  function el(html){var t=document.createElement("template");t.innerHTML=html.trim();return t.content.firstChild;}
  function groupHeader(label,its){
    var o=its.filter(isOpen).length,dn=its.length-o,pct=its.length?Math.round(dn/its.length*100):0;
    return el("<div class=\"ghead\"><h3>"+esc(label)+"</h3><div class=\"gbar\"><i style=\"width:"+pct+"%\"></i></div><span class=\"gcount\">"+o+" open · "+dn+" done</span></div>");
  }

  // ---- panels ----
  function renderOverview(root){
    root.innerHTML="";
    var ring=(function(){
      var r=52,c=2*Math.PI*r,off=c*(1-sum.donePct/100);
      return "<div class=\"ring\"><svg width=\"132\" height=\"132\" viewBox=\"0 0 132 132\">"+
        "<circle cx=\"66\" cy=\"66\" r=\""+r+"\" fill=\"none\" stroke=\"var(--ring-track)\" stroke-width=\"12\"/>"+
        "<circle cx=\"66\" cy=\"66\" r=\""+r+"\" fill=\"none\" stroke=\"url(#g)\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-dasharray=\""+c+"\" stroke-dashoffset=\""+off+"\"/>"+
        "<defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"var(--st-done)\"/><stop offset=\"1\" stop-color=\"var(--accent)\"/></linearGradient></defs>"+
        "</svg><div class=\"pct\"><b>"+sum.donePct+"%</b><span>complete</span></div></div>";
    })();
    var tiles=[
      {n:sum.open,l:"Open items",c:"var(--st-open)",f:{status:"open"}},
      {n:sum.done,l:"Done",c:"var(--st-done)",f:{status:"done"}},
      {n:sum.blockers,l:"Open blockers",c:"var(--p-BLOCKER)",f:{priority:"BLOCKER",status:"open"}},
      {n:sum.stale,l:"Stale",c:"var(--st-blocked)",f:{status:"stale"}},
      {n:sum.decision,l:"Needs decision",c:"var(--st-needs-decision,#a259e6)",f:{status:"needs-decision"}}
    ].map(function(t){return "<button class=\"tile\" data-jump='"+JSON.stringify(t.f)+"'><span class=\"dot\" style=\"background:"+t.c+"\"></span><div class=\"n\">"+t.n+"</div><div class=\"l\">"+t.l+"</div></button>";}).join("");
    root.appendChild(el("<div class=\"hero\">"+ring+"<div class=\"tiles\">"+tiles+"</div></div>"));

    root.appendChild(el("<h2 class=\"sec\">★ Recommended next</h2>"));
    var rec=recommended();
    if(rec.length){
      var wrap=el("<div class=\"rec\"></div>");
      rec.forEach(function(it){wrap.appendChild(itemCard(it));});
      root.appendChild(wrap);
    } else root.appendChild(el("<div class=\"empty\"><div class=\"big\">🎉</div>Nothing open — backlog clear.</div>"));

    if(DATA.provenance){
      root.appendChild(el("<h2 class=\"sec\">Provenance & context</h2>"));
      root.appendChild(el("<div class=\"provwrap\"><pre>"+esc(DATA.provenance)+"</pre></div>"));
    }
  }
  function renderGrouped(root,groups){
    root.innerHTML="";
    groups.forEach(function(g){
      root.appendChild(groupHeader(TLABEL[g.key]||g.key,g.items));
      var wrap=el("<div class=\"grid\"></div>");
      g.items.slice().sort(sortItems).forEach(function(it){wrap.appendChild(itemCard(it));});
      root.appendChild(wrap);
    });
  }
  function renderBlockers(root){
    root.innerHTML="";
    var b=openArr.filter(function(i){return i.priority==="BLOCKER";}).sort(sortItems);
    if(!b.length){root.appendChild(el("<div class=\"empty\"><div class=\"big\">🛡️</div>No open blockers. Nothing is gating a release.</div>"));return;}
    var wrap=el("<div class=\"grid\"></div>");
    b.forEach(function(it){wrap.appendChild(itemCard(it));});
    root.appendChild(wrap);
  }

  // ---- All items (search + filters + sort) ----
  var state={q:"",status:"all",priority:"all",target:"all",sort:"smart"};
  function renderAll(root){
    root.innerHTML="";
    var targets=Object.keys(items.reduce(function(a,i){a[i.target||"unassigned"]=1;return a;},{}));
    targets.sort(function(a,b){return (TR[a]==null?9:TR[a])-(TR[b]==null?9:TR[b]);});
    var opt=function(v,l){return "<option value=\""+esc(v)+"\">"+esc(l)+"</option>";};
    root.appendChild(el("<div class=\"controls\">"+
      "<select class=\"select\" id=\"f-status\"><option value=\"all\">All statuses</option>"+opt("open","Open")+opt("done","Done")+opt("needs-decision","Needs decision")+opt("stale","Stale")+"</select>"+
      "<select class=\"select\" id=\"f-priority\"><option value=\"all\">All priorities</option>"+["BLOCKER","HIGH","MEDIUM","LOW"].map(function(p){return opt(p,p);}).join("")+"</select>"+
      "<select class=\"select\" id=\"f-target\"><option value=\"all\">All targets</option>"+targets.map(function(t){return opt(t,TLABEL[t]||t);}).join("")+"</select>"+
      "<select class=\"select\" id=\"f-sort\">"+opt("smart","Sort: smart")+opt("priority","Priority")+opt("title","Title")+opt("target","Target")+"</select>"+
      "<span class=\"count-note\" id=\"allcount\"></span></div>"));
    var list=el("<div class=\"grid\" id=\"alllist\"></div>");
    root.appendChild(list);
    ["status","priority","target","sort"].forEach(function(k){
      var sel=root.querySelector("#f-"+k); sel.value=state[k==="sort"?"sort":k];
      sel.addEventListener("change",function(){state[k]=sel.value;paintAll();});
    });
    paintAll();
  }
  function matchStatus(it){
    if(state.status==="all")return true;
    if(state.status==="done")return !isOpen(it);
    if(state.status==="open")return isOpen(it);
    return it.status===state.status;
  }
  function paintAll(){
    var list=document.getElementById("alllist"); if(!list)return;
    var q=state.q.toLowerCase();
    var arr=items.filter(function(it){
      if(!matchStatus(it))return false;
      if(state.priority!=="all"&&it.priority!==state.priority)return false;
      if(state.target!=="all"&&(it.target||"unassigned")!==state.target)return false;
      if(q){var hay=(it.title+" "+it.id+" "+(it.type||"")+" "+(it.target||"")+" "+(it.sourceIds||[]).join(" ")).toLowerCase();if(hay.indexOf(q)<0)return false;}
      return true;
    });
    if(state.sort==="title")arr.sort(function(a,b){return a.title.toLowerCase()<b.title.toLowerCase()?-1:1;});
    else if(state.sort==="priority")arr.sort(function(a,b){return (PR[a.priority]-PR[b.priority])||(a.id<b.id?-1:1);});
    else if(state.sort==="target")arr.sort(function(a,b){return ((TR[a.target]==null?9:TR[a.target])-(TR[b.target]==null?9:TR[b.target]))||sortItems(a,b);});
    else arr.sort(sortItems);
    list.innerHTML="";
    if(!arr.length){list.appendChild(el("<div class=\"empty\" style=\"grid-column:1/-1\"><div class=\"big\">🔍</div>No items match your filters.</div>"));}
    else arr.forEach(function(it){list.appendChild(itemCard(it));});
    var c=document.getElementById("allcount"); if(c)c.textContent=arr.length+" of "+items.length+" items";
  }

  // ---- tabs ----
  var TABS=[
    {id:"overview",label:"Overview",render:renderOverview},
    {id:"target",label:"By target",render:function(r){renderGrouped(r,groupBy(function(i){return i.target;},TR));}},
    {id:"type",label:"By type",render:function(r){renderGrouped(r,groupBy(function(i){return i.type;},{}));}},
    {id:"blockers",label:"Blockers",render:renderBlockers,badge:sum.blockers},
    {id:"all",label:"All items",render:renderAll,badge:items.length}
  ];
  var rendered={};
  function activate(id){
    TABS.forEach(function(t){
      var btn=document.getElementById("tab-"+t.id), pan=document.getElementById("pan-"+t.id);
      var on=t.id===id;
      btn.setAttribute("aria-selected",on?"true":"false");
      pan.classList.toggle("active",on);
      if(on&&!rendered[id]){t.render(pan);rendered[id]=true;}
    });
    if(location.hash!=="#"+id){history.replaceState(null,"","#"+id);}
  }

  // ---- build shell ----
  function build(){
    var tabsEl=document.getElementById("tabs");
    TABS.forEach(function(t){
      var b=document.createElement("button");
      b.className="tab";b.id="tab-"+t.id;b.setAttribute("role","tab");b.setAttribute("aria-selected","false");
      b.innerHTML=esc(t.label)+(t.badge!=null?" <span class=\"badge\">"+t.badge+"</span>":"");
      b.addEventListener("click",function(){activate(t.id);});
      tabsEl.appendChild(b);
      var p=document.createElement("section");p.className="panel";p.id="pan-"+t.id;p.setAttribute("role","tabpanel");
      document.getElementById("panels").appendChild(p);
    });
    var start=(location.hash||"").replace("#","");
    activate(TABS.some(function(t){return t.id===start;})?start:"overview");

    // search (affects All; also jumps to All when typing)
    var search=document.getElementById("search");
    search.addEventListener("input",function(){
      state.q=search.value;
      if(state.q&&document.getElementById("pan-all").classList.contains("active")===false){activate("all");}
      paintAll();
    });
    // tile jump
    document.addEventListener("click",function(e){
      var t=e.target.closest("[data-jump]"); if(!t)return;
      var f=JSON.parse(t.getAttribute("data-jump"));
      state.status=f.status||"all";state.priority=f.priority||"all";state.target="all";state.q="";search.value="";
      activate("all");
      var s=document.getElementById("f-status"),p=document.getElementById("f-priority");
      if(s)s.value=state.status; if(p)p.value=state.priority; paintAll();
    });
    // theme
    var tkey="chaos-todo-theme";
    var setTheme=function(m){if(m==="auto"){document.documentElement.removeAttribute("data-theme");}else{document.documentElement.setAttribute("data-theme",m);}try{localStorage.setItem(tkey,m);}catch(e){}};
    var cur;try{cur=localStorage.getItem(tkey);}catch(e){}
    if(cur)setTheme(cur);
    document.getElementById("theme").addEventListener("click",function(){
      var now=document.documentElement.getAttribute("data-theme");
      setTheme(now==="dark"?"light":now==="light"?"auto":"dark");
    });
  }
  build();
})();
`;

export function renderPage(data) {
  const ctx = data.context || {};
  const html =
`<!DOCTYPE html>
<!-- Generated by chaos:todo (tools/chaos-todo-views). Do not edit manually. Durable todo items live under .chaos/todo/items/. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<title>CHAOS Backlog</title>
<style>${CSS}</style>
</head>
<body>
<div class="topbar"><div class="row">
  <div class="brand"><span class="logo">C</span><span>CHAOS Backlog<br><small>Todo dashboard</small></span></div>
  <span class="ctxchip"><b>${escAttr(ctx.provider || 'unknown')}</b> / ${escAttr(ctx.branch || 'unknown')} · context ${escAttr(ctx.confidence || 'LOW')}</span>
  <div class="grow"></div>
  <div class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="search" type="search" placeholder="Search backlog…" aria-label="Search backlog"></div>
  <button class="iconbtn" id="theme" title="Toggle theme" aria-label="Toggle theme"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
</div>
<div class="row" style="padding-top:0"><div class="tabs" id="tabs" role="tablist"></div></div>
</div>
<main class="wrap"><div id="panels"></div>
<footer>Generated ${escAttr(data.generatedAt)} · <code>${escAttr(data.sourceCommand || 'chaos:todo --refresh')}</code> · Generated artifact — not source of truth. Source of truth: <code>.chaos/todo/items/</code>. Regenerate with <code>node tools/chaos-todo-views/generate.mjs</code>.</footer>
</main>
<script type="application/json" id="chaos-data">${embedJson(data)}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
  return html;
}

function escAttr(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
