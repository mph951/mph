import { useState, useMemo, useCallback, useEffect } from "react";

/* ─── THEMES ──────────────────────────────────────────────────────────────── */
const LIGHT = {
  bg:"#F0F2F7", card:"#FFFFFF", border:"#E2E8F0", text:"#1A202C", muted:"#64748B",
  accent:"#0EA5E9", warn:"#F59E0B", green:"#10B981", red:"#EF4444",
  rowHover:"#F8FAFC", headerBg:"#FFFFFF", inputBg:"#F8FAFC",
  shadow:"0 1px 3px rgba(0,0,0,.08)",
};
const DARK = {
  bg:"#07090D", card:"#0D1017", border:"#1C2535", text:"#E8EDF5", muted:"#4A5770",
  accent:"#00E5FF", warn:"#FFB340", green:"#32D74B", red:"#FF3B30",
  rowHover:"#ffffff07", headerBg:"#0D1017", inputBg:"#07090D",
  shadow:"none",
};

const V = {
  DASH:"dash", OYENTES:"oy", OY_DET:"oy_det", OY_NEW:"oy_new", OY_EDIT:"oy_edit",
  CONS:"con", CON_DET:"con_det", CON_NEW:"con_new",
  SORTEO:"sorteo", BUSCAR:"buscar",
};

const daysSince = d => d ? Math.floor((Date.now()-new Date(d).getTime())/86400000) : null;
const isRecent  = o => { const d=daysSince(o?.ultimoWin); return d!==null&&d<=30; };
const uid       = () => Math.random().toString(36).slice(2,10);
const today     = () => new Date().toISOString().split("T")[0];

const api = async (action, data=null) => {
  const u = new URL(GAS_URL);
  u.searchParams.set("action", action);
  if (data) u.searchParams.set("data", JSON.stringify(data));
  const res  = await fetch(u.toString(), { redirect:"follow" });
  if (!res.ok) throw new Error("Error de conexión");
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
};

const makeCSS = C => `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Nunito:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};color:${C.text}}
  input,textarea,select{outline:none;font-family:'Nunito',sans-serif;color:${C.text}}
  button{cursor:pointer;font-family:'Nunito',sans-serif}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
  .inp{background:${C.inputBg};border:1px solid ${C.border};color:${C.text};border-radius:8px;padding:10px 14px;font-size:14px;width:100%;transition:border-color .2s}
  .inp:focus{border-color:${C.accent}}
  .sel{background:${C.inputBg};border:1px solid ${C.border};color:${C.text};border-radius:8px;padding:10px 14px;font-size:14px;width:100%;appearance:none;cursor:pointer}
  .sel:focus{border-color:${C.accent}}
  .btn{background:${C.accent};color:#fff;border:none;border-radius:8px;padding:11px 22px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:opacity .15s}
  .btn:hover{opacity:.85}.btn:disabled{opacity:.4;cursor:not-allowed}
  .btn-ghost{background:transparent;color:${C.muted};border:1px solid ${C.border};border-radius:8px;padding:9px 18px;font-size:13px;transition:all .2s}
  .btn-ghost:hover{border-color:${C.accent};color:${C.accent}}
  .btn-green{background:${C.green};color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;transition:opacity .15s}
  .btn-green:hover{opacity:.85}
  .btn-red{background:${C.red};color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;transition:opacity .15s}
  .btn-red:hover{opacity:.85}
  .btn-sm{padding:4px 12px!important;font-size:12px!important;border-radius:6px!important}
  .card{background:${C.card};border:1px solid ${C.border};border-radius:12px;box-shadow:${C.shadow}}
  .row:hover{background:${C.rowHover}}
  .tag-warn{background:${C.warn}22;color:${C.warn};border:1px solid ${C.warn}44;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .tag-ok{background:${C.green}22;color:${C.green};border:1px solid ${C.green}44;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .tag-active{background:${C.accent}22;color:${C.accent};border:1px solid ${C.accent}44;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .tag-done{background:${C.border};color:${C.muted};border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .tag-arch{background:#78716C22;color:#78716C;border:1px solid #78716C44;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700}
  .blink{animation:blink 1s ease infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
  .pulse{animation:pulse .6s ease-in-out infinite alternate}@keyframes pulse{from{transform:scale(.97);opacity:.7}to{transform:scale(1.03);opacity:1}}
  .win-in{animation:winIn .7s cubic-bezier(.175,.885,.32,1.275)}@keyframes winIn{from{opacity:0;transform:scale(.4) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
  .fade-in{animation:fadeIn .3s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .shake{animation:shake .4s ease}@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:500;padding:20px}
`;

/* ─── LOGIN ───────────────────────────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
  const C = LIGHT;
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [shake, setShake] = useState(false);
  const attempt = () => {
    if (pass === ACCESS_PASSWORD) { onLogin(); }
    else { setErr("Contraseña incorrecta"); setShake(true); setTimeout(()=>setShake(false),500); }
  };
  return (
    <div style={{minHeight:"100vh",background:"#F0F2F7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <style>{makeCSS(C)}</style>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:14,height:14,borderRadius:"50%",background:C.accent,boxShadow:`0 0 16px ${C.accent}88`,margin:"0 auto 16px"}} className="blink"/>
        <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:800,color:C.text,letterSpacing:3,textTransform:"uppercase"}}>METRO POWER HITS</h1>
        <p style={{color:C.muted,fontSize:13,marginTop:4}}>Gestión de Oyentes y Concursos</p>
      </div>
      <div className={`card${shake?" shake":""} fade-in`} style={{padding:32,width:"100%",maxWidth:360}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:1,marginBottom:20,textAlign:"center"}}>Acceso al sistema</h3>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Contraseña</label>
        <input className="inp" type="password" placeholder="••••••••" value={pass}
          onChange={e=>{setPass(e.target.value);setErr("")}}
          onKeyDown={e=>e.key==="Enter"&&attempt()} autoFocus style={{marginBottom:12}}/>
        {err&&<div style={{color:C.red,fontSize:12,marginBottom:12,textAlign:"center"}}>{err}</div>}
        <button className="btn" onClick={attempt} style={{width:"100%",padding:13}}>Ingresar →</button>
      </div>
    </div>
  );
}

/* ─── CONFIRM MODAL ───────────────────────────────────────────────────────── */
function ConfirmModal({ C, title, msg, confirmLabel, confirmClass="btn-red", onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="card fade-in" style={{maxWidth:380,width:"100%",padding:28}} onClick={e=>e.stopPropagation()}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,textTransform:"uppercase",marginBottom:10}}>{title}</h3>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:24}}>{msg}</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className={confirmClass} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ────────────────────────────────────────────────────────────── */
function MainApp({ onLogout }) {
  const [dark, setDark]       = useState(false);
  const C                     = dark ? DARK : LIGHT;
  const css                   = useMemo(()=>makeCSS(C),[dark]);

  const [oyentes, setOyentes]       = useState([]);
  const [concursos, setConcursos]   = useState([]);
  const [participaciones, setPartic]= useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [view, setView]             = useState(V.DASH);
  const [selId, setSelId]           = useState(null);
  const [busqueda, setBusqueda]     = useState("");
  const [conBusq, setConBusq]       = useState(""); // search inside concurso detail
  const [formErr, setFormErr]       = useState("");
  const [confirm, setConfirm]       = useState(null); // { type, id }
  const [sorteoState, setSorteo]    = useState({animando:false,ganador:null,nombres:[]});
  const [showArchived, setShowArchived] = useState(false);
  const [extendiendo, setExtendiendo]   = useState(false); // panel extender fecha
  const [nuevaFecha, setNuevaFecha]     = useState("");

  const emptyOy  = {nombre:"",telefono:"",dni:"",email:"",edad:"",localidad:"",genero:""};
  const [oyConIds, setOyConIds] = useState([]); // concursos seleccionados al registrar
  const emptyCon = {nombre:"",premio:"",descripcion:"",fechaDesde:"",fechaHasta:"",tipo:"ganador_directo"};
  const [oyForm,  setOyForm]  = useState(emptyOy);
  const [editForm, setEditForm] = useState(emptyOy);
  const [editConId, setEditConId] = useState(""); // concurso a agregar al editar
  const [conForm, setConForm] = useState(emptyCon);

  const showToast = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadAll = useCallback(async()=>{
    setLoading(true);
    try {
      const d = await api("getAll");
      setOyentes(d.oyentes||[]);
      setConcursos(d.concursos||[]);
      setPartic(d.participaciones||[]);
    } catch(e){ showToast("Error al cargar: "+e.message,"err"); }
    finally{ setLoading(false); }
  },[]);
  useEffect(()=>{ loadAll(); },[loadAll]);

  const applyNav = (v,id=null)=>{
    setView(v); setSelId(id); setFormErr(""); setBusqueda(""); setConBusq("");
    setSorteo({animando:false,ganador:null,nombres:[]}); setConfirm(null); setExtendiendo(false); setNuevaFecha(""); setOyConIds([]); setEditConId("");
  };

  const nav = (v,id=null)=>{
    window.history.pushState({view:v,id}, "");
    applyNav(v,id);
  };

  // Botón atrás del teléfono/navegador
  useEffect(()=>{
    // Registrar el estado inicial para que el primer "atrás" no salga de la app
    window.history.replaceState({view:V.DASH,id:null}, "");
    const onPop = (e)=>{
      const s = e.state;
      if(s&&s.view){ applyNav(s.view, s.id||null); }
      else { applyNav(V.DASH, null); }
    };
    window.addEventListener("popstate", onPop);
    return ()=>window.removeEventListener("popstate", onPop);
  },[]);

  /* selectors */
  const selOy  = useMemo(()=>oyentes.find(o=>o.id===selId),[oyentes,selId]);
  const selCon = useMemo(()=>concursos.find(c=>c.id===selId),[concursos,selId]);
  const conPartic = useCallback((conId)=>
    participaciones.filter(p=>p.concursoId===conId).map(p=>oyentes.find(o=>o.id===p.oyenteId)).filter(Boolean)
  ,[participaciones,oyentes]);
  const inCon = (oyId,conId)=>participaciones.some(p=>p.oyenteId===oyId&&p.concursoId===conId);

  /* concurso lists */
  const consActivos   = useMemo(()=>concursos.filter(c=>c.estado==="activo"),[concursos]);
  const consVisibles  = useMemo(()=>showArchived ? concursos : concursos.filter(c=>c.estado!=="archivado"),[concursos,showArchived]);

  /* stats */
  const stats = useMemo(()=>{
    const total=oyentes.length, ganadores=oyentes.filter(o=>parseInt(o.totalWins)>0).length;
    const recentW=oyentes.filter(o=>isRecent(o)).length;
    const edades=oyentes.filter(o=>o.edad).map(o=>parseInt(o.edad));
    const promEdad=edades.length?Math.round(edades.reduce((a,b)=>a+b,0)/edades.length):0;
    const rangos={"18-25":0,"26-35":0,"36-45":0,"46+":0};
    oyentes.forEach(o=>{const e=parseInt(o.edad);if(!e)return;if(e<=25)rangos["18-25"]++;else if(e<=35)rangos["26-35"]++;else if(e<=45)rangos["36-45"]++;else rangos["46+"]++;});
    const generos={Mujer:0,Hombre:0,Otro:0};
    oyentes.forEach(o=>{const g=o.genero;if(g==="Mujer")generos.Mujer++;else if(g==="Hombre")generos.Hombre++;else if(g)generos.Otro++;});
    return {total,ganadores,recentW,promEdad,rangos,generos,consActivos:consActivos.length};
  },[oyentes,consActivos]);

  /* ── CRUD ── */
  const addOyente = async()=>{
    if(!oyForm.nombre||!oyForm.telefono||!oyForm.dni){setFormErr("Nombre, teléfono y DNI son obligatorios.");return;}
    if(oyentes.find(o=>o.telefono===oyForm.telefono)){setFormErr("Ya existe un oyente con ese teléfono.");return;}
    setSaving(true);
    try {
      const newO={id:uid(),...oyForm,edad:parseInt(oyForm.edad)||"",fechaRegistro:today(),veces:0,totalWins:0,ultimoWin:""};
      await api("addOyente",newO);
      // Inscribir en concursos seleccionados
      let inscriptos=0, ganados=0;
      for(const conId of oyConIds){
        const con=concursos.find(c=>c.id===conId);
        if(!con)continue;
        const p={concursoId:conId,oyenteId:newO.id,fecha:today(),concursoNombre:con.nombre||"",concursoPremio:con.premio||""};
        await api("addParticipante",p);
        setPartic(prev=>[...prev,p]);
        inscriptos++;
        if(con.tipo==="ganador_directo"){
          const newWins=(parseInt(newO.totalWins)||0)+ganados+1;
          await api("setGanador",{concursoId:conId,oyenteId:newO.id,oyenteNombre:newO.nombre,newTotalWins:newWins,ultimoWin:today(),sinFinalizar:true});
          ganados++;
        }
      }
      const finalOy={...newO,veces:inscriptos,totalWins:ganados,ultimoWin:ganados>0?today():""};
      setOyentes(p=>[...p,finalOy]); setOyForm(emptyOy); setOyConIds([]); setEditConId("");
      showToast(inscriptos>0?`Oyente registrado e inscripto en ${inscriptos} concurso${inscriptos>1?"s":""}  ✓`:"Oyente registrado ✓"); nav(V.OYENTES);
    } catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const updateOyente = async()=>{
    if(!editForm.nombre||!editForm.telefono||!editForm.dni){setFormErr("Nombre, teléfono y DNI son obligatorios.");return;}
    const dup=oyentes.find(o=>o.telefono===editForm.telefono&&o.id!==selId);
    if(dup){setFormErr("Ya existe otro oyente con ese teléfono.");return;}
    setSaving(true);
    try {
      const updated={...selOy,...editForm,edad:parseInt(editForm.edad)||""};
      await api("updateOyente",updated);
      setOyentes(p=>p.map(o=>o.id===selId?updated:o));
      // Si eligió un concurso, inscribirlo/marcarlo ganador
      if(editConId){
        const con=concursos.find(c=>c.id===editConId);
        if(con&&!inCon(selId,editConId)){
          const p={concursoId:editConId,oyenteId:selId,fecha:today(),concursoNombre:con.nombre||"",concursoPremio:con.premio||""};
          await api("addParticipante",p);
          setPartic(prev=>[...prev,p]);
          if(con.tipo==="ganador_directo"){
            const newWins=(parseInt(updated.totalWins)||0)+1;
            await api("setGanador",{concursoId:editConId,oyenteId:selId,oyenteNombre:updated.nombre,newTotalWins:newWins,ultimoWin:today(),sinFinalizar:true});
            setOyentes(p=>p.map(o=>o.id===selId?{...updated,totalWins:newWins,ultimoWin:today(),veces:(parseInt(updated.veces)||0)+1}:o));
            showToast("Datos guardados · 🏆 Ganador en "+con.nombre);
          } else {
            setOyentes(p=>p.map(o=>o.id===selId?{...updated,veces:(parseInt(updated.veces)||0)+1}:o));
            showToast("Datos guardados · Inscripto en "+con.nombre);
          }
        } else {
          showToast("Datos actualizados ✓");
        }
      } else {
        showToast("Datos actualizados ✓");
      }
      setEditConId("");
      nav(V.OY_DET,selId);
    } catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const addConcurso = async()=>{
    if(!conForm.nombre||!conForm.premio){setFormErr("Nombre y premio son obligatorios.");return;}
    setSaving(true);
    try {
      const newC={id:uid(),...conForm,estado:"activo",ganadorId:"",ganadorNombre:""};
      await api("addConcurso",newC);
      setConcursos(p=>[...p,newC]); setConForm(emptyCon);
      showToast("Concurso creado ✓"); nav(V.CONS);
    } catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const inscribir = async(oyId,conId)=>{
    if(inCon(oyId,conId))return;
    const con=concursos.find(c=>c.id===conId);
    const esGanadorDirecto=con?.tipo==="ganador_directo";
    try {
      const p={concursoId:conId,oyenteId:oyId,fecha:today(),concursoNombre:con?.nombre||"",concursoPremio:con?.premio||""};
      await api("addParticipante",p);
      setPartic(prev=>[...prev,p]);
      if(esGanadorDirecto){
        const oyente=oyentes.find(o=>o.id===oyId);
        const newWins=(parseInt(oyente?.totalWins)||0)+1;
        await api("setGanador",{concursoId:conId,oyenteId:oyId,oyenteNombre:oyente?.nombre||"",newTotalWins:newWins,ultimoWin:today(),sinFinalizar:true});
        setOyentes(prev=>prev.map(o=>o.id===oyId?{...o,veces:(parseInt(o.veces)||0)+1,totalWins:newWins,ultimoWin:today()}:o));
        showToast("🏆 Inscripto como ganador en "+con.nombre);
      } else {
        setOyentes(prev=>prev.map(o=>o.id===oyId?{...o,veces:(parseInt(o.veces)||0)+1}:o));
        showToast("Inscripto en "+con?.nombre+" ✓");
      }
    } catch(e){showToast("Error: "+e.message,"err");}
  };

  const marcarGanadorDirecto = async(oyente)=>{
    if(!selCon)return;
    const newWins=parseInt(oyente.totalWins||0)+1;
    try {
      await api("setGanador",{concursoId:selCon.id,oyenteId:oyente.id,oyenteNombre:oyente.nombre,newTotalWins:newWins,ultimoWin:today()});
      setConcursos(p=>p.map(c=>c.id===selCon.id?{...c,estado:"finalizado",ganadorId:oyente.id,ganadorNombre:oyente.nombre}:c));
      setOyentes(p=>p.map(o=>o.id===oyente.id?{...o,totalWins:newWins,ultimoWin:today()}:o));
      showToast(`🏆 ${oyente.nombre} marcado como ganador`,"win");
    } catch(e){showToast("Error: "+e.message,"err");}
  };

  const archivarConcurso = async(conId)=>{
    try {
      await api("archivarConcurso",{concursoId:conId});
      setConcursos(p=>p.map(c=>c.id===conId?{...c,estado:"archivado"}:c));
      showToast("Concurso archivado"); nav(V.CONS);
    } catch(e){showToast("Error: "+e.message,"err");}
    setConfirm(null);
  };

  const extenderConcurso = async(conId, nuevaFechaHasta)=>{
    if(!nuevaFechaHasta){showToast("Seleccioná una fecha","err");return;}
    try {
      await api("extenderConcurso",{concursoId:conId,fechaHasta:nuevaFechaHasta});
      setConcursos(p=>p.map(c=>c.id===conId?{...c,fechaHasta:nuevaFechaHasta}:c));
      setExtendiendo(false); setNuevaFecha("");
      showToast("Concurso extendido hasta "+nuevaFechaHasta+" ✓");
    } catch(e){showToast("Error: "+e.message,"err");}
  };

  const eliminarConcurso = async(conId)=>{
    try {
      await api("eliminarConcurso",{concursoId:conId});
      setConcursos(p=>p.filter(c=>c.id!==conId));
      showToast("Concurso eliminado"); nav(V.CONS);
    } catch(e){showToast("Error: "+e.message,"err");}
    setConfirm(null);
  };

  const realizarSorteo = async()=>{
    const partic=conPartic(selCon.id);
    if(!partic.length)return;
    setSorteo({animando:true,ganador:null,nombres:partic.map(p=>p.nombre)});
    let tick=0;
    const iv=setInterval(()=>{
      tick++;
      setSorteo(s=>({...s,nombres:[...partic].sort(()=>Math.random()-.5).map(p=>p.nombre)}));
      if(tick>25){
        clearInterval(iv);
        const winner=partic[Math.floor(Math.random()*partic.length)];
        setSorteo({animando:false,ganador:winner,nombres:[]});
        const newWins=parseInt(winner.totalWins||0)+1;
        api("setGanador",{concursoId:selCon.id,oyenteId:winner.id,oyenteNombre:winner.nombre,newTotalWins:newWins,ultimoWin:today()});
        setConcursos(p=>p.map(c=>c.id===selCon.id?{...c,estado:"finalizado",ganadorId:winner.id,ganadorNombre:winner.nombre}:c));
        setOyentes(p=>p.map(o=>o.id===winner.id?{...o,totalWins:newWins,ultimoWin:today()}:o));
        showToast(`🏆 ¡${winner.nombre} ganó!`,"win");
      }
    },70);
  };

  /* ── Excel export ── */
  const exportExcel = async ()=>{
    showToast("Generando Excel...");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "Metro Power Hits";
      wb.created = new Date();

      // ── Hoja 1: Oyentes ──────────────────────────────────────────────────
      const ws = wb.addWorksheet("Oyentes", { views:[{state:"frozen",ySplit:2}] });

      // Fila de título
      ws.mergeCells("A1:J1");
      const titleCell = ws.getCell("A1");
      titleCell.value = "METRO POWER HITS — Base de Oyentes";
      titleCell.font = { name:"Arial", bold:true, size:14, color:{argb:"FFFFFFFF"} };
      titleCell.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0EA5E9"} };
      titleCell.alignment = { horizontal:"center", vertical:"middle" };
      ws.getRow(1).height = 30;

      // Encabezados
      const COLS = [
        { header:"Nombre",           key:"nombre",     width:28 },
        { header:"Teléfono / WA",    key:"telefono",   width:18 },
        { header:"DNI",              key:"dni",        width:13 },
        { header:"Email",            key:"email",      width:26 },
        { header:"Edad",             key:"edad",       width:8  },
        { header:"Localidad",        key:"localidad",  width:20 },
        { header:"Género",           key:"genero",     width:10 },
        { header:"Participaciones",  key:"veces",      width:16 },
        { header:"Premios ganados",  key:"totalWins",  width:16 },
        { header:"Último premio",    key:"ultimoWin",  width:14 },
      ];

      ws.columns = COLS.map(c=>({ key:c.key, width:c.width }));

      const headerRow = ws.getRow(2);
      COLS.forEach((c,i)=>{
        const cell = headerRow.getCell(i+1);
        cell.value = c.header;
        cell.font = { name:"Arial", bold:true, size:10, color:{argb:"FFFFFFFF"} };
        cell.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF1E3A5F"} };
        cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
        cell.border = { bottom:{style:"thin",color:{argb:"FF0EA5E9"}} };
      });
      headerRow.height = 22;

      // Datos
      const generoColor = g => g==="Mujer"?"FFFCE4EC":g==="Hombre"?"FFE3F2FD":"FFF3E5F5";
      oyentes.forEach((o,i)=>{
        const row = ws.addRow({
          nombre:   o.nombre||"",
          telefono: o.telefono||"",
          dni:      o.dni||"",
          email:    o.email||"",
          edad:     parseInt(o.edad)||"",
          localidad:o.localidad||"",
          genero:   o.genero||"",
          veces:    parseInt(o.veces)||0,
          totalWins:parseInt(o.totalWins)||0,
          ultimoWin:o.ultimoWin||"",
        });
        const bg = i%2===0 ? "FFFFFFFF" : "FFF0F7FF";
        row.eachCell(cell=>{
          cell.font = { name:"Arial", size:10 };
          cell.fill = { type:"pattern", pattern:"solid", fgColor:{argb:bg} };
          cell.alignment = { vertical:"middle" };
          cell.border = { bottom:{style:"hair",color:{argb:"FFDDE6F0"}} };
        });
        // Color celda género
        if(o.genero){ const gc=row.getCell(7); gc.fill={type:"pattern",pattern:"solid",fgColor:{argb:generoColor(o.genero)}}; }
        // Negrita si tiene premios
        if(parseInt(o.totalWins)>0){ row.getCell(9).font={name:"Arial",size:10,bold:true,color:{argb:"FF10B981"}}; }
        // Alerta rojo suave si ganó en últimos 30 días
        if(isRecent(o)){ row.getCell(10).font={name:"Arial",size:10,bold:true,color:{argb:"FFD97706"}}; }
        row.height = 18;
      });

      // Totales
      const totRow = ws.addRow(["","","","","","","Total:",oyentes.length,oyentes.filter(o=>parseInt(o.totalWins)>0).length,""]);
      totRow.eachCell(cell=>{ cell.font={name:"Arial",size:10,bold:true}; cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFE0F2FE"}}; });

      // ── Hoja 2: Estadísticas ─────────────────────────────────────────────
      const ws2 = wb.addWorksheet("Estadísticas");

      const addStat = (title, data, startRow) => {
        ws2.mergeCells(`A${startRow}:C${startRow}`);
        const h = ws2.getCell(`A${startRow}`);
        h.value = title; h.font={name:"Arial",bold:true,size:11,color:{argb:"FFFFFFFF"}};
        h.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0EA5E9"}};
        h.alignment={horizontal:"left",vertical:"middle"}; h.border={bottom:{style:"thin",color:{argb:"FF1E3A5F"}}};
        ws2.getRow(startRow).height=22;
        data.forEach(([label,val],i)=>{
          const r=ws2.getRow(startRow+1+i);
          r.getCell(1).value=label; r.getCell(1).font={name:"Arial",size:10};
          r.getCell(2).value=val; r.getCell(2).font={name:"Arial",size:10,bold:true,color:{argb:"FF0EA5E9"}};
          r.getCell(2).alignment={horizontal:"right"};
          const bg=i%2===0?"FFFFFFFF":"FFF0F7FF";
          [1,2,3].forEach(c=>{ r.getCell(c).fill={type:"pattern",pattern:"solid",fgColor:{argb:bg}}; });
          r.height=18;
        });
        return startRow+data.length+2;
      };

      ws2.getColumn(1).width=22; ws2.getColumn(2).width=14; ws2.getColumn(3).width=5;
      const edadesData=Object.entries({"18-25":0,"26-35":0,"36-45":0,"46+":0});
      oyentes.forEach(o=>{const e=parseInt(o.edad);if(!e)return;if(e<=25)edadesData[0][1]++;else if(e<=35)edadesData[1][1]++;else if(e<=45)edadesData[2][1]++;else edadesData[3][1]++;});
      const genData={Mujer:0,Hombre:0,Otro:0};
      oyentes.forEach(o=>{if(o.genero==="Mujer")genData.Mujer++;else if(o.genero==="Hombre")genData.Hombre++;else if(o.genero)genData.Otro++;});
      let r=1;
      r=addStat("📊 Resumen general",[["Total oyentes",oyentes.length],["Con premios",oyentes.filter(o=>parseInt(o.totalWins)>0).length],["Ganaron en últimos 30d",oyentes.filter(o=>isRecent(o)).length]],r);
      r=addStat("🎂 Rango de edades",edadesData.map(([k,v])=>[k+" años",v]),r);
      r=addStat("👤 Género",Object.entries(genData),r);

      // Descargar
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download="MetroPowerHits_Oyentes.xlsx"; a.click();
      URL.revokeObjectURL(url);
      showToast("Excel generado ✓");
    } catch(e){ showToast("Error al generar Excel: "+e.message,"err"); console.error(e); }
  };

  /* ── sub-components ── */
  const Lbl=({children})=><label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{children}</label>;
  const FErr=()=>formErr?<div style={{color:C.red,fontSize:12,background:C.red+"11",border:`1px solid ${C.red}44`,borderRadius:6,padding:"8px 12px",marginBottom:14}}>{formErr}</div>:null;
  const Title=({t,sub})=><div style={{marginBottom:22}}><h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:2,lineHeight:1}}>{t}</h2>{sub&&<p style={{color:C.muted,fontSize:13,marginTop:4}}>{sub}</p>}</div>;
  const Back=({to,label="← Volver"})=><button className="btn-ghost" onClick={()=>nav(to)} style={{marginBottom:20}}>{label}</button>;
  const Bar=({val,max,color})=><div style={{height:6,background:C.border,borderRadius:3,marginTop:4}}><div style={{height:"100%",width:`${max?Math.round((val/max)*100):0}%`,background:color||C.accent,borderRadius:3,transition:"width .6s"}}/></div>;

  if(loading) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{css}</style>
      <div style={{textAlign:"center"}}><div style={{width:44,height:44,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",margin:"0 auto 16px",animation:"spin .8s linear infinite"}}/><p style={{color:C.muted,fontSize:14}}>Cargando datos...</p></div>
    </div>
  );

  const navTabs=[{id:V.DASH,icon:"◉",label:"Inicio"},{id:V.OYENTES,icon:"👥",label:"Oyentes"},{id:V.CONS,icon:"🎯",label:"Concursos"},{id:V.BUSCAR,icon:"📱",label:"WhatsApp"}];

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",color:C.text}}>
      <style>{css}</style>

      {/* CONFIRM MODAL */}
      {confirm&&confirm.type==="archivar"&&<ConfirmModal C={C} title="Archivar concurso" msg="El concurso va a dejar de aparecer en la pantalla principal. Los datos de los participantes se conservan. Podés verlos activando 'Mostrar archivados'." confirmLabel="Archivar" confirmClass="btn-ghost" onConfirm={()=>archivarConcurso(confirm.id)} onCancel={()=>setConfirm(null)}/>}
      {confirm&&confirm.type==="eliminar"&&<ConfirmModal C={C} title="Eliminar concurso" msg="Esto elimina el concurso permanentemente. Los oyentes inscriptos no se borran, pero perderán el historial de esta participación. ¿Estás seguro?" confirmLabel="Eliminar definitivamente" confirmClass="btn-red" onConfirm={()=>eliminarConcurso(confirm.id)} onCancel={()=>setConfirm(null)}/>}

      {/* HEADER */}
      <div style={{background:C.headerBg,borderBottom:`1px solid ${C.border}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:200,boxShadow:C.shadow}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,boxShadow:`0 0 8px ${C.accent}88`}} className="blink"/>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,letterSpacing:2,textTransform:"uppercase",flex:1}}>METRO POWER HITS</span>
        <button onClick={exportExcel} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11,fontWeight:600}} title="Exportar oyentes a Excel">⬇ Excel</button>
        <button onClick={()=>setDark(d=>!d)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:16,padding:"4px 12px",color:C.muted,fontSize:11,fontWeight:600}}>{dark?"☀️":"🌙"}</button>
        <button onClick={()=>{loadAll();showToast("Datos actualizados ✓");}} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11}}>↺</button>
        <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11}}>Salir</button>
      </div>

      {/* NAV */}
      <div style={{background:C.headerBg,borderBottom:`1px solid ${C.border}`,display:"flex",padding:"0 16px",overflowX:"auto"}}>
        {navTabs.map(n=>(
          <button key={n.id} onClick={()=>nav(n.id)}
            style={{background:"transparent",border:"none",borderBottom:`2px solid ${view===n.id?C.accent:"transparent"}`,color:view===n.id?C.accent:C.muted,padding:"12px 14px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"color .2s"}}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",top:64,right:16,zIndex:999,background:toast.type==="win"?C.green:toast.type==="err"?C.red:C.accent,color:"#fff",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:14,boxShadow:"0 4px 24px rgba(0,0,0,.2)",maxWidth:320}}>{toast.msg}</div>}

      {/* CONTENT */}
      <div style={{padding:"20px 16px",maxWidth:920,margin:"0 auto"}}>

        {/* ── DASHBOARD ── */}
        {view===V.DASH&&(
          <div className="fade-in">
            <Title t="Panel Principal" sub={new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:20}}>
              {[[stats.total,"👥","Oyentes",C.accent],[stats.consActivos,"🎯","Activos",C.warn],[stats.ganadores,"🏆","Ganadores",C.green],[stats.promEdad?stats.promEdad+"a":"—","📊","Edad prom.","#A855F7"]].map(([v,ic,l,col],i)=>(
                <div key={i} className="card" style={{padding:"16px 14px"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{ic}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:800,color:col,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                </div>
              ))}
            </div>
            {stats.recentW>0&&<div style={{background:C.warn+"11",border:`1px solid ${C.warn}44`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><span style={{color:C.warn,fontSize:13,fontWeight:600}}>{stats.recentW} oyente{stats.recentW>1?"s":""} ganaron un premio en los últimos 30 días.</span></div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Rango de edades</h3>
                {Object.entries(stats.rangos).map(([r,n])=>{const max=Math.max(...Object.values(stats.rangos),1);return(<div key={r} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{r} años</span><span style={{fontWeight:700}}>{n}</span></div><Bar val={n} max={max} color={C.accent}/></div>);})}
              </div>
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Género</h3>
                {Object.entries(stats.generos).map(([g,n])=>{const max=Math.max(...Object.values(stats.generos),1);const col=g==="Mujer"?"#EC4899":g==="Hombre"?"#3B82F6":"#8B5CF6";return(<div key={g} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{g}</span><span style={{fontWeight:700}}>{n}</span></div><Bar val={n} max={max} color={col}/></div>);})}
                {Object.values(stats.generos).every(n=>n===0)&&<p style={{color:C.muted,fontSize:12}}>Sin datos aún</p>}
              </div>
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Concursos activos</h3>
                {consActivos.length===0&&<p style={{color:C.muted,fontSize:13}}>No hay concursos activos.</p>}
                {consActivos.map(c=>(
                  <div key={c.id} className="row" onClick={()=>nav(V.CON_DET,c.id)} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                    <div style={{fontWeight:600,fontSize:13}}>{c.nombre}</div>
                    <div style={{color:C.muted,fontSize:11,marginTop:1}}>{conPartic(c.id).length} participantes · {c.tipo==="sorteo"?"🎲 Sorteo":"🏆 Ganador directo"}</div>
                  </div>
                ))}
                <button className="btn" onClick={()=>nav(V.CON_NEW)} style={{width:"100%",marginTop:14,padding:10}}>+ Nuevo concurso</button>
              </div>
            </div>
          </div>
        )}

        {/* ── OYENTES ── */}
        {view===V.OYENTES&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:10,flexWrap:"wrap"}}>
              <Title t="Oyentes" sub={`${oyentes.length} registrados`}/>
              <button className="btn" onClick={()=>nav(V.OY_NEW)}>+ Registrar oyente</button>
            </div>
            <input className="inp" placeholder="Buscar por nombre, teléfono, DNI o localidad..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{marginBottom:14}}/>
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${C.border}`,background:C.bg}}>
                      {["Oyente","Teléfono","Edad","Localidad","Género","Particip.","Estado"].map(h=>(
                        <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {oyentes.filter(o=>{
                      if(!busqueda)return true;
                      const q=busqueda.toLowerCase();
                      return o.nombre.toLowerCase().includes(q)||o.telefono.includes(busqueda)||(o.dni||"").includes(busqueda)||(o.localidad||"").toLowerCase().includes(q);
                    }).map(o=>(
                      <tr key={o.id} className="row" style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>nav(V.OY_DET,o.id)}>
                        <td style={{padding:"11px 14px"}}><div style={{fontWeight:600,fontSize:14}}>{o.nombre}</div><div style={{color:C.muted,fontSize:11,marginTop:1}}>DNI {o.dni}</div></td>
                        <td style={{padding:"11px 14px",fontSize:13,color:C.muted,whiteSpace:"nowrap"}}>{o.telefono}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}>{o.edad||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:13,color:C.muted}}>{o.localidad||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}>{o.genero||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}><span style={{color:C.accent,fontWeight:700}}>{o.veces||0}</span></td>
                        <td style={{padding:"11px 14px"}}>
                          {isRecent(o)?<span className="tag-warn">⚠ {daysSince(o.ultimoWin)}d</span>:parseInt(o.totalWins)>0?<span className="tag-ok">🏆 {o.totalWins}</span>:<span style={{color:C.muted,fontSize:12}}>Sin premios</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {oyentes.length===0&&<div style={{padding:32,textAlign:"center",color:C.muted,fontSize:14}}>No hay oyentes registrados aún.</div>}
            </div>
          </div>
        )}

        {/* ── DETALLE OYENTE ── */}
        {view===V.OY_DET&&selOy&&(
          <div className="fade-in">
            <Back to={V.OYENTES}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:20,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:C.accent+"22",border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,flexShrink:0,color:C.accent}}>
                  {selOy.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{selOy.nombre}</h2>
                  <p style={{color:C.muted,fontSize:13}}>Registrado el {selOy.fechaRegistro}</p>
                </div>
              </div>
              <button className="btn-ghost" onClick={()=>{ setEditForm({nombre:selOy.nombre||"",telefono:selOy.telefono||"",dni:selOy.dni||"",email:selOy.email||"",edad:selOy.edad||"",localidad:selOy.localidad||"",genero:selOy.genero||""}); setFormErr(""); nav(V.OY_EDIT,selOy.id); }} style={{display:"flex",alignItems:"center",gap:6}}>✏️ Editar datos</button>
            </div>
            {isRecent(selOy)&&<div style={{background:C.warn+"11",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",gap:8,alignItems:"center"}}><span>⚠️</span><span style={{color:C.warn,fontWeight:600,fontSize:13}}>Ganó un premio hace {daysSince(selOy.ultimoWin)} días.</span></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["📱 Teléfono",selOy.telefono],["🪪 DNI",selOy.dni],["✉️ Email",selOy.email||"—"],["🎂 Edad",selOy.edad?selOy.edad+" años":"—"],["📍 Localidad",selOy.localidad||"—"],["👤 Género",selOy.genero||"—"]].map(([l,val])=>(
                <div key={l} className="card" style={{padding:"12px 14px"}}><div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:600}}>{val}</div></div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {[["Participaciones",selOy.veces||0,C.accent],["Premios ganados",selOy.totalWins||0,C.green],["Días últ. premio",daysSince(selOy.ultimoWin)!==null?daysSince(selOy.ultimoWin)+"d":"Nunca",C.warn]].map(([l,val,col])=>(
                <div key={l} className="card" style={{padding:16,textAlign:"center"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:800,color:col}}>{val}</div><div style={{color:C.muted,fontSize:11,marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div></div>
              ))}
            </div>
            <div className="card" style={{padding:18}}>
              <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Historial de concursos</h3>
              {participaciones.filter(p=>p.oyenteId===selOy.id).length===0&&<p style={{color:C.muted,fontSize:13}}>No participó en concursos aún.</p>}
              {participaciones.filter(p=>p.oyenteId===selOy.id).map(p=>{
                const con=concursos.find(c=>c.id===p.concursoId);
                const nombre=con?.nombre||p.concursoNombre||"Concurso eliminado";
                const premio=con?.premio||p.concursoPremio||"";
                const diasAtras=p.fecha?daysSince(p.fecha):null;
                const cuandoStr=diasAtras===0?"hoy":diasAtras===1?"ayer":diasAtras!==null?"hace "+diasAtras+" días":"";
                return(<div key={p.concursoId+p.oyenteId} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                      {nombre}
                      {!con&&<span style={{fontSize:10,color:C.muted,fontWeight:400,background:C.border,borderRadius:4,padding:"1px 6px"}}>eliminado</span>}
                    </div>
                    {premio&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>🎁 {premio}</div>}
                    {cuandoStr&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>🗓 Inscripto {cuandoStr} · {p.fecha}</div>}
                  </div>
                  <div style={{flexShrink:0,marginLeft:8}}>
                    {(con?.ganadorId===selOy.id||con?.tipo==="ganador_directo")?<span className="tag-ok">🏆 Ganador</span>:con?.estado==="activo"?<span className="tag-active">En curso</span>:!con?<span className="tag-done">Finalizado</span>:<span className="tag-done">No ganó</span>}
                  </div>
                </div>);
              })}
            </div>

            {/* Agregar a concurso activo desde el perfil */}
            {consActivos.filter(c=>!inCon(selOy.id,c.id)).length>0&&(
              <div className="card" style={{padding:18,marginTop:14}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Agregar a concurso activo</h3>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {consActivos.filter(c=>!inCon(selOy.id,c.id)).map(c=>(
                    <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,gap:10,flexWrap:"wrap"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{c.nombre}</div>
                        <div style={{fontSize:11,color:C.muted}}>🎁 {c.premio} · {c.tipo==="sorteo"?"🎲 Sorteo":"🏆 Ganador directo"}</div>
                      </div>
                      <button
                        className={c.tipo==="ganador_directo"?"btn-green":"btn-ghost"}
                        style={{padding:"6px 14px",fontSize:12,flexShrink:0}}
                        onClick={()=>inscribir(selOy.id,c.id)}>
                        {c.tipo==="ganador_directo"?"🏆 Marcar ganador":"+ Inscribir"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NUEVO OYENTE ── */}
        {view===V.OY_NEW&&(
          <div className="fade-in" style={{maxWidth:520}}>
            <Back to={V.OYENTES}/>
            <Title t="Registrar Oyente"/>
            <FErr/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[["nombre","Nombre completo *","text","Lucía Fernández"],["telefono","Teléfono / WhatsApp *","tel","1134567890"],["dni","DNI *","text","32456789"],["email","Email","email","lucia@gmail.com"],["edad","Edad","number","28"],["localidad","Localidad","text","Palermo, CABA"]].map(([k,l,t,ph])=>(
                <div key={k} style={{gridColumn:k==="nombre"?"1 / span 2":"auto"}}>
                  <Lbl>{l}</Lbl>
                  <input className="inp" type={t} placeholder={ph} value={oyForm[k]} onChange={e=>{setOyForm(p=>({...p,[k]:e.target.value}));setFormErr("")}}/>
                </div>
              ))}
              <div>
                <Lbl>Género</Lbl>
                <select className="sel" value={oyForm.genero} onChange={e=>{setOyForm(p=>({...p,genero:e.target.value}));setFormErr("")}}>
                  <option value="">Seleccionar...</option>
                  <option>Mujer</option><option>Hombre</option><option>Otro</option>
                </select>
              </div>
            </div>
            {/* Inscribir en concursos activos */}
            {consActivos.length>0&&(
              <div style={{marginTop:20}}>
                <Lbl>Anotar como ganador en concurso activo (opcional)</Lbl>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {consActivos.map(c=>{
                    const selected=oyConIds.includes(c.id);
                    return(
                      <div key={c.id} onClick={()=>setOyConIds(p=>selected?p.filter(id=>id!==c.id):[...p,c.id])}
                        style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,border:`2px solid ${selected?C.accent:C.border}`,background:selected?C.accent+"11":C.card,cursor:"pointer",transition:"all .15s"}}>
                        <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selected?C.accent:C.border}`,background:selected?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                          {selected&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:13,color:selected?C.accent:C.text}}>{c.nombre}</div>
                          <div style={{fontSize:11,color:C.muted}}>🎁 {c.premio} · {c.tipo==="sorteo"?"🎲 Sorteo":"🏆 Ganador directo"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {oyConIds.length>0&&<p style={{color:C.green,fontSize:12,marginTop:8,fontWeight:600}}>🏆 Se registrará como ganador en {oyConIds.length} concurso{oyConIds.length>1?"s":""}</p>}
              </div>
            )}
            <button className="btn" onClick={addOyente} disabled={saving} style={{width:"100%",padding:13,marginTop:20}}>{saving?"Guardando...":"Registrar oyente"}</button>
          </div>
        )}

        {/* ── EDITAR OYENTE ── */}
        {view===V.OY_EDIT&&selOy&&(
          <div className="fade-in" style={{maxWidth:520}}>
            <Back to={V.OY_DET} label="← Volver al perfil"/>
            <Title t="Editar Oyente" sub={selOy.nombre}/>
            <FErr/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[["nombre","Nombre completo *","text"],["telefono","Teléfono / WhatsApp *","tel"],["dni","DNI *","text"],["email","Email","email"],["edad","Edad","number"],["localidad","Localidad","text"]].map(([k,l,t])=>(
                <div key={k} style={{gridColumn:k==="nombre"?"1 / span 2":"auto"}}>
                  <Lbl>{l}</Lbl>
                  <input className="inp" type={t} value={editForm[k]} onChange={e=>{setEditForm(p=>({...p,[k]:e.target.value}));setFormErr("");}}/>
                </div>
              ))}
              <div>
                <Lbl>Género</Lbl>
                <select className="sel" value={editForm.genero} onChange={e=>{setEditForm(p=>({...p,genero:e.target.value}));setFormErr("");}}>
                  <option value="">Seleccionar...</option>
                  <option>Mujer</option><option>Hombre</option><option>Otro</option>
                </select>
              </div>
            </div>
            {/* Agregar a concurso activo */}
            {consActivos.filter(c=>!inCon(selOy.id,c.id)).length>0&&(
              <div style={{marginTop:20}}>
                <Lbl>Agregar a concurso activo (opcional)</Lbl>
                <select className="sel" value={editConId} onChange={e=>setEditConId(e.target.value)}>
                  <option value="">— No agregar a ninguno —</option>
                  {consActivos.filter(c=>!inCon(selOy.id,c.id)).map(c=>(
                    <option key={c.id} value={c.id}>
                      {c.tipo==="ganador_directo"?"🏆":"🎲"} {c.nombre} — {c.premio}
                    </option>
                  ))}
                </select>
                {editConId&&(()=>{
                  const con=concursos.find(c=>c.id===editConId);
                  return con?(
                    <p style={{color:con.tipo==="ganador_directo"?C.green:C.accent,fontSize:12,marginTop:6,fontWeight:600}}>
                      {con.tipo==="ganador_directo"?"🏆 Se marcará como ganador en":"🎲 Se inscribirá en"} {con.nombre}
                    </p>
                  ):null;
                })()}
              </div>
            )}
            <button className="btn" onClick={updateOyente} disabled={saving} style={{width:"100%",padding:13,marginTop:20}}>{saving?"Guardando...":"Guardar cambios"}</button>
          </div>
        )}

        {/* ── CONCURSOS ── */}
        {view===V.CONS&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:10,flexWrap:"wrap"}}>
              <Title t="Concursos" sub={`${consVisibles.length} concursos`}/>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <button onClick={()=>setShowArchived(s=>!s)} className="btn-ghost" style={{fontSize:12,padding:"6px 14px"}}>
                  {showArchived?"Ocultar archivados":"Mostrar archivados"}
                </button>
                <button className="btn" onClick={()=>nav(V.CON_NEW)}>+ Nuevo concurso</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {consVisibles.length===0&&<div className="card" style={{padding:32,textAlign:"center",color:C.muted}}>No hay concursos. ¡Creá el primero!</div>}
              {consVisibles.map(c=>{
                const pCount=conPartic(c.id).length;
                return(
                  <div key={c.id} className="card row" onClick={()=>nav(V.CON_DET,c.id)} style={{padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,opacity:c.estado==="archivado"?.6:1}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}>{c.nombre}</span>
                        {c.estado==="activo"&&<span className="tag-active">Activo</span>}
                        {c.estado==="finalizado"&&<span className="tag-done">Finalizado</span>}
                        {c.estado==="archivado"&&<span className="tag-arch">Archivado</span>}
                        <span style={{background:C.bg,color:C.muted,border:`1px solid ${C.border}`,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600}}>{c.tipo==="sorteo"?"🎲 Sorteo":"🏆 Ganador directo"}</span>
                      </div>
                      <div style={{color:C.muted,fontSize:12}}>🎁 {c.premio} · {pCount} participantes{c.fechaDesde?" · "+c.fechaDesde+(c.fechaHasta?" → "+c.fechaHasta:""):""}</div>
                      {c.ganadorNombre&&<div style={{color:C.green,fontSize:12,fontWeight:600,marginTop:3}}>🏆 {c.ganadorNombre}</div>}
                    </div>
                    <span style={{color:C.muted,fontSize:20}}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DETALLE CONCURSO ── */}
        {view===V.CON_DET&&selCon&&(
          <div className="fade-in">
            <Back to={V.CONS}/>
            {/* Header del concurso */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{selCon.nombre}</h2>
                  {selCon.estado==="activo"&&<span className="tag-active">Activo</span>}
                  {selCon.estado==="finalizado"&&<span className="tag-done">Finalizado</span>}
                  {selCon.estado==="archivado"&&<span className="tag-arch">Archivado</span>}
                  <span style={{background:C.bg,color:C.muted,border:`1px solid ${C.border}`,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600}}>{selCon.tipo==="sorteo"?"🎲 Sorteo":"🏆 Ganador directo"}</span>
                </div>
                <p style={{color:C.muted,fontSize:13}}>🎁 {selCon.premio}{selCon.fechaDesde?" · Desde "+selCon.fechaDesde:""}{selCon.fechaHasta?" hasta "+selCon.fechaHasta:""}</p>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {selCon.estado==="activo"&&conPartic(selCon.id).length>0&&selCon.tipo==="sorteo"&&(
                  <button className="btn-green" onClick={()=>nav(V.SORTEO,selCon.id)}>🎲 Sortear</button>
                )}
                {selCon.estado==="activo"&&(
                  <button className="btn-ghost" style={{fontSize:12}} onClick={()=>{ setExtendiendo(e=>!e); setNuevaFecha(selCon.fechaHasta||""); }}>📅 Extender</button>
                )}
                {selCon.estado!=="archivado"&&(
                  <button className="btn-ghost" style={{fontSize:12}} onClick={e=>{e.stopPropagation();setConfirm({type:"archivar",id:selCon.id});}}>📦 Archivar</button>
                )}
                <button className="btn-red" style={{fontSize:12,padding:"9px 14px"}} onClick={e=>{e.stopPropagation();setConfirm({type:"eliminar",id:selCon.id});}}>🗑 Eliminar</button>
              </div>
            </div>

            {/* Ganador banner */}
            {selCon.ganadorNombre&&(
              <div style={{background:C.green+"11",border:`1px solid ${C.green}44`,borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:28}}>🏆</span>
                <div><div style={{color:C.green,fontWeight:700,fontSize:18,fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Ganador: {selCon.ganadorNombre}</div><div style={{color:C.muted,fontSize:12}}>Premio: {selCon.premio}</div></div>
              </div>
            )}

            {/* Panel extender fecha */}
            {extendiendo&&(
              <div className="card fade-in" style={{padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontWeight:600,fontSize:13,color:C.text}}>📅 Nueva fecha límite:</span>
                <input className="inp" type="date" value={nuevaFecha} onChange={e=>setNuevaFecha(e.target.value)} style={{width:"auto",flex:1,minWidth:160}}/>
                <button className="btn" style={{padding:"8px 18px",fontSize:13}} onClick={()=>extenderConcurso(selCon.id,nuevaFecha)}>Confirmar</button>
                <button className="btn-ghost" style={{padding:"8px 14px",fontSize:13}} onClick={()=>setExtendiendo(false)}>Cancelar</button>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* Lista participantes */}
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Participantes ({conPartic(selCon.id).length})</h3>
                {conPartic(selCon.id).length===0&&<p style={{color:C.muted,fontSize:13}}>Sin participantes aún.</p>}
                {conPartic(selCon.id).map(o=>(
                  <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>{o.nombre}</div><div style={{color:C.muted,fontSize:11}}>{o.telefono}</div></div>
                    <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {(selCon.ganadorId===o.id||selCon.tipo==="ganador_directo")&&<span className="tag-ok">🏆 Ganó</span>}
                      {isRecent(o)&&selCon.ganadorId!==o.id&&<span className="tag-warn">⚠{daysSince(o.ultimoWin)}d</span>}
                      {selCon.estado==="activo"&&selCon.tipo==="ganador_directo"&&selCon.ganadorId!==o.id&&(
                        <button className="btn-green btn-sm" onClick={()=>marcarGanadorDirecto(o)}>✓ Ganador</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Inscribir oyente */}
              {selCon.estado==="activo"&&(
                <div className="card" style={{padding:18}}>
                  <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Inscribir oyente</h3>
                  <input className="inp" placeholder="Buscar por nombre o teléfono..." value={conBusq} onChange={e=>setConBusq(e.target.value)} style={{marginBottom:10,padding:"8px 12px",fontSize:13}}/>
                  <div style={{maxHeight:280,overflowY:"auto"}}>
                    {oyentes
                      .filter(o=>!inCon(o.id,selCon.id))
                      .filter(o=>!conBusq||o.nombre.toLowerCase().includes(conBusq.toLowerCase())||o.telefono.includes(conBusq))
                      .map(o=>(
                        <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:13}}>{o.nombre}</div>
                            <div style={{color:isRecent(o)?C.warn:C.muted,fontSize:11}}>{o.telefono}{isRecent(o)?" · ⚠ ganó hace "+daysSince(o.ultimoWin)+"d":""}</div>
                          </div>
                          <button className="btn-ghost" onClick={()=>inscribir(o.id,selCon.id)} style={{padding:"4px 12px",fontSize:12,flexShrink:0}}>+ Inscribir</button>
                        </div>
                    ))}
                    {oyentes.filter(o=>!inCon(o.id,selCon.id)).length===0&&<p style={{color:C.muted,fontSize:13}}>Todos los oyentes ya están inscriptos.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SORTEO ── */}
        {view===V.SORTEO&&selCon&&(
          <div className="fade-in" style={{textAlign:"center",paddingTop:20}}>
            <Back to={V.CON_DET} label="← Volver al concurso"/>
            <div style={{fontSize:36,marginBottom:8}}>🎲</div>
            <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:800,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>SORTEO EN VIVO</h2>
            <p style={{color:C.muted,fontSize:14,marginBottom:6}}>{selCon.nombre}</p>
            <p style={{color:C.accent,fontWeight:700,fontSize:16,marginBottom:32}}>🎁 {selCon.premio}</p>
            {!sorteoState.ganador&&!sorteoState.animando&&(
              <div className="card" style={{display:"inline-block",padding:"32px 48px",marginBottom:28}}>
                <p style={{color:C.muted,fontSize:14,marginBottom:20}}>{conPartic(selCon.id).length} participantes en el bombo</p>
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
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:48,fontWeight:800,color:C.green,letterSpacing:2,textTransform:"uppercase",lineHeight:1,marginBottom:8}}>{sorteoState.ganador.nombre}</div>
                <div style={{color:C.muted,fontSize:16,marginBottom:4}}>📱 {sorteoState.ganador.telefono}</div>
                <div style={{color:C.muted,fontSize:16,marginBottom:24}}>DNI: {sorteoState.ganador.dni}</div>
                {parseInt(sorteoState.ganador.totalWins)>1&&<div style={{background:C.warn+"11",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 20px",display:"inline-block",marginBottom:20}}><span style={{color:C.warn,fontSize:13,fontWeight:600}}>⚠️ Ganó {parseInt(sorteoState.ganador.totalWins)-1} veces anteriormente</span></div>}
                <div><button className="btn-ghost" onClick={()=>nav(V.CONS)}>Ver todos los concursos</button></div>
              </div>
            )}
          </div>
        )}

        {/* ── NUEVO CONCURSO ── */}
        {view===V.CON_NEW&&(
          <div className="fade-in" style={{maxWidth:520}}>
            <Back to={V.CONS}/>
            <Title t="Nuevo Concurso"/>
            <FErr/>
            <Lbl>Nombre del concurso *</Lbl>
            <input className="inp" placeholder="Ej: Entradas Shakira" value={conForm.nombre} onChange={e=>{setConForm(p=>({...p,nombre:e.target.value}));setFormErr("")}} style={{marginBottom:14}}/>
            <Lbl>Premio *</Lbl>
            <input className="inp" placeholder="Ej: 2 entradas campo" value={conForm.premio} onChange={e=>{setConForm(p=>({...p,premio:e.target.value}));setFormErr("")}} style={{marginBottom:14}}/>
            <Lbl>Descripción</Lbl>
            <input className="inp" placeholder="Detalles adicionales..." value={conForm.descripcion} onChange={e=>setConForm(p=>({...p,descripcion:e.target.value}))} style={{marginBottom:14}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div><Lbl>Fecha desde</Lbl><input className="inp" type="date" value={conForm.fechaDesde} onChange={e=>setConForm(p=>({...p,fechaDesde:e.target.value}))}/></div>
              <div><Lbl>Fecha hasta</Lbl><input className="inp" type="date" value={conForm.fechaHasta} onChange={e=>setConForm(p=>({...p,fechaHasta:e.target.value}))}/></div>
            </div>
            <Lbl>Tipo de concurso *</Lbl>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[["ganador_directo","🏆 Ganador directo","El oyente gana en el momento, sin sorteo"],["sorteo","🎲 Sorteo","Se sortea entre varios participantes inscriptos"]].map(([val,label,desc])=>(
                <div key={val} onClick={()=>setConForm(p=>({...p,tipo:val}))}
                  style={{border:`2px solid ${conForm.tipo===val?C.accent:C.border}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",background:conForm.tipo===val?C.accent+"11":C.card,transition:"all .15s"}}>
                  <div style={{fontWeight:700,fontSize:14,color:conForm.tipo===val?C.accent:C.text,marginBottom:4}}>{label}</div>
                  <div style={{fontSize:12,color:C.muted}}>{desc}</div>
                </div>
              ))}
            </div>
            <button className="btn" onClick={addConcurso} disabled={saving} style={{width:"100%",padding:13}}>{saving?"Guardando...":"Crear concurso"}</button>
          </div>
        )}

        {/* ── BÚSQUEDA WHATSAPP ── */}
        {view===V.BUSCAR&&(
          <div className="fade-in">
            <Title t="Búsqueda por WhatsApp" sub="Ingresá el número para ver el historial al instante"/>
            <div style={{display:"flex",gap:10,marginBottom:24}}>
              <input className="inp" type="tel" placeholder="📱  Número de WhatsApp..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{fontSize:16}}/>
              {busqueda&&<button className="btn-ghost" onClick={()=>setBusqueda("")} style={{flexShrink:0}}>✕</button>}
            </div>
            {busqueda.length>=4&&(()=>{
              const found=oyentes.find(o=>o.telefono.replace(/\D/g,"").includes(busqueda.replace(/\D/g,"")));
              if(!found)return(<div className="card" style={{padding:28,textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>🔍</div><p style={{color:C.muted,fontSize:14}}>No encontrado. <button className="btn" onClick={()=>nav(V.OY_NEW)} style={{padding:"8px 16px",marginLeft:8,fontSize:13}}>+ Registrar nuevo</button></p></div>);
              return(
                <div className="card fade-in" style={{padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:16}}>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{found.nombre}</div>
                      <div style={{color:C.muted,fontSize:13,margin:"4px 0"}}>📱 {found.telefono} · DNI {found.dni}{found.edad?" · "+found.edad+" años":""}</div>
                      {found.localidad&&<div style={{color:C.muted,fontSize:13}}>📍 {found.localidad}</div>}
                      {found.email&&<div style={{color:C.muted,fontSize:13}}>✉️ {found.email}</div>}
                    </div>
                    <button className="btn" onClick={()=>nav(V.OY_DET,found.id)} style={{padding:"9px 18px",fontSize:13}}>Ver perfil →</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
                    {[["Participaciones",found.veces||0,C.accent],["Premios ganados",found.totalWins||0,C.green],["Último premio",found.ultimoWin||"Nunca",C.warn]].map(([l,v,col])=>(
                      <div key={l} style={{background:C.bg,borderRadius:8,padding:"12px",textAlign:"center"}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:col}}>{v}</div>
                        <div style={{color:C.muted,fontSize:11,marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {isRecent(found)&&<div style={{background:C.warn+"11",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"12px 16px",display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:18}}>⚠️</span><span style={{color:C.warn,fontWeight:700,fontSize:14}}>Ganó hace {daysSince(found.ultimoWin)} días — considerar antes de sortear.</span></div>}
                </div>
              );
            })()}
            {busqueda.length<4&&<div className="card" style={{padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📱</div><p style={{color:C.muted,fontSize:14,fontWeight:600}}>Escribí al menos 4 dígitos del número</p></div>}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── CONFIG ── */
const GAS_URL = "https://script.google.com/macros/s/AKfycbx4CafPbrXpyQO60Ub2hCvWyG6ZVT0U8JDIvzRMLeXPgCg_W9wxCGW53EVlpXwdZIJ9/exec";
const ACCESS_PASSWORD = "mph951";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn ? <MainApp onLogout={()=>setLoggedIn(false)}/> : <LoginScreen onLogin={()=>setLoggedIn(true)}/>;
}
