
import { useEffect, useMemo, useState } from "react";
import { Clipboard, ExternalLink, Search, RefreshCcw, Check } from "lucide-react";

export default function App(){
  const [data, setData] = useState([]); // [{ fane, kategori, prompt }]
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("pv53_tab") || "");
  const [category, setCategory] = useState(() => localStorage.getItem("pv53_cat") || "");
  const [q, setQ] = useState("");
  const [count, setCount] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(()=>localStorage.setItem("pv53_tab", activeTab),[activeTab]);
  useEffect(()=>localStorage.setItem("pv53_cat", category),[category]);

  async function loadJson(){
    try{
      const res = await fetch("/prompts.json", { cache:"no-store" });
      const json = await res.json();
      setData(json);
      setCount(json.length);
      if(!activeTab && json.length){ setActiveTab(json[0].fane); }
    }catch(e){ console.error(e); alert("Kunne ikke læse prompts.json"); }
  }
  useEffect(()=>{ loadJson(); },[]);

  const tabs = useMemo(()=> Array.from(new Set(data.map(x=>x.fane))), [data]);

  // Category counts for overview
  const catCounts = useMemo(()=>{
    const map = new Map();
    for(const x of data){
      if(activeTab && x.fane!==activeTab) continue;
      const key = x.kategori || "(uden kategori)";
      map.set(key, (map.get(key)||0)+1);
    }
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  },[data, activeTab]);

  const categories = useMemo(()=> catCounts.map(([k])=>k), [catCounts]);

  const visiblePrompts = useMemo(()=>{
    return data
      .filter(x => (!activeTab || x.fane===activeTab) && (!category || x.kategori===category))
      .map(x=>x.prompt)
      .filter(p => p && (!q || p.toLowerCase().includes(q.toLowerCase())));
  },[data, activeTab, category, q]);

  function copy(t, idx){
    navigator.clipboard?.writeText(t).then(()=>{
      setCopiedIndex(idx);
      setTimeout(()=> setCopiedIndex(null), 1200);
    }).catch(()=>{});
  }
  function openChatGPT(){ window.open("https://chat.openai.com/", "_blank"); }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 to-slate-800 text-white border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold leading-tight">Prompt Vault <span className="opacity-75">v5.3</span></h1>
            <p className="text-xs opacity-80">{count.toLocaleString()} prompts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openChatGPT} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20">
              <ExternalLink className="w-4 h-4" /> Åbn ChatGPT
            </button>
            <button onClick={loadJson} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-900">
              <RefreshCcw className="w-4 h-4" /> Genindlæs
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {tabs.map(t => (
              <button key={t} onClick={()=>{setActiveTab(t); setCategory("");}} className={"px-3 py-1.5 rounded-full border text-sm whitespace-nowrap " + (activeTab===t ? "bg-white text-slate-900 border-white" : "bg-transparent border-white/30 text-white/90 hover:bg-white/10")}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar categories */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Søg i prompts…" className="w-full pl-9 rounded-xl border border-slate-300 px-3 py-2" />
              </div>
            </div>
            <div className="p-3">
              <button onClick={()=>setCategory("")} className={"w-full text-left px-3 py-2 rounded-lg mb-1 " + (category==="" ? "bg-slate-900 text-white" : "hover:bg-slate-100")}>
                Alle kategorier <span className="text-xs opacity-70">({catCounts.reduce((a, [,n])=>a+n,0)})</span>
              </button>
              <div className="max-h-[55vh] overflow-y-auto pr-1">
                {catCounts.map(([name, n]) => (
                  <button key={name} onClick={()=>setCategory(name)} className={"w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center justify-between " + (category===name ? "bg-slate-900 text-white" : "hover:bg-slate-100")}>
                    <span className="truncate">{name}</span>
                    <span className={"ml-2 text-xs rounded-full px-2 py-0.5 " + (category===name ? "bg-white/20" : "bg-slate-200")}>{n}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Prompt list */}
        <main className="lg:col-span-2">
          <ul className="space-y-3">
            {visiblePrompts.map((p, idx) => (
              <li key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <pre className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">{p}</pre>
                <div className="mt-3">
                  <button onClick={()=>copy(p, idx)} className={"inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition " + (copiedIndex===idx ? "bg-emerald-600 border-emerald-700 text-white" : "bg-white border-slate-300 hover:bg-slate-50")}>
                    {copiedIndex===idx ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                    {copiedIndex===idx ? "Kopieret!" : "Kopiér"}
                  </button>
                </div>
              </li>
            ))}
            {visiblePrompts.length===0 && <li className="text-slate-500">Ingen prompts matcher.</li>}
          </ul>
        </main>
      </div>

      <footer className="text-center text-xs text-slate-500 py-6">
        <p>Data hentes fra <code>public/prompts.json</code>. Du kan opdatere filen uden rebuild.</p>
      </footer>
    </div>
  );
}
