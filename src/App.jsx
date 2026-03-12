import { useState, useEffect, useMemo, useCallback } from "react";

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const C = {
  bg: "#07090D", card: "#0D1017", card2: "#131820",
  border: "#1C2535", text: "#E8EDF5", muted: "#4A5770",
  accent: "#00E5FF", accentDark: "#00B8CC", warn: "#FFB340", green: "#32D74B",
  red: "#FF3B30",
};
const VIEWS = {
  DASH:"dash", OYENTES:"oyentes", OY_DET:"oy_det", OY_NEW:"oy_new",
  CONS:"cons", CON_DET:"con_det", CON_NEW:"con_new", SORTEO:"sorteo", BUSCAR:"buscar"
};
const SK = { gasUrl:"mpw_url", password:"mpw_pw", setup:"mpw_setup" };

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
const daysSince = d => d ? Math.floor((Date.now()-new Date(d).getTime())/86400000) : null;
const isRecent = o => { const d=daysSince(o?.ultimoWin); return d!==null&&d<=30; };
const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().split("T")[0];

/* ─── API ─────────────────────────────────────────────────────────────────── */
const api = async (gasUrl, action, data=null) => {
  const u = new URL(gasUrl);
  u.searchParams.set("action", action);
  if (data) u.searchParams.set("data", JSON.stringify(data));
  const res = await fetch(u.toString(), { redirect:"follow" });
  if (!res.ok) throw new Error("Error de conexión");
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
};

/* ─── SHARED STYLES ───────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Nunito:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  input,textarea,select{outline:none;font-family:'Nunito',sans-serif}
  button{cursor:pointer;font-family:'Nunito',sans-serif}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:#222;border-radius:4px}
  .inp{background:${C.bg};border:1px solid ${C.border};color:${C.text};border-radius:8px;padding:10px 14px;font-size:14px;width:100%;transition:border-color .2s}
  .inp:focus{border-color:${C.accent}}
  .btn{background:${C.accent};color:#000;border:none;border-radius:8px;padding:11px 22px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:opacity .15s}
  .btn:hover{opacity:.85}
  .btn:disabled{opacity:.4;cursor:not-allowed}
  .btn-ghost{background:transparent;color:${C.muted};border:1px solid ${C.border};border-radius:8px;padding:9px 18px;font-size:13px;transition:all .2s}
  .btn-ghost:hover{border-color:${C.accent};color:${C.accent}}
  .btn-red{background:${C.red};color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;transition:opacity .2s}
  .btn-red:hover{opacity:.85}
  .card{background:${C.card};border:1px solid ${C.border};border-radius:12px}
  .row:hover{background:#ffffff07}
  .tag-warn{background:#FFB34022;color:${C.warn};border:1px solid #FFB34044;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .tag-ok{background:#32D74B22;color:${C.green};border:1px solid #32D74B44;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .tag-active{background:${C.accent}22;color:${C.accent};border:1px solid ${C.accent}44;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .tag-done{background:#ffffff11;color:${C.muted};border:1px solid ${C.border};border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .blink{animation:blink 1s ease infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
  .pulse{animation:pulse .6s ease-in-out infinite alternate}@keyframes pulse{from{transform:scale(.97);opacity:.7}to{transform:scale(1.03);opacity:1}}
  .win-in{animation:winIn .7s cubic-bezier(.175,.885,.32,1.275)}@keyframes winIn{from{opacity:0;transform:scale(.4) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
  .fade-in{animation:fadeIn .3s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .shake{animation:shake .4s ease}@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SETUP SCREEN                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
function SetupScreen({ onSave }) {
  const [step, setStep] = useState(1);
  const [gasUrl, setGasUrl] = useState("");
  const [pass, setPass] = useState(""); const [pass2, setPass2] = useState("");
  const [err, setErr] = useState(""); const [testing, setTesting] = useState(false);

  const testAndNext = async () => {
    if (!gasUrl.startsWith("https://script.google.com")) { setErr("URL inválida. Debe empezar con https://script.google.com"); return; }
    setTesting(true); setErr("");
    try {
      await api(gasUrl, "ping");
      setErr(""); setStep(2);
    } catch(e) { setErr("No se pudo conectar. Verificá que la URL sea correcta y el script esté publicado como 'Cualquier persona'."); }
    finally { setTesting(false); }
  };

  const savePass = () => {
    if (pass.length < 4) { setErr("Mínimo 4 caracteres"); return; }
    if (pass !== pass2) { setErr("Las contraseñas no coinciden"); return; }
    onSave(gasUrl, pass);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <style>{CSS}</style>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:C.accent,boxShadow:`0 0 12px ${C.accent}`,animation:"blink 1s infinite"}} className="blink"/>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:5,color:C.accent,textTransform:"uppercase",fontWeight:600}}>Sistema de Gestión</span>
        </div>
        <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:44,fontWeight:800,color:C.text,letterSpacing:3,textTransform:"uppercase",lineHeight:1}}>METRO POWER HITS</h1>
        <p style={{color:C.muted,fontSize:13,marginTop:8,fontWeight:400}}>Configuración inicial del sistema</p>
      </div>

      <div className="card fade-in" style={{padding:32,width:"100%",maxWidth:500}}>
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {[1,2].map(s=>(
            <div key={s} style={{flex:1,height:3,borderRadius:2,background:step>=s?C.accent:C.border,transition:"background .3s"}}/>
          ))}
        </div>

        {step===1 && (
          <>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>1. Conectar Google Sheets</h3>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:20}}>Pegá la URL de tu Google Apps Script Web App. Si todavía no la tenés, seguí la guía de configuración que te damos junto con esta app.</p>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>URL del Web App</label>
            <input className="inp" type="url" placeholder="https://script.google.com/macros/s/..." value={gasUrl} onChange={e=>{setGasUrl(e.target.value);setErr("")}} style={{marginBottom:12}}/>
            {err && <div style={{color:C.red,fontSize:12,marginBottom:12,background:"#FF3B3011",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.red}44`}}>{err}</div>}
            <button className="btn" onClick={testAndNext} disabled={testing} style={{width:"100%",padding:13}}>
              {testing ? "Probando conexión..." : "Probar y continuar →"}
            </button>
          </>
        )}

        {step===2 && (
          <>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>2. Contraseña de acceso</h3>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:20}}>Esta contraseña protegerá el acceso desde cualquier dispositivo. Compartila con tu equipo.</p>
            {[["pass","Nueva contraseña",pass,setPass],["pass2","Repetir contraseña",pass2,setPass2]].map(([id,label,val,set])=>(
              <div key={id} style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{label}</label>
                <input className="inp" type="password" value={val} onChange={e=>{set(e.target.value);setErr("")}} placeholder="••••••••"/>
              </div>
            ))}
            {err && <div style={{color:C.red,fontSize:12,marginBottom:12,background:"#FF3B3011",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.red}44`}}>{err}</div>}
            <button className="btn" onClick={savePass} style={{width:"100%",padding:13}}>Activar sistema ✓</button>
            <button className="btn-ghost" onClick={()=>{setStep(1);setErr("")}} style={{width:"100%",marginTop:8,textAlign:"center"}}>← Volver</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LOGIN SCREEN                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
function LoginScreen({ savedPassword, onLogin }) {
  const [pass, setPass] = useState(""); const [err, setErr] = useState(""); const [shake, setShake] = useState(false);
  const attempt = () => {
    if (pass === savedPassword) { onLogin(); }
    else { setErr("Contraseña incorrecta"); setShake(true); setTimeout(()=>setShake(false),500); }
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:16,height:16,borderRadius:"50%",background:C.accent,boxShadow:`0 0 20px ${C.accent}`,margin:"0 auto 16px"}} className="blink"/>
        <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:38,fontWeight:800,color:C.text,letterSpacing:3,textTransform:"uppercase"}}>METRO POWER HITS</h1>
        <p style={{color:C.muted,fontSize:13,marginTop:4}}>Gestión de Oyentes y Concursos</p>
      </div>
      <div className={`card fade-in ${shake?"shake":""}`} style={{padding:32,width:"100%",maxWidth:380}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:1,marginBottom:20,textAlign:"center"}}>Acceso al sistema</h3>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Contraseña</label>
        <input className="inp" type="password" placeholder="••••••••" value={pass} onChange={e=>{setPass(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&attempt()} autoFocus style={{marginBottom:12}}/>
        {err && <div style={{color:C.red,fontSize:12,marginBottom:12,textAlign:"center"}}>{err}</div>}
        <button className="btn" onClick={attempt} style={{width:"100%",padding:13}}>Ingresar →</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN APP                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
function MainApp({ gasUrl, onLogout }) {
  const [oyentes, setOyentes] = useState([]);
  const [concursos, setConcursos] = useState([]);
  const [participaciones, setParticipaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState(VIEWS.DASH);
  const [selId, setSelId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [formErr, setFormErr] = useState("");
  const [sorteoState, setSorteoState] = useState({ animando:false, ganador:null, nombres:[] });
  const [oyForm, setOyForm] = useState({nombre:"",telefono:"",dni:"",email:"",edad:""});
  const [conForm, setConForm] = useState({nombre:"",premio:"",descripcion:"",fecha:""});

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  /* ── Load data ─────────────────────────────────────────────────────────── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(gasUrl, "getAll");
      setOyentes(data.oyentes||[]);
      setConcursos(data.concursos||[]);
      setParticipaciones(data.participaciones||[]);
    } catch(e) { showToast("Error al cargar datos: "+e.message, "err"); }
    finally { setLoading(false); }
  }, [gasUrl]);

  useEffect(()=>{ loadAll(); }, [loadAll]);

  /* ── Nav ───────────────────────────────────────────────────────────────── */
  const nav = (v, id=null) => { setView(v); setSelId(id); setFormErr(""); setBusqueda(""); setSorteoState({animando:false,ganador:null,nombres:[]}); };

  /* ── Selected objects ─────────────────────────────────────────────────── */
  const selOyente = useMemo(()=>oyentes.find(o=>o.id===selId),[oyentes,selId]);
  const selConcurso = useMemo(()=>concursos.find(c=>c.id===selId),[concursos,selId]);

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  const stats = useMemo(()=>{
    const total = oyentes.length;
    const ganadores = oyentes.filter(o=>o.totalWins>0).length;
    const recentW = oyentes.filter(o=>isRecent(o)).length;
    const edades = oyentes.filter(o=>o.edad).map(o=>parseInt(o.edad));
    const promEdad = edades.length ? Math.round(edades.reduce((a,b)=>a+b,0)/edades.length) : 0;
    const rangos = {"18-25":0,"26-35":0,"36-45":0,"46+":0};
    oyentes.forEach(o=>{ const e=parseInt(o.edad); if(e<=25)rangos["18-25"]++; else if(e<=35)rangos["26-35"]++; else if(e<=45)rangos["36-45"]++; else if(e)rangos["46+"]++; });
    const consActivos = concursos.filter(c=>c.estado==="activo").length;
    return {total,ganadores,recentW,promEdad,rangos,consActivos};
  },[oyentes,concursos]);

  /* ── Oyente participaciones ─────────────────────────────────────────────── */
  const oyenteParticipaciones = (oyId) => participaciones.filter(p=>p.oyenteId===oyId);
  const concursoParticipantes = (conId) => {
    const ids = participaciones.filter(p=>p.concursoId===conId).map(p=>p.oyenteId);
    return ids.map(id=>oyentes.find(o=>o.id===id)).filter(Boolean);
  };
  const oyenteEnConcurso = (oyId, conId) => participaciones.some(p=>p.oyenteId===oyId&&p.concursoId===conId);

  /* ── CRUD operations ────────────────────────────────────────────────────── */
  const addOyente = async () => {
    if (!oyForm.nombre||!oyForm.telefono||!oyForm.dni) { setFormErr("Nombre, teléfono y DNI son obligatorios."); return; }
    if (oyentes.find(o=>o.telefono===oyForm.telefono)) { setFormErr("Ya existe un oyente con ese teléfono."); return; }
    setSaving(true);
    try {
      const newO = { id:uid(), ...oyForm, edad:parseInt(oyForm.edad)||"", fechaRegistro:today(), veces:0, totalWins:0, ultimoWin:"" };
      await api(gasUrl, "addOyente", newO);
      setOyentes(prev=>[...prev,newO]);
      setOyForm({nombre:"",telefono:"",dni:"",email:"",edad:""});
      showToast("Oyente registrado ✓");
      nav(VIEWS.OYENTES);
    } catch(e) { setFormErr("Error al guardar: "+e.message); }
    finally { setSaving(false); }
  };

  const addConcurso = async () => {
    if (!conForm.nombre||!conForm.premio) { setFormErr("Nombre y premio son obligatorios."); return; }
    setSaving(true);
    try {
      const newC = { id:uid(), ...conForm, estado:"activo", ganadorId:"", ganadorNombre:"" };
      await api(gasUrl, "addConcurso", newC);
      setConcursos(prev=>[...prev,newC]);
      setConForm({nombre:"",premio:"",descripcion:"",fecha:""});
      showToast("Concurso creado ✓");
      nav(VIEWS.CONS);
    } catch(e) { setFormErr("Error al guardar: "+e.message); }
    finally { setSaving(false); }
  };

  const inscribir = async (oyId, conId) => {
    if (oyenteEnConcurso(oyId,conId)) return;
    try {
      const p = { concursoId:conId, oyenteId:oyId, fecha:today() };
      await api(gasUrl, "addParticipante", p);
      setParticipaciones(prev=>[...prev,p]);
      setOyentes(prev=>prev.map(o=>o.id===oyId?{...o,veces:(parseInt(o.veces)||0)+1}:o));
      showToast("Participante inscripto ✓");
    } catch(e) { showToast("Error: "+e.message,"err"); }
  };

  const realizarSorteo = async () => {
    const partic = concursoParticipantes(selConcurso.id);
    if (!partic.length) return;
    setSorteoState({animando:true,ganador:null,nombres:partic.map(p=>p.nombre)});
    let tick=0;
    const iv = setInterval(()=>{
      tick++;
      setSorteoState(s=>({...s,nombres:[...partic].sort(()=>Math.random()-.5).map(p=>p.nombre)}));
      if(tick>25){
        clearInterval(iv);
        const winner = partic[Math.floor(Math.random()*partic.length)];
        setSorteoState({animando:false,ganador:winner,nombres:[]});
        // Save to API
        const newWin = parseInt(winner.totalWins||0)+1;
        api(gasUrl,"setGanador",{concursoId:selConcurso.id,oyenteId:winner.id,oyenteNombre:winner.nombre,newTotalWins:newWin,ultimoWin:today()});
        setConcursos(prev=>prev.map(c=>c.id===selConcurso.id?{...c,estado:"finalizado",ganadorId:winner.id,ganadorNombre:winner.nombre}:c));
        setOyentes(prev=>prev.map(o=>o.id===winner.id?{...o,totalWins:newWin,ultimoWin:today()}:o));
        showToast(`🏆 ¡${winner.nombre} es el ganador!`,"win");
      }
    },70);
  };

  /* ── Styled components ──────────────────────────────────────────────────── */
  const Label = ({children}) => <label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{children}</label>;
  const FormErr = () => formErr ? <div style={{color:C.red,fontSize:12,background:"#FF3B3011",border:`1px solid ${C.red}44`,borderRadius:6,padding:"8px 12px",marginBottom:14}}>{formErr}</div> : null;
  const PageTitle = ({title,sub}) => (
    <div style={{marginBottom:22}}>
      <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:2,lineHeight:1}}>{title}</h2>
      {sub && <p style={{color:C.muted,fontSize:13,marginTop:4}}>{sub}</p>}
    </div>
  );
  const Back = ({to,label="← Volver"}) => <button className="btn-ghost" onClick={()=>nav(to)} style={{marginBottom:20}}>{label}</button>;

  /* ─── LOADING ─────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 0.8s linear infinite"}}/>
        <p style={{color:C.muted,fontSize:14}}>Cargando datos...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const navTabs = [
    {id:VIEWS.DASH,icon:"◉",label:"Inicio"},
    {id:VIEWS.OYENTES,icon:"👥",label:"Oyentes"},
    {id:VIEWS.CONS,icon:"🎯",label:"Concursos"},
    {id:VIEWS.BUSCAR,icon:"📱",label:"WhatsApp"},
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",color:C.text}}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:200}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,boxShadow:`0 0 8px ${C.accent}`}} className="blink"/>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,letterSpacing:2,textTransform:"uppercase",flex:1}}>METRO POWER HITS</span>
        <button onClick={()=>{ loadAll(); showToast("Datos actualizados ✓"); }} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11}}>↺ Sync</button>
        <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11}}>Salir</button>
      </div>

      {/* NAV */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,display:"flex",padding:"0 16px",overflowX:"auto"}}>
        {navTabs.map(n=>(
          <button key={n.id} onClick={()=>nav(n.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${[VIEWS.DASH,VIEWS.OYENTES,VIEWS.CONS,VIEWS.BUSCAR].includes(view)&&navTabs.find(t=>t.id===view)?.id===n.id?C.accent:"transparent"}`,color:[VIEWS.DASH,VIEWS.OYENTES,VIEWS.CONS,VIEWS.BUSCAR].includes(view)&&navTabs.find(t=>t.id===n.id)?.id===n.id&&view===n.id?C.accent:C.muted,padding:"12px 14px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"color .2s",cursor:"pointer"}}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",top:64,right:16,zIndex:999,background:toast.type==="win"?C.green:toast.type==="err"?C.red:C.accent,color:toast.type==="err"?"#fff":"#000",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:14,boxShadow:"0 4px 24px rgba(0,0,0,.5)",maxWidth:320}}>
          {toast.msg}
        </div>
      )}

      {/* CONTENT */}
      <div style={{padding:"20px 16px",maxWidth:900,margin:"0 auto"}}>

        {/* ─── DASHBOARD ─────────────────────────────────────────────────── */}
        {view===VIEWS.DASH && (
          <div className="fade-in">
            <PageTitle title="Panel Principal" sub={`${new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}`}/>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:20}}>
              {[
                {label:"Oyentes",value:stats.total,icon:"👥",color:C.accent},
                {label:"Concursos activos",value:stats.consActivos,icon:"🎯",color:C.warn},
                {label:"Ganadores",value:stats.ganadores,icon:"🏆",color:C.green},
                {label:"Edad promedio",value:stats.promEdad?stats.promEdad+"a":"—",icon:"📊",color:"#BF5AF2"},
              ].map((s,i)=>(
                <div key={i} className="card" style={{padding:"16px 14px"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Alert */}
            {stats.recentW>0 && (
              <div style={{background:"#FFB34011",border:`1px solid ${C.warn}44`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>⚠️</span>
                <span style={{color:C.warn,fontSize:13,fontWeight:600}}>
                  {stats.recentW} oyente{stats.recentW>1?"s":""} gan{stats.recentW>1?"aron":"ó"} un premio en los últimos 30 días.
                </span>
              </div>
            )}

            {/* Rangos + Concursos */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Rangos de edad</h3>
                {Object.entries(stats.rangos).map(([rango,cant])=>{
                  const max=Math.max(...Object.values(stats.rangos),1);
                  return (
                    <div key={rango} style={{marginBottom:9}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                        <span style={{color:C.muted}}>{rango} años</span>
                        <span style={{fontWeight:700}}>{cant}</span>
                      </div>
                      <div style={{height:5,background:C.border,borderRadius:3}}>
                        <div style={{height:"100%",width:`${(cant/max)*100}%`,background:C.accent,borderRadius:3,transition:"width .6s"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Concursos activos</h3>
                {concursos.filter(c=>c.estado==="activo").length===0 && <p style={{color:C.muted,fontSize:13}}>No hay concursos activos.</p>}
                {concursos.filter(c=>c.estado==="activo").map(c=>(
                  <div key={c.id} className="row" onClick={()=>nav(VIEWS.CON_DET,c.id)} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                    <div style={{fontWeight:600,fontSize:13}}>{c.nombre}</div>
                    <div style={{color:C.muted,fontSize:11,marginTop:2}}>{concursoParticipantes(c.id).length} participantes · 🎁 {c.premio}</div>
                  </div>
                ))}
                <button className="btn" onClick={()=>nav(VIEWS.CON_NEW)} style={{width:"100%",marginTop:14,padding:10}}>+ Nuevo concurso</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── OYENTES ───────────────────────────────────────────────────── */}
        {view===VIEWS.OYENTES && (
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:10,flexWrap:"wrap"}}>
              <PageTitle title="Oyentes" sub={`${oyentes.length} registrados`}/>
              <button className="btn" onClick={()=>nav(VIEWS.OY_NEW)}>+ Registrar oyente</button>
            </div>
            <input className="inp" placeholder="Buscar por nombre, teléfono o DNI..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{marginBottom:14}}/>
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${C.border}`}}>
                      {["Oyente","Teléfono","Edad","Participaciones","Estado"].map(h=>(
                        <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {oyentes.filter(o=>!busqueda||o.nombre.toLowerCase().includes(busqueda.toLowerCase())||o.telefono.includes(busqueda)||(o.dni||"").includes(busqueda)).map(o=>(
                      <tr key={o.id} className="row" style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>nav(VIEWS.OY_DET,o.id)}>
                        <td style={{padding:"11px 14px"}}><div style={{fontWeight:600,fontSize:14}}>{o.nombre}</div><div style={{color:C.muted,fontSize:11,marginTop:1}}>DNI {o.dni}</div></td>
                        <td style={{padding:"11px 14px",fontSize:13,color:C.muted,whiteSpace:"nowrap"}}>{o.telefono}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}>{o.edad||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}><span style={{color:C.accent,fontWeight:700}}>{o.veces||0}</span></td>
                        <td style={{padding:"11px 14px"}}>
                          {isRecent(o)?<span className="tag-warn">⚠ Ganó hace {daysSince(o.ultimoWin)}d</span>:parseInt(o.totalWins)>0?<span className="tag-ok">🏆 {o.totalWins} premios</span>:<span style={{color:C.muted,fontSize:12}}>Sin premios</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {oyentes.length===0&&<div style={{padding:32,textAlign:"center",color:C.muted,fontSize:14}}>No hay oyentes registrados aún. ¡Registrá el primero!</div>}
            </div>
          </div>
        )}

        {/* ─── DETALLE OYENTE ────────────────────────────────────────────── */}
        {view===VIEWS.OY_DET && selOyente && (
          <div className="fade-in">
            <Back to={VIEWS.OYENTES}/>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:C.accent+"22",border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,flexShrink:0}}>
                {selOyente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{selOyente.nombre}</h2>
                <p style={{color:C.muted,fontSize:13}}>Registrado el {selOyente.fechaRegistro}</p>
              </div>
            </div>
            {isRecent(selOyente)&&(
              <div style={{background:"#FFB34011",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",gap:8,alignItems:"center"}}>
                <span>⚠️</span><span style={{color:C.warn,fontWeight:600,fontSize:13}}>Ganó un premio hace {daysSince(selOyente.ultimoWin)} días — considerar antes de sortear.</span>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["📱 Teléfono / WhatsApp",selOyente.telefono],["🪪 DNI",selOyente.dni],["✉️ Email",selOyente.email||"No registrado"],["🎂 Edad",selOyente.edad?selOyente.edad+" años":"No registrada"]].map(([l,v])=>(
                <div key={l} className="card" style={{padding:"12px 14px"}}><div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:600}}>{v}</div></div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {[["Participaciones",selOyente.veces||0,C.accent],["Premios ganados",selOyente.totalWins||0,C.green],["Días últ. premio",daysSince(selOyente.ultimoWin)!==null?daysSince(selOyente.ultimoWin)+"d":"Nunca",C.warn]].map(([l,v,col])=>(
                <div key={l} className="card" style={{padding:16,textAlign:"center"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:800,color:col}}>{v}</div><div style={{color:C.muted,fontSize:11,marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div></div>
              ))}
            </div>
            <div className="card" style={{padding:18}}>
              <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Historial de concursos</h3>
              {oyenteParticipaciones(selOyente.id).length===0&&<p style={{color:C.muted,fontSize:13}}>No participó en concursos aún.</p>}
              {oyenteParticipaciones(selOyente.id).map(p=>{
                const con=concursos.find(c=>c.id===p.concursoId);
                if(!con)return null;
                return (
                  <div key={p.concursoId} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>{con.nombre}</div><div style={{color:C.muted,fontSize:11}}>🎁 {con.premio}{con.fecha?" · "+con.fecha:""}</div></div>
                    {con.ganadorId===selOyente.id?<span className="tag-ok">🏆 Ganador</span>:con.estado==="activo"?<span className="tag-active">En curso</span>:<span className="tag-done">No ganó</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── NUEVO OYENTE ──────────────────────────────────────────────── */}
        {view===VIEWS.OY_NEW && (
          <div className="fade-in" style={{maxWidth:480}}>
            <Back to={VIEWS.OYENTES}/>
            <PageTitle title="Registrar Oyente" sub="Los datos quedan guardados en Google Sheets"/>
            <FormErr/>
            {[["nombre","Nombre completo *","text","Lucía Fernández"],["telefono","Teléfono / WhatsApp *","tel","1134567890"],["dni","DNI *","text","32456789"],["email","Email","email","lucia@gmail.com"],["edad","Edad","number","28"]].map(([k,l,t,ph])=>(
              <div key={k} style={{marginBottom:14}}>
                <Label>{l}</Label>
                <input className="inp" type={t} placeholder={ph} value={oyForm[k]} onChange={e=>{setOyForm(p=>({...p,[k]:e.target.value}));setFormErr("")}}/>
              </div>
            ))}
            <button className="btn" onClick={addOyente} disabled={saving} style={{width:"100%",padding:13,marginTop:4}}>
              {saving?"Guardando...":"Registrar oyente"}
            </button>
          </div>
        )}

        {/* ─── CONCURSOS ─────────────────────────────────────────────────── */}
        {view===VIEWS.CONS && (
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:10,flexWrap:"wrap"}}>
              <PageTitle title="Concursos" sub={`${concursos.length} en total`}/>
              <button className="btn" onClick={()=>nav(VIEWS.CON_NEW)}>+ Nuevo concurso</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {concursos.length===0&&<div className="card" style={{padding:32,textAlign:"center",color:C.muted}}>No hay concursos. ¡Creá el primero!</div>}
              {concursos.map(c=>{
                const pCount = concursoParticipantes(c.id).length;
                return (
                  <div key={c.id} className="card row" onClick={()=>nav(VIEWS.CON_DET,c.id)} style={{padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}>{c.nombre}</span>
                        {c.estado==="activo"?<span className="tag-active">Activo</span>:<span className="tag-done">Finalizado</span>}
                      </div>
                      <div style={{color:C.muted,fontSize:12}}>🎁 {c.premio} · {pCount} participantes{c.fecha?" · "+c.fecha:""}</div>
                      {c.ganadorNombre&&<div style={{color:C.green,fontSize:12,fontWeight:600,marginTop:3}}>🏆 {c.ganadorNombre}</div>}
                    </div>
                    <span style={{color:C.muted,fontSize:20}}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── DETALLE CONCURSO ──────────────────────────────────────────── */}
        {view===VIEWS.CON_DET && selConcurso && (
          <div className="fade-in">
            <Back to={VIEWS.CONS}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{selConcurso.nombre}</h2>
                  {selConcurso.estado==="activo"?<span className="tag-active">Activo</span>:<span className="tag-done">Finalizado</span>}
                </div>
                <p style={{color:C.muted,fontSize:13}}>🎁 {selConcurso.premio}{selConcurso.fecha?" · "+selConcurso.fecha:""}</p>
              </div>
              {selConcurso.estado==="activo"&&concursoParticipantes(selConcurso.id).length>0&&(
                <button className="btn" onClick={()=>nav(VIEWS.SORTEO,selConcurso.id)} style={{background:C.green,color:"#fff"}}>🎲 Sortear</button>
              )}
            </div>

            {selConcurso.ganadorNombre&&(
              <div style={{background:"#32D74B11",border:`1px solid ${C.green}44`,borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:28}}>🏆</span>
                <div><div style={{color:C.green,fontWeight:700,fontSize:18,fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Ganador: {selConcurso.ganadorNombre}</div><div style={{color:C.muted,fontSize:12}}>Premio: {selConcurso.premio}</div></div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* Participantes */}
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Participantes ({concursoParticipantes(selConcurso.id).length})</h3>
                {concursoParticipantes(selConcurso.id).length===0&&<p style={{color:C.muted,fontSize:13}}>Sin participantes aún.</p>}
                {concursoParticipantes(selConcurso.id).map(o=>(
                  <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>{o.nombre}</div><div style={{color:C.muted,fontSize:11}}>{o.telefono}</div></div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {selConcurso.ganadorId===o.id&&<span className="tag-ok">🏆</span>}
                      {isRecent(o)&&selConcurso.ganadorId!==o.id&&<span className="tag-warn">⚠{daysSince(o.ultimoWin)}d</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Inscribir */}
              {selConcurso.estado==="activo"&&(
                <div className="card" style={{padding:18}}>
                  <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Inscribir oyente</h3>
                  <input className="inp" placeholder="Buscar oyente..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{marginBottom:12,padding:"8px 12px",fontSize:13}}/>
                  <div style={{maxHeight:260,overflowY:"auto"}}>
                    {oyentes.filter(o=>!oyenteEnConcurso(o.id,selConcurso.id)&&(!busqueda||o.nombre.toLowerCase().includes(busqueda.toLowerCase())||o.telefono.includes(busqueda))).map(o=>(
                      <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>{o.nombre}</div>
                          <div style={{color:isRecent(o)?C.warn:C.muted,fontSize:11}}>{o.telefono}{isRecent(o)?" · ⚠ ganó hace "+daysSince(o.ultimoWin)+"d":""}</div>
                        </div>
                        <button className="btn-ghost" onClick={()=>inscribir(o.id,selConcurso.id)} style={{padding:"4px 10px",fontSize:12,flexShrink:0}}>+</button>
                      </div>
                    ))}
                    {oyentes.filter(o=>!oyenteEnConcurso(o.id,selConcurso.id)).length===0&&<p style={{color:C.muted,fontSize:13}}>Todos inscriptos.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SORTEO ────────────────────────────────────────────────────── */}
        {view===VIEWS.SORTEO && selConcurso && (
          <div className="fade-in" style={{textAlign:"center",paddingTop:20}}>
            <Back to={VIEWS.CON_DET} label="← Volver al concurso"/>
            <div style={{fontSize:36,marginBottom:8}}>🎲</div>
            <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:800,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>SORTEO EN VIVO</h2>
            <p style={{color:C.muted,fontSize:14,marginBottom:6}}>{selConcurso.nombre}</p>
            <p style={{color:C.accent,fontWeight:700,fontSize:16,marginBottom:32}}>🎁 {selConcurso.premio}</p>

            {!sorteoState.ganador&&!sorteoState.animando&&(
              <div className="card" style={{display:"inline-block",padding:"32px 48px",marginBottom:28}}>
                <p style={{color:C.muted,fontSize:14,marginBottom:20}}>{concursoParticipantes(selConcurso.id).length} participantes en el bombo</p>
                <button className="btn" onClick={realizarSorteo} style={{padding:"16px 48px",fontSize:20}}>¡SORTEAR AHORA!</button>
              </div>
            )}

            {sorteoState.animando&&(
              <div className="card pulse" style={{display:"inline-block",padding:"32px 48px",marginBottom:28,minWidth:300}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:800,color:C.accent,letterSpacing:1}}>
                  {sorteoState.nombres[Math.floor(Math.random()*sorteoState.nombres.length)]||"..."}
                </div>
              </div>
            )}

            {sorteoState.ganador&&!sorteoState.animando&&(
              <div className="win-in">
                <div style={{fontSize:72,marginBottom:12}}>🏆</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:48,fontWeight:800,color:C.green,letterSpacing:2,textTransform:"uppercase",lineHeight:1,marginBottom:8}}>
                  {sorteoState.ganador.nombre}
                </div>
                <div style={{color:C.muted,fontSize:16,marginBottom:4}}>📱 {sorteoState.ganador.telefono}</div>
                <div style={{color:C.muted,fontSize:16,marginBottom:24}}>DNI: {sorteoState.ganador.dni}</div>
                {parseInt(sorteoState.ganador.totalWins)>1&&(
                  <div style={{background:"#FFB34011",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 20px",display:"inline-block",marginBottom:20}}>
                    <span style={{color:C.warn,fontSize:13,fontWeight:600}}>⚠️ Este oyente ya ganó {parseInt(sorteoState.ganador.totalWins)-1} veces anteriormente</span>
                  </div>
                )}
                <div><button className="btn-ghost" onClick={()=>nav(VIEWS.CONS)}>Ver todos los concursos</button></div>
              </div>
            )}
          </div>
        )}

        {/* ─── NUEVO CONCURSO ────────────────────────────────────────────── */}
        {view===VIEWS.CON_NEW && (
          <div className="fade-in" style={{maxWidth:480}}>
            <Back to={VIEWS.CONS}/>
            <PageTitle title="Nuevo Concurso"/>
            <FormErr/>
            {[["nombre","Nombre del concurso *","text","Gran Sorteo Verano 2025"],["premio","Premio *","text","Viaje doble a Bariloche"],["descripcion","Descripción","text","Detalles del concurso..."],["fecha","Fecha","date",""]].map(([k,l,t,ph])=>(
              <div key={k} style={{marginBottom:14}}>
                <Label>{l}</Label>
                <input className="inp" type={t} placeholder={ph} value={conForm[k]} onChange={e=>{setConForm(p=>({...p,[k]:e.target.value}));setFormErr("")}}/>
              </div>
            ))}
            <button className="btn" onClick={addConcurso} disabled={saving} style={{width:"100%",padding:13,marginTop:4}}>
              {saving?"Guardando...":"Crear concurso"}
            </button>
          </div>
        )}

        {/* ─── BÚSQUEDA WHATSAPP ─────────────────────────────────────────── */}
        {view===VIEWS.BUSCAR && (
          <div className="fade-in">
            <PageTitle title="Búsqueda por WhatsApp" sub="Ingresá el número para ver el historial al instante"/>
            <div style={{display:"flex",gap:10,marginBottom:24}}>
              <input className="inp" type="tel" placeholder="📱  Número de WhatsApp..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{fontSize:16}}/>
              {busqueda&&<button className="btn-ghost" onClick={()=>setBusqueda("")} style={{flexShrink:0}}>✕</button>}
            </div>

            {busqueda.length>=4 && (()=>{
              const found = oyentes.find(o=>o.telefono.replace(/\D/g,"").includes(busqueda.replace(/\D/g,"")));
              if (!found) return (
                <div className="card" style={{padding:28,textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:10}}>🔍</div>
                  <p style={{color:C.muted,fontSize:14}}>No encontrado. <button className="btn" onClick={()=>nav(VIEWS.OY_NEW)} style={{padding:"8px 16px",marginLeft:8,fontSize:13}}>+ Registrar nuevo</button></p>
                </div>
              );
              return (
                <div className="card fade-in" style={{padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:16}}>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{found.nombre}</div>
                      <div style={{color:C.muted,fontSize:13,margin:"4px 0"}}>📱 {found.telefono} · DNI {found.dni}{found.edad?" · "+found.edad+" años":""}</div>
                      {found.email&&<div style={{color:C.muted,fontSize:13}}>✉️ {found.email}</div>}
                    </div>
                    <button className="btn" onClick={()=>nav(VIEWS.OY_DET,found.id)} style={{padding:"9px 18px",fontSize:13}}>Ver perfil →</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
                    {[["Participaciones",found.veces||0,C.accent],["Premios ganados",found.totalWins||0,C.green],["Último premio",found.ultimoWin||"Nunca",C.warn]].map(([l,v,col])=>(
                      <div key={l} style={{background:C.bg,borderRadius:8,padding:"12px",textAlign:"center"}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:col}}>{v}</div>
                        <div style={{color:C.muted,fontSize:11,marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {isRecent(found)&&(
                    <div style={{background:"#FFB34011",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"12px 16px",display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:18}}>⚠️</span>
                      <span style={{color:C.warn,fontWeight:700,fontSize:14}}>Ganó hace {daysSince(found.ultimoWin)} días — considerar antes de sortear.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {busqueda.length<4&&(
              <div className="card" style={{padding:40,textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:12}}>📱</div>
                <p style={{color:C.muted,fontSize:14,fontWeight:600}}>Escribí al menos 4 dígitos del número</p>
                <p style={{color:C.muted,fontSize:12,marginTop:6}}>Ideal para cuando un oyente te manda un WhatsApp</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ROOT COMPONENT                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ── URL del script de Google fija en el código ────────────────────────────
const GAS_URL = "https://script.google.com/macros/s/AKfycbx4CafPbrXpyQO60Ub2hCvWyG6ZVT0U8JDIvzRMLeXPgCg_W9wxCGW53EVlpXwdZIJ9/exec";
// ── Contraseña de acceso — cambiala por la que quieras ────────────────────
const ACCESS_PASSWORD = "Mph951";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn
    ? <MainApp gasUrl={GAS_URL} onLogout={()=>setLoggedIn(false)}/>
    : <LoginScreen savedPassword={ACCESS_PASSWORD} onLogin={()=>setLoggedIn(true)}/>;
}
