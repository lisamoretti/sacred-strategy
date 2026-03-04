import React, { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://pjeqshxppchoyozqvcqo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZXFzaHhwcGNob3lvenF2Y3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDA3MjYsImV4cCI6MjA4Nzk3NjcyNn0.ZdE1gd5QmQHd-8VfmU9m3SWl580XG2cT2eT_t7zojA8";

const db = {
  async get(table, query = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
    });
    return res.json();
  },
  async post(table, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async patch(table, id, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  }
};

const SAGE = "#7C9A7E";
const GOLD = "#C9A84C";
const DARK = "#1A1A18";
const CREAM = "#FAF8F3";
const WARM = "#F5F0E8";

const ALIGNMENT_QUESTIONS = [
  "I feel clear and focused on my one strategy",
  "I am operating from abundance, not fear",
  "My actions this week matched my highest vision",
  "I am fully present with my clients / prospects",
  "I feel energized, not depleted, by my work",
];

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,24,0.75)", zIndex: 100, overflowY: "auto", padding: "32px 16px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 560, margin: "0 auto", padding: 36, position: "relative", border: "1px solid rgba(201,168,76,0.2)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #C9A84C88, transparent)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 22, fontWeight: 300, fontStyle: "italic" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#bbb", lineHeight: 1, padding: "0 4px" }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "Jost, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 6 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", fontFamily: "Cormorant Garamond, serif", fontSize: 15, color: "#1A1A18", background: "#F5F0E8", border: "1px solid rgba(201,168,76,0.25)", padding: "10px 14px", outline: "none" }} />
    </div>
  );
}

function SaveBtn({ onClick, loading, label = "Save" }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ fontFamily: "Jost, sans-serif", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#1A1A18", color: "#C9A84C", border: "none", padding: "14px 36px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
      {loading ? "Saving..." : label}
    </button>
  );
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [client, setClient] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [standingActions, setStandingActions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);

  const [clientForm, setClientForm] = useState({ name: "", offer: "", strategy: "", revenue_goal: "", start_date: "", strategy_commit_days: "60" });
  const [revenueForm, setRevenueForm] = useState({ month: "", amount: "" });
  const [checkinForm, setCheckinForm] = useState({ flow_state: "flow", alignment_scores: [4,4,4,4,4], actions: [], reflection: "", week_of: new Date().toISOString().slice(0,10), editId: null });
  const [directiveForm, setDirectiveForm] = useState("");
  const [strategyForm, setStrategyForm] = useState({ strategy: "", strategy_commit_days: "60", start_date: "" });
  const [indicatorsForm, setIndicatorsForm] = useState([]);
  const [newStandingAction, setNewStandingAction] = useState({ action: "", committed: "" });
  const [newOneOffAction, setNewOneOffAction] = useState({ action: "", committed: "" });

  const loadClients = useCallback(async () => {
    const data = await db.get("clients", "?order=created_at.asc");
    if (Array.isArray(data)) {
      setClients(data);
      if (data.length > 0 && !activeClientId) setActiveClientId(data[0].id);
    }
    setLoading(false);
  }, [activeClientId]);

  const loadClientData = useCallback(async (id) => {
    if (!id) return;
    const [c, rev, ci, ind, sa] = await Promise.all([
      db.get("clients", `?id=eq.${id}`),
      db.get("revenue_entries", `?client_id=eq.${id}&order=created_at.asc`),
      db.get("checkins", `?client_id=eq.${id}&order=created_at.desc&limit=10`),
      db.get("strategy_indicators", `?client_id=eq.${id}&order=created_at.asc`),
      db.get("standing_actions", `?client_id=eq.${id}&order=created_at.asc`),
    ]);
    if (Array.isArray(c) && c.length > 0) setClient(c[0]);
    if (Array.isArray(rev)) setRevenueData(rev);
    if (Array.isArray(ci)) setCheckins(ci);
    if (Array.isArray(ind)) { setIndicators(ind); setIndicatorsForm(ind.map(i => ({ ...i }))); }
    if (Array.isArray(sa)) setStandingActions(sa);
  }, []);

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { if (activeClientId) loadClientData(activeClientId); }, [activeClientId]);

  const totalRevenue = revenueData.reduce((s, d) => s + Number(d.amount), 0);
  const revenueGoal = Number(client?.revenue_goal || 1);
  const revenueProgress = Math.min((totalRevenue / revenueGoal) * 100, 100);
  const latestRevenue = revenueData.length > 0 ? Number(revenueData[revenueData.length - 1].amount) : 0;
  const prevRevenue = revenueData.length > 1 ? Number(revenueData[revenueData.length - 2].amount) : latestRevenue;
  const revGrowth = prevRevenue > 0 ? Math.round(((latestRevenue - prevRevenue) / prevRevenue) * 100) : 0;
  const maxBar = Math.max(...revenueData.map(d => Number(d.amount)), 1);
  const latestCheckin = checkins[0];
  const alignmentScores = latestCheckin?.alignment_scores || [4,4,4,4,4];
  const avgAlignment = (alignmentScores.reduce((a,b) => a+b, 0) / alignmentScores.length).toFixed(1);
  const flowState = latestCheckin?.flow_state || "flow";
  const latestActions = latestCheckin?.actions || [];
  const completedActions = latestActions.filter(a => Number(a.done) >= Number(a.committed)).length;
  const actionScore = latestActions.length > 0 ? Math.round((completedActions / latestActions.length) * 100) : 0;
  const startDate = client?.start_date ? new Date(client.start_date) : new Date();
  const strategyDaysActive = Math.max(0, Math.floor((new Date() - startDate) / 86400000));
  const strategyCommitDays = Number(client?.strategy_commit_days || 60);
  const strategyProgress = Math.min((strategyDaysActive / strategyCommitDays) * 100, 100);

  const saveClient = async (isEdit) => {
    setSaving(true);
    const body = { name: clientForm.name, offer: clientForm.offer, strategy: clientForm.strategy, revenue_goal: Number(clientForm.revenue_goal), start_date: clientForm.start_date, strategy_commit_days: Number(clientForm.strategy_commit_days) };
    if (isEdit && client) { await db.patch("clients", client.id, body); await loadClientData(activeClientId); }
    else { const res = await db.post("clients", body); if (Array.isArray(res) && res[0]) { await loadClients(); setActiveClientId(res[0].id); } }
    setSaving(false); setModal(null);
  };

  const saveRevenue = async () => {
    setSaving(true);
    await db.post("revenue_entries", { client_id: activeClientId, month: revenueForm.month, amount: Number(revenueForm.amount) });
    await loadClientData(activeClientId);
    setRevenueForm({ month: "", amount: "" });
    setSaving(false); setModal(null);
  };

  const deleteRevenue = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await db.delete("revenue_entries", id);
    await loadClientData(activeClientId);
  };

  const addStandingAction = async () => {
    if (!newStandingAction.action || !newStandingAction.committed) return;
    setSaving(true);
    await db.post("standing_actions", { client_id: activeClientId, action: newStandingAction.action, committed: Number(newStandingAction.committed) });
    setNewStandingAction({ action: "", committed: "" });
    await loadClientData(activeClientId);
    setSaving(false);
  };

  const deleteStandingAction = async (id) => {
    await db.delete("standing_actions", id);
    await loadClientData(activeClientId);
  };

  const openAddCheckin = () => {
    const preloaded = standingActions.map(sa => ({ action: sa.action, committed: sa.committed, done: 0, standing: true }));
    setCheckinForm({ flow_state: "flow", alignment_scores: [4,4,4,4,4], actions: preloaded, reflection: "", week_of: new Date().toISOString().slice(0,10), editId: null });
    setNewOneOffAction({ action: "", committed: "" });
    setModal("addCheckin");
  };

  const addOneOffAction = () => {
    if (!newOneOffAction.action || !newOneOffAction.committed) return;
    setCheckinForm(f => ({ ...f, actions: [...f.actions, { action: newOneOffAction.action, committed: Number(newOneOffAction.committed), done: 0, standing: false }] }));
    setNewOneOffAction({ action: "", committed: "" });
  };

  const saveCheckin = async () => {
    setSaving(true);
    const payload = { client_id: activeClientId, week_of: checkinForm.week_of, flow_state: checkinForm.flow_state, alignment_scores: checkinForm.alignment_scores, actions: checkinForm.actions, reflection: checkinForm.reflection };
    if (checkinForm.editId) {
      await db.patch("checkins", checkinForm.editId, payload);
    } else {
      await db.post("checkins", payload);
    }
    await loadClientData(activeClientId);
    setSaving(false); setModal(null);
  };

  const saveDirective = async () => {
    setSaving(true);
    await db.patch("clients", client.id, { advisor_note: directiveForm });
    await loadClientData(activeClientId);
    setSaving(false); setModal(null);
  };

  const saveStrategy = async () => {
    setSaving(true);
    await db.patch("clients", client.id, { strategy: strategyForm.strategy, strategy_commit_days: Number(strategyForm.strategy_commit_days), start_date: strategyForm.start_date });
    await loadClientData(activeClientId);
    setSaving(false); setModal(null);
  };

  const saveIndicators = async () => {
    setSaving(true);
    for (const ind of indicatorsForm) {
      if (ind.id) await db.patch("strategy_indicators", ind.id, { score: Number(ind.score), label: ind.label });
      else await db.post("strategy_indicators", { client_id: activeClientId, label: ind.label, score: Number(ind.score) });
    }
    await loadClientData(activeClientId);
    setSaving(false); setModal(null);
  };

  if (loading) return (
    <div style={{ fontFamily: "Cormorant Garamond, serif", background: "#FAF8F3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontStyle: "italic", fontWeight: 300, color: "#1A1A18", marginBottom: 12 }}>Loading...</div>
        <div style={{ height: 1, width: 100, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)", margin: "0 auto" }} />
      </div>
    </div>
  );

  const G = "#C9A84C"; const S = "#7C9A7E"; const D = "#1A1A18"; const C = "#FAF8F3"; const W = "#F5F0E8";

  return (
    <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", background: C, minHeight: "100vh", color: D }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sans { font-family: 'Jost', sans-serif; }
        .gold-line { height: 1px; background: linear-gradient(90deg, transparent, #C9A84C, transparent); }
        .card { background: white; border: 1px solid rgba(201,168,76,0.18); border-radius: 2px; padding: 28px; position: relative; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #C9A84C88, transparent); }
        .tag { font-family: 'Jost', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #C9A84C; }
        .tab-btn { font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; background: none; border: none; cursor: pointer; padding: 8px 20px; transition: all 0.2s; }
        .pulse-ring { position: relative; }
        .pulse-ring::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid rgba(201,168,76,0.3); animation: pulse 2.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.05); } }
        .icon-btn { background: none; border: 1px solid rgba(201,168,76,0.3); color: #C9A84C; font-family: 'Jost',sans-serif; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 14px; cursor: pointer; transition: all 0.2s; }
        .icon-btn:hover { background: rgba(201,168,76,0.07); }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 3px; background: #e8e4dc; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #C9A84C; cursor: pointer; }
        .abadge { font-family:'Jost',sans-serif; font-size:8px; letter-spacing:0.1em; text-transform:uppercase; padding:2px 7px; border-radius:10px; }
      `}</style>

      <div style={{ background: D, padding: "0 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 0" }}>
          <div>
            <div className="tag" style={{ color: G, marginBottom: 4 }}>Sacred Strategy</div>
            <div style={{ fontSize: 22, fontWeight: 300, color: "white" }}>Client Dashboard</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {clients.map(c => (
              <button key={c.id} onClick={() => { setActiveClientId(c.id); setActiveTab("overview"); }}
                style={{ fontFamily: "Jost,sans-serif", fontSize: 11, letterSpacing: "0.08em", padding: "6px 16px", cursor: "pointer", border: `1px solid ${c.id === activeClientId ? G : "#444"}`, background: c.id === activeClientId ? "rgba(201,168,76,0.13)" : "none", color: c.id === activeClientId ? G : "#777", transition: "all 0.2s" }}>
                {c.name.split(" ")[0]}
              </button>
            ))}
            <button className="icon-btn" style={{ color: "#777", borderColor: "#333" }}
              onClick={() => { setClientForm({ name:"",offer:"",strategy:"",revenue_goal:"",start_date:new Date().toISOString().slice(0,10),strategy_commit_days:"60" }); setModal("addClient"); }}>
              + Client
            </button>
            {client && (
              <div style={{ width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,rgba(201,168,76,0.27),rgba(124,154,126,0.27))",border:`1.5px solid rgba(201,168,76,0.4)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Jost",fontSize:12,color:G }}>
                {client.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
            )}
          </div>
        </div>
        <div className="gold-line" style={{ opacity:0.3 }} />
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex" }}>
          {["overview","check-in","strategy"].map(tab => (
            <button key={tab} className="tab-btn"
              style={{ color: activeTab===tab ? G : "#555", borderBottom: activeTab===tab ? `1.5px solid ${G}` : "1.5px solid transparent" }}
              onClick={() => setActiveTab(tab)}>
              {tab==="overview" ? "Overview" : tab==="check-in" ? "Weekly Check-In" : "GTM Focus"}
            </button>
          ))}
        </div>
      </div>

      {!client && !loading ? (
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"80px 40px",textAlign:"center" }}>
          <div style={{ fontSize:32,fontWeight:300,fontStyle:"italic",marginBottom:12 }}>No clients yet</div>
          <div className="sans" style={{ fontSize:13,color:"#999",marginBottom:32 }}>Add your first client to begin.</div>
          <button className="icon-btn" onClick={() => { setClientForm({name:"",offer:"",strategy:"",revenue_goal:"",start_date:new Date().toISOString().slice(0,10),strategy_commit_days:"60"}); setModal("addClient"); }}>+ Add First Client</button>
        </div>
      ) : (
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"36px 40px" }}>

          {activeTab==="overview" && client && (
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:28,fontWeight:300,fontStyle:"italic" }}>{client.name}</div>
                  <div className="sans" style={{ fontSize:12,color:"#999",letterSpacing:"0.06em",marginTop:4 }}>{client.offer}</div>
                </div>
                <button className="icon-btn" onClick={() => { setClientForm({name:client.name,offer:client.offer||"",strategy:client.strategy||"",revenue_goal:client.revenue_goal||"",start_date:client.start_date||"",strategy_commit_days:client.strategy_commit_days||"60"}); setModal("editClient"); }}>Edit Client</button>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24 }}>
                <div className="card" style={{ textAlign:"center" }}>
                  <div className="tag" style={{ marginBottom:16 }}>Alignment</div>
                  <div className="pulse-ring" style={{ width:72,height:72,margin:"0 auto 12px" }}>
                    <div style={{ width:72,height:72,borderRadius:"50%",background:`conic-gradient(${G} ${(parseFloat(avgAlignment)/5)*360}deg, #e8e4dc ${(parseFloat(avgAlignment)/5)*360}deg)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <div style={{ width:52,height:52,borderRadius:"50%",background:"white",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <span style={{ fontSize:20,fontWeight:300 }}>{avgAlignment}</span>
                      </div>
                    </div>
                  </div>
                  <div className="sans" style={{ fontSize:11,color:"#999",letterSpacing:"0.06em" }}>out of 5.0</div>
                </div>

                <div className="card">
                  <div className="tag" style={{ marginBottom:12 }}>Revenue Latest</div>
                  <div style={{ fontSize:34,fontWeight:300,letterSpacing:"-0.02em",lineHeight:1 }}>${latestRevenue.toLocaleString()}</div>
                  {revenueData.length > 1 && <div className="sans" style={{ fontSize:12,color:revGrowth>=0?S:"#d4836a",marginTop:8 }}>{revGrowth>=0?"↑":"↓"} {Math.abs(revGrowth)}% from last month</div>}
                  <div style={{ marginTop:16 }}>
                    <div className="tag" style={{ marginBottom:6 }}>Goal ${Number(client.revenue_goal||0).toLocaleString()}</div>
                    <div style={{ height:3,background:"#e8e4dc",borderRadius:2 }}>
                      <div style={{ height:"100%",width:`${revenueProgress}%`,background:`linear-gradient(90deg,${S},${G})`,borderRadius:2,transition:"width 1s ease" }} />
                    </div>
                    <div className="sans" style={{ fontSize:10,color:G,marginTop:4 }}>{revenueProgress.toFixed(0)}% reached</div>
                  </div>
                </div>

                <div className="card" style={{ gridColumn: "span 2" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                    <div className="tag">Actions This Week</div>
                    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                      <div className="sans" style={{ fontSize:11,color:"#999" }}>{completedActions} of {latestActions.length} met</div>
                      <div style={{ fontFamily:"Jost,sans-serif",fontSize:22,fontWeight:300,color:actionScore>=100?S:G }}>{actionScore}<span style={{ fontSize:13,color:"#bbb" }}>%</span></div>
                      {latestCheckin && <button className="icon-btn" onClick={() => { setCheckinForm({flow_state:latestCheckin.flow_state||"flow",alignment_scores:latestCheckin.alignment_scores||[4,4,4,4,4],actions:latestCheckin.actions||[],reflection:latestCheckin.reflection||"",week_of:latestCheckin.week_of,editId:latestCheckin.id}); setNewOneOffAction({action:"",committed:""}); setModal("addCheckin"); }}>Update This Week</button>}
                    </div>
                  </div>
                  {latestActions.length===0 ? (
                    <div className="sans" style={{ fontSize:13,color:"#bbb",fontStyle:"italic" }}>No actions logged yet. Add standing commitments first, then log a check-in.</div>
                  ) : (
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8 }}>
                      {latestActions.map((a,i) => {
                        const ok = Number(a.done)>=Number(a.committed);
                        return (
                          <div key={i}
                            onClick={async () => {
                              if (!latestCheckin) return;
                              const updated = latestCheckin.actions.map((act, j) =>
                                j===i ? { ...act, done: ok ? 0 : Number(act.committed) } : act
                              );
                              await db.patch("checkins", latestCheckin.id, { actions: updated });
                              await loadClientData(activeClientId);
                            }}
                            style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:ok?`${S}10`:"#f9f7f3",border:`1px solid ${ok?S:"rgba(201,168,76,0.12)"}`,borderRadius:2,cursor:"pointer",transition:"all 0.15s",userSelect:"none" }}>
                            <div style={{ width:22,height:22,borderRadius:"50%",background:ok?S:"white",border:`2px solid ${ok?S:G}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>
                              {ok && <span style={{ color:"white",fontSize:11 }}>✓</span>}
                            </div>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:13,fontStyle:"italic",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:ok?"#aaa":D,textDecoration:ok?"line-through":"none",transition:"all 0.15s" }}>{a.action}</div>
                              <div className="sans" style={{ fontSize:10,color:ok?S:G,marginTop:2 }}>{ok?"Done":"Target: "+a.committed}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card" style={{ textAlign:"center" }}>
                  <div className="tag" style={{ marginBottom:16 }}>Energy State</div>
                  <div style={{ fontSize:32,marginBottom:8 }}>{flowState==="flow"?"🌿":flowState==="aligned"?"✨":"🌪"}</div>
                  <div className="sans" style={{ fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:flowState==="flow"?S:flowState==="aligned"?G:"#d4836a",fontWeight:500 }}>
                    {flowState==="flow"?"In Flow":flowState==="aligned"?"Aligned":"Processing"}
                  </div>
                  <div className="sans" style={{ fontSize:10,color:"#bbb",marginTop:8 }}>Latest check-in</div>
                </div>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:20,marginBottom:20 }}>
                <div className="card">
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                    <div className="tag">Revenue Momentum</div>
                    <button className="icon-btn" onClick={() => { setRevenueForm({month:"",amount:""}); setModal("addRevenue"); }}>+ Add Month</button>
                  </div>
                  {revenueData.length===0 ? <div className="sans" style={{ fontSize:13,color:"#bbb",fontStyle:"italic",padding:"20px 0" }}>No revenue entries yet.</div> : (
                    <div style={{ display:"flex",alignItems:"flex-end",gap:10,height:110,paddingBottom:8 }}>
                      {revenueData.map((d,i) => (
                        <div key={d.id} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5,height:"100%",justifyContent:"flex-end" }}>
                          <div className="sans" style={{ fontSize:9,color:D }}>${(Number(d.amount)/1000).toFixed(1)}k</div>
                          <div onClick={() => deleteRevenue(d.id)} title="Click to delete" style={{ width:"100%",height:`${(Number(d.amount)/maxBar)*80}%`,background:i===revenueData.length-1?`linear-gradient(180deg,${G},${S})`:`${G}33`,borderRadius:"2px 2px 0 0",minHeight:4,cursor:"pointer" }} />
                          <div className="sans" style={{ fontSize:9,color:"#bbb" }}>{d.month}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="gold-line" style={{ marginTop:16,opacity:0.3 }} />
                  <div style={{ display:"flex",justifyContent:"space-between",marginTop:12 }}>
                    <div><div className="tag">Total</div><div style={{ fontSize:22,fontWeight:300,marginTop:2 }}>${totalRevenue.toLocaleString()}</div></div>
                    <div style={{ textAlign:"right" }}><div className="tag">Avg/Month</div><div style={{ fontSize:22,fontWeight:300,marginTop:2 }}>${revenueData.length>0?Math.round(totalRevenue/revenueData.length).toLocaleString():0}</div></div>
                  </div>
                </div>

                <div className="card">
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                    <div className="tag">Standing Commitments</div>
                    <button className="icon-btn" onClick={() => setModal("manageStanding")}>Manage</button>
                  </div>
                  {standingActions.length===0 ? (
                    <div className="sans" style={{ fontSize:13,color:"#bbb",fontStyle:"italic",lineHeight:1.7 }}>No standing commitments yet.<br/>Click Manage to add them.</div>
                  ) : standingActions.map(sa => {
                    const match = latestActions.find(a => a.action===sa.action);
                    const done = match ? Number(match.done) : null;
                    const complete = done!==null && done>=Number(sa.committed);
                    return (
                      <div key={sa.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(201,168,76,0.08)" }}>
                        <div style={{ width:20,height:20,borderRadius:"50%",background:complete?S:done!==null&&done>0?`${G}44`:"#e8e4dc",border:`1px solid ${complete?S:"rgba(201,168,76,0.2)"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                          {complete && <span style={{ color:"white",fontSize:9 }}>✓</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14,fontStyle:"italic",lineHeight:1.4 }}>{sa.action}</div>
                          <div className="sans" style={{ fontSize:9,color:"#bbb",marginTop:2 }}>
                            Target: {sa.committed}
                            {done!==null && <span style={{ color:complete?S:G,marginLeft:8 }}>Done: {done}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {latestCheckin && <div className="sans" style={{ fontSize:9,color:"#bbb",marginTop:12,letterSpacing:"0.06em" }}>WEEK OF {latestCheckin.week_of}</div>}
                </div>
              </div>

              <div className="card">
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:28 }}>
                  <div>
                    <div className="tag" style={{ marginBottom:12 }}>The One Strategy</div>
                    <div style={{ fontStyle:"italic",fontSize:16,lineHeight:1.6,paddingLeft:12,borderLeft:`2px solid ${G}` }}>"{client.strategy||"No strategy set yet."}"</div>
                  </div>
                  <div>
                    <div className="tag" style={{ marginBottom:10 }}>Commitment Progress</div>
                    <div style={{ height:6,background:"#e8e4dc",borderRadius:3,marginBottom:8 }}>
                      <div style={{ height:"100%",width:`${strategyProgress}%`,background:`linear-gradient(90deg,${S},${G})`,borderRadius:3,transition:"width 1s ease" }} />
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between" }}>
                      <div className="sans" style={{ fontSize:10,color:G }}>Day {strategyDaysActive}</div>
                      <div className="sans" style={{ fontSize:10,color:"#bbb" }}>of {strategyCommitDays} days</div>
                    </div>
                    {client.advisor_note && (
                      <div style={{ marginTop:16,padding:"10px 12px",background:`${S}11`,border:`1px solid ${S}33` }}>
                        <div className="tag" style={{ color:S,marginBottom:4 }}>Advisor Note</div>
                        <div style={{ fontSize:13,fontStyle:"italic",color:"#666",lineHeight:1.6 }}>{client.advisor_note}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab==="check-in" && (
            <div style={{ maxWidth:760 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32 }}>
                <div>
                  <div style={{ fontSize:28,fontWeight:300,fontStyle:"italic",marginBottom:8 }}>Weekly Check-In</div>
                  <div className="sans" style={{ fontSize:13,color:"#999" }}>Log {client?.name?.split(" ")[0]}'s pulse for the week.</div>
                </div>
                <button style={{ fontFamily:"Jost,sans-serif",fontSize:11,letterSpacing:"0.15em",textTransform:"uppercase",background:D,color:G,border:"none",padding:"12px 28px",cursor:"pointer" }} onClick={openAddCheckin}>+ New Check-In</button>
              </div>
              {checkins.length===0 ? (
                <div className="card" style={{ textAlign:"center",padding:"60px 40px" }}>
                  <div style={{ fontSize:32,marginBottom:16 }}>🌿</div>
                  <div style={{ fontSize:20,fontWeight:300,fontStyle:"italic",marginBottom:8 }}>No check-ins yet</div>
                  <div className="sans" style={{ fontSize:13,color:"#999" }}>Click "+ New Check-In" to log the first one.</div>
                </div>
              ) : checkins.map((ci,idx) => {
                const avg = ci.alignment_scores ? (ci.alignment_scores.reduce((a,b)=>a+b,0)/ci.alignment_scores.length).toFixed(1) : "–";
                const acts = ci.actions||[];
                const dn = acts.filter(a=>Number(a.done)>=Number(a.committed)).length;
                return (
                  <div key={ci.id} className="card" style={{ marginBottom:14,padding:"22px 28px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:acts.length>0?16:0 }}>
                      <div style={{ display:"flex",gap:28,alignItems:"center",flexWrap:"wrap" }}>
                        <div><div className="tag" style={{ marginBottom:3 }}>Week of</div><div className="sans" style={{ fontSize:13 }}>{ci.week_of}</div></div>
                        <div><div className="tag" style={{ marginBottom:3 }}>Alignment</div><div style={{ fontSize:20,fontWeight:300 }}>{avg}</div></div>
                        <div><div className="tag" style={{ marginBottom:3 }}>Actions</div><div style={{ fontSize:20,fontWeight:300 }}>{dn}/{acts.length}</div></div>
                        <div><div className="tag" style={{ marginBottom:3 }}>Energy</div><div style={{ fontSize:18 }}>{ci.flow_state==="flow"?"🌿":ci.flow_state==="aligned"?"✨":"🌪"}</div></div>
                      </div>
                      {idx===0 && <div className="sans" style={{ fontSize:9,color:G,background:`${G}11`,padding:"3px 10px",border:`1px solid ${G}33`,whiteSpace:"nowrap" }}>LATEST</div>}
                    </div>
                    {acts.length>0 && (
                      <div style={{ borderTop:"1px solid rgba(201,168,76,0.1)",paddingTop:14 }}>
                        <div className="tag" style={{ marginBottom:10 }}>Actions</div>
                        {acts.map((a,j) => {
                          const ok = Number(a.done)>=Number(a.committed);
                          return (
                            <div key={j} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:7 }}>
                              <div style={{ width:16,height:16,borderRadius:"50%",background:ok?S:"#e8e4dc",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                                {ok && <span style={{ color:"white",fontSize:9 }}>✓</span>}
                              </div>
                              <div style={{ flex:1,fontSize:13,fontStyle:"italic" }}>{a.action}</div>
                              <div className="sans" style={{ fontSize:10,color:ok?S:G }}>{a.done}/{a.committed}</div>
                              {a.standing===false && <span className="abadge" style={{ background:`${G}18`,color:G }}>one-off</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {ci.reflection && (
                      <div style={{ borderTop:"1px solid rgba(201,168,76,0.1)",paddingTop:12,marginTop:12 }}>
                        <div className="tag" style={{ marginBottom:6 }}>Reflection</div>
                        <div style={{ fontSize:14,fontStyle:"italic",color:"#777",lineHeight:1.7 }}>"{ci.reflection}"</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab==="strategy" && client && (
            <div style={{ maxWidth:720 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32 }}>
                <div>
                  <div style={{ fontSize:28,fontWeight:300,fontStyle:"italic",marginBottom:8 }}>GTM Strategy Lock</div>
                  <div className="sans" style={{ fontSize:13,color:"#999" }}>One strategy. Fully tested. No pivoting.</div>
                </div>
                <button className="icon-btn" onClick={() => { setStrategyForm({strategy:client.strategy||"",strategy_commit_days:client.strategy_commit_days||"60",start_date:client.start_date||""}); setModal("editStrategy"); }}>Edit Strategy</button>
              </div>
              <div className="card" style={{ marginBottom:20 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
                  <div className="tag">Active Strategy</div>
                  <div className="sans" style={{ fontSize:10,color:G,background:`${G}11`,padding:"4px 12px",border:`1px solid ${G}44` }}>LOCKED</div>
                </div>
                <div style={{ fontSize:22,fontWeight:300,fontStyle:"italic",lineHeight:1.6,marginBottom:24 }}>"{client.strategy||"No strategy set."}"</div>
                <div className="gold-line" style={{ marginBottom:20,opacity:0.3 }} />
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20 }}>
                  {[{label:"Start Date",val:client.start_date||"–"},{label:"Days Active",val:`${strategyDaysActive} days`},{label:"Days Remaining",val:`${Math.max(0,strategyCommitDays-strategyDaysActive)} days`}].map((m,i) => (
                    <div key={i} style={{ textAlign:"center" }}>
                      <div className="tag" style={{ marginBottom:6 }}>{m.label}</div>
                      <div style={{ fontSize:20,fontWeight:300 }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ marginBottom:20 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                  <div className="tag">Effectiveness Indicators</div>
                  <button className="icon-btn" onClick={() => { setIndicatorsForm(indicators.length>0?indicators.map(i=>({...i})):[{label:"Lead quality",score:50},{label:"Conversion rate",score:50},{label:"Referral activation",score:50},{label:"Offer clarity",score:50}]); setModal("editIndicators"); }}>Edit</button>
                </div>
                {indicators.length===0 ? <div className="sans" style={{ fontSize:13,color:"#bbb",fontStyle:"italic" }}>No indicators yet. Click Edit to add them.</div>
                  : indicators.map((ind,i) => (
                    <div key={i} style={{ marginBottom:18 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                        <div style={{ fontSize:14,fontStyle:"italic" }}>{ind.label}</div>
                        <div className="sans" style={{ fontSize:12,color:Number(ind.score)>=70?S:G }}>{ind.score}%</div>
                      </div>
                      <div style={{ height:3,background:"#e8e4dc",borderRadius:2 }}>
                        <div style={{ height:"100%",width:`${ind.score}%`,background:Number(ind.score)>=70?`linear-gradient(90deg,${S},${G})`:`linear-gradient(90deg,${G}88,${G})`,borderRadius:2,transition:"width 1s ease" }} />
                      </div>
                    </div>
                  ))
                }
              </div>
              <div className="card" style={{ background:D }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                  <div className="tag" style={{ color:G }}>Advisor's Strategic Directive</div>
                  <button onClick={() => { setDirectiveForm(client.advisor_note||""); setModal("editDirective"); }} style={{ background:"none",border:"1px solid #444",color:"#777",fontFamily:"Jost",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",padding:"5px 12px",cursor:"pointer" }}>Edit</button>
                </div>
                {client.advisor_note
                  ? <div style={{ fontSize:17,fontStyle:"italic",lineHeight:1.8,color:"#e8e4dc" }}>"{client.advisor_note}"</div>
                  : <div className="sans" style={{ fontSize:13,color:"#555",fontStyle:"italic" }}>No directive set yet. Click Edit to write one.</div>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {(modal==="addClient"||modal==="editClient") && (
        <Modal title={modal==="addClient"?"Add New Client":"Edit Client"} onClose={() => setModal(null)}>
          <Input label="Client Name" value={clientForm.name} onChange={v => setClientForm(f=>({...f,name:v}))} />
          <Input label="Their Offer / Program" value={clientForm.offer} onChange={v => setClientForm(f=>({...f,offer:v}))} placeholder="e.g. High-ticket coaching program" />
          <Input label="Revenue Goal ($)" type="number" value={clientForm.revenue_goal} onChange={v => setClientForm(f=>({...f,revenue_goal:v}))} />
          <Input label="Strategy Start Date" type="date" value={clientForm.start_date} onChange={v => setClientForm(f=>({...f,start_date:v}))} />
          <Input label="Commitment Window (days)" type="number" value={clientForm.strategy_commit_days} onChange={v => setClientForm(f=>({...f,strategy_commit_days:v}))} />
          <div style={{ marginBottom:24 }}>
            <div className="tag" style={{ marginBottom:6 }}>GTM Strategy</div>
            <textarea value={clientForm.strategy} onChange={e => setClientForm(f=>({...f,strategy:e.target.value}))} rows={3} placeholder="The one strategy they are committed to..."
              style={{ width:"100%",fontFamily:"Cormorant Garamond,serif",fontSize:15,color:D,background:W,border:"1px solid rgba(201,168,76,0.25)",padding:"10px 14px",outline:"none",resize:"none" }} />
          </div>
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <SaveBtn onClick={() => saveClient(modal==="editClient")} loading={saving} />
          </div>
        </Modal>
      )}

      {modal==="addRevenue" && (
        <Modal title="Add Revenue Entry" onClose={() => setModal(null)}>
          <Input label="Month (e.g. Mar 2026)" value={revenueForm.month} onChange={v => setRevenueForm(f=>({...f,month:v}))} placeholder="Mar 2026" />
          <Input label="Amount ($)" type="number" value={revenueForm.amount} onChange={v => setRevenueForm(f=>({...f,amount:v}))} />
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <SaveBtn onClick={saveRevenue} loading={saving} />
          </div>
        </Modal>
      )}

      {modal==="manageStanding" && (
        <Modal title="Standing Commitments" onClose={() => setModal(null)}>
          <div className="sans" style={{ fontSize:11,color:"#999",letterSpacing:"0.06em",marginBottom:20,lineHeight:1.6 }}>These auto-load into every new check-in.</div>
          {standingActions.length===0 && <div style={{ fontStyle:"italic",fontSize:14,color:"#bbb",marginBottom:20 }}>No standing commitments yet.</div>}
          {standingActions.map(sa => (
            <div key={sa.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:W,border:"1px solid rgba(201,168,76,0.15)",marginBottom:6 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15,fontStyle:"italic" }}>{sa.action}</div>
                <div className="sans" style={{ fontSize:10,color:"#bbb",marginTop:2 }}>Target: {sa.committed}</div>
              </div>
              <button onClick={() => deleteStandingAction(sa.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:20,lineHeight:1 }}>x</button>
            </div>
          ))}
          <div className="gold-line" style={{ margin:"20px 0",opacity:0.3 }} />
          <div className="tag" style={{ marginBottom:10 }}>Add New Standing Action</div>
          <div style={{ display:"flex",gap:8,marginBottom:8 }}>
            <input value={newStandingAction.action} onChange={e => setNewStandingAction(f=>({...f,action:e.target.value}))} placeholder="e.g. Send 10 outreach messages"
              style={{ flex:1,fontFamily:"Cormorant Garamond,serif",fontSize:14,border:"1px solid rgba(201,168,76,0.25)",padding:"9px 12px",background:W,outline:"none",color:D }} />
            <input type="number" value={newStandingAction.committed} onChange={e => setNewStandingAction(f=>({...f,committed:e.target.value}))} placeholder="Target"
              style={{ width:70,fontFamily:"Jost",fontSize:13,border:"1px solid rgba(201,168,76,0.25)",padding:"9px 8px",background:W,outline:"none",color:D,textAlign:"center" }} />
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",marginTop:12 }}>
            <button className="icon-btn" onClick={addStandingAction} disabled={saving}>+ Add Action</button>
            <button onClick={() => setModal(null)} style={{ fontFamily:"Jost,sans-serif",fontSize:11,letterSpacing:"0.12em",background:D,color:G,border:"none",padding:"10px 24px",cursor:"pointer" }}>Done</button>
          </div>
        </Modal>
      )}

      {modal==="addCheckin" && (
        <Modal title={checkinForm.editId ? "Update Check-In" : "New Weekly Check-In"} onClose={() => setModal(null)}>
          <Input label="Week of" type="date" value={checkinForm.week_of} onChange={v => setCheckinForm(f=>({...f,week_of:v}))} />
          <div style={{ marginBottom:20 }}>
            <div className="tag" style={{ marginBottom:10 }}>Energy State</div>
            <div style={{ display:"flex",gap:8 }}>
              {[{val:"flow",label:"🌿 In Flow"},{val:"aligned",label:"✨ Aligned"},{val:"processing",label:"🌪 Processing"}].map(opt => (
                <button key={opt.val} onClick={() => setCheckinForm(f=>({...f,flow_state:opt.val}))}
                  style={{ flex:1,padding:"10px 8px",cursor:"pointer",background:checkinForm.flow_state===opt.val?D:"white",border:`1px solid ${checkinForm.flow_state===opt.val?D:"rgba(201,168,76,0.2)"}`,fontFamily:"Jost",fontSize:11,color:checkinForm.flow_state===opt.val?G:D,letterSpacing:"0.05em",transition:"all 0.2s" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <div className="tag" style={{ marginBottom:12 }}>Alignment Scores (1-5)</div>
            {ALIGNMENT_QUESTIONS.map((q,i) => (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={{ fontSize:13,fontStyle:"italic",marginBottom:7,color:"#666",lineHeight:1.5 }}>{q}</div>
                <div style={{ display:"flex",gap:6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => { const s=[...checkinForm.alignment_scores]; s[i]=n; setCheckinForm(f=>({...f,alignment_scores:s})); }}
                      style={{ width:34,height:34,borderRadius:"50%",background:checkinForm.alignment_scores[i]>=n?D:"white",border:`1.5px solid ${checkinForm.alignment_scores[i]>=n?D:"rgba(201,168,76,0.3)"}`,cursor:"pointer",fontFamily:"Jost",fontSize:11,color:checkinForm.alignment_scores[i]>=n?G:"#bbb",transition:"all 0.15s" }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:20 }}>
            <div className="tag" style={{ marginBottom:12 }}>Weekly Actions</div>
            {checkinForm.actions.length===0 && <div style={{ fontStyle:"italic",fontSize:13,color:"#bbb",marginBottom:12 }}>No standing actions loaded. Add them via Manage Standing Commitments first, or add a one-off below.</div>}
            {checkinForm.actions.map((a,i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"10px 12px",background:W,border:"1px solid rgba(201,168,76,0.15)" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontStyle:"italic" }}>{a.action}</div>
                  <div style={{ display:"flex",gap:8,alignItems:"center",marginTop:4 }}>
                    {a.standing!==false && <span className="abadge" style={{ background:`${S}22`,color:S }}>standing</span>}
                    {a.standing===false && <span className="abadge" style={{ background:`${G}18`,color:G }}>one-off</span>}
                    <div className="sans" style={{ fontSize:10,color:"#bbb" }}>target: {a.committed}</div>
                  </div>
                </div>
                <input type="number" min={0} value={a.done}
                  onChange={e => { const acts=[...checkinForm.actions]; acts[i]={...acts[i],done:Number(e.target.value)}; setCheckinForm(f=>({...f,actions:acts})); }}
                  style={{ width:48,textAlign:"center",fontFamily:"Jost",fontSize:14,border:"1px solid rgba(201,168,76,0.25)",padding:"5px 4px",background:"white",outline:"none",color:D }} />
                <div className="sans" style={{ fontSize:10,color:"#bbb",minWidth:24 }}>done</div>
                {a.standing===false && (
                  <button onClick={() => setCheckinForm(f=>({...f,actions:f.actions.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:20,lineHeight:1 }}>x</button>
                )}
              </div>
            ))}
            <div style={{ marginTop:12,padding:12,background:`${G}08`,border:"1px dashed rgba(201,168,76,0.3)" }}>
              <div className="tag" style={{ marginBottom:8 }}>+ One-Off Action This Week</div>
              <div style={{ display:"flex",gap:8 }}>
                <input value={newOneOffAction.action} onChange={e => setNewOneOffAction(f=>({...f,action:e.target.value}))} placeholder="Action description..."
                  style={{ flex:1,fontFamily:"Cormorant Garamond,serif",fontSize:14,border:"1px solid rgba(201,168,76,0.25)",padding:"8px 12px",background:"white",outline:"none",color:D }} />
                <input type="number" value={newOneOffAction.committed} onChange={e => setNewOneOffAction(f=>({...f,committed:e.target.value}))} placeholder="Target"
                  style={{ width:64,fontFamily:"Jost",fontSize:13,border:"1px solid rgba(201,168,76,0.25)",padding:"8px",background:"white",outline:"none",color:D,textAlign:"center" }} />
                <button className="icon-btn" onClick={addOneOffAction}>Add</button>
              </div>
            </div>
          </div>
          <div style={{ marginBottom:28 }}>
            <div className="tag" style={{ marginBottom:8 }}>Reflection</div>
            <textarea value={checkinForm.reflection} onChange={e => setCheckinForm(f=>({...f,reflection:e.target.value}))} rows={3}
              placeholder="What moved? What wants attention? What are they letting go of?"
              style={{ width:"100%",fontFamily:"Cormorant Garamond,serif",fontSize:15,color:D,background:W,border:"1px solid rgba(201,168,76,0.25)",padding:"10px 14px",outline:"none",resize:"none",lineHeight:1.7 }} />
          </div>
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <SaveBtn onClick={saveCheckin} loading={saving} label={checkinForm.editId ? "Update Check-In" : "Save Check-In"} />
          </div>
        </Modal>
      )}

      {modal==="editDirective" && (
        <Modal title="Advisor Strategic Directive" onClose={() => setModal(null)}>
          <div style={{ marginBottom:24 }}>
            <div className="tag" style={{ marginBottom:8 }}>Your directive for this client</div>
            <textarea value={directiveForm} onChange={e => setDirectiveForm(e.target.value)} rows={5} placeholder="The one thing they need to hold this week..."
              style={{ width:"100%",fontFamily:"Cormorant Garamond,serif",fontSize:15,color:D,background:W,border:"1px solid rgba(201,168,76,0.25)",padding:"14px 16px",outline:"none",resize:"none",lineHeight:1.8 }} />
          </div>
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <SaveBtn onClick={saveDirective} loading={saving} />
          </div>
        </Modal>
      )}

      {modal==="editStrategy" && (
        <Modal title="Update Strategy" onClose={() => setModal(null)}>
          <div style={{ marginBottom:18 }}>
            <div className="tag" style={{ marginBottom:8 }}>The One Strategy</div>
            <textarea value={strategyForm.strategy} onChange={e => setStrategyForm(f=>({...f,strategy:e.target.value}))} rows={3}
              style={{ width:"100%",fontFamily:"Cormorant Garamond,serif",fontSize:15,color:D,background:W,border:"1px solid rgba(201,168,76,0.25)",padding:"10px 14px",outline:"none",resize:"none" }} />
          </div>
          <Input label="Start Date" type="date" value={strategyForm.start_date} onChange={v => setStrategyForm(f=>({...f,start_date:v}))} />
          <Input label="Commitment Window (days)" type="number" value={strategyForm.strategy_commit_days} onChange={v => setStrategyForm(f=>({...f,strategy_commit_days:v}))} />
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <SaveBtn onClick={saveStrategy} loading={saving} />
          </div>
        </Modal>
      )}

      {modal==="editIndicators" && (
        <Modal title="Strategy Effectiveness Indicators" onClose={() => setModal(null)}>
          {indicatorsForm.map((ind,i) => (
            <div key={i} style={{ marginBottom:22 }}>
              <input value={ind.label} onChange={e => { const f=[...indicatorsForm]; f[i]={...f[i],label:e.target.value}; setIndicatorsForm(f); }}
                style={{ width:"100%",fontFamily:"Cormorant Garamond,serif",fontSize:15,color:D,background:W,border:"1px solid rgba(201,168,76,0.25)",padding:"8px 12px",outline:"none",marginBottom:8 }} />
              <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                <input type="range" min={0} max={100} value={ind.score} onChange={e => { const f=[...indicatorsForm]; f[i]={...f[i],score:Number(e.target.value)}; setIndicatorsForm(f); }} style={{ flex:1 }} />
                <div className="sans" style={{ fontSize:13,color:G,width:36 }}>{ind.score}%</div>
              </div>
            </div>
          ))}
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <SaveBtn onClick={saveIndicators} loading={saving} />
          </div>
        </Modal>
      )}
    </div>
  );
}
