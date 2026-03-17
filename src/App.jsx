import { useState, useMemo, useCallback, useEffect } from "react";

/* ─── THEMES ── */
const LIGHT={bg:"#F0F2F7",card:"#FFFFFF",border:"#E2E8F0",text:"#1A202C",muted:"#64748B",accent:"#0EA5E9",warn:"#F59E0B",green:"#10B981",red:"#EF4444",rowHover:"#F8FAFC",headerBg:"#FFFFFF",inputBg:"#F8FAFC",shadow:"0 1px 3px rgba(0,0,0,.08)"};
const DARK={bg:"#07090D",card:"#0D1017",border:"#1C2535",text:"#E8EDF5",muted:"#4A5770",accent:"#00E5FF",warn:"#FFB340",green:"#32D74B",red:"#FF3B30",rowHover:"#ffffff07",headerBg:"#0D1017",inputBg:"#07090D",shadow:"none"};

const V={DASH:"dash",OYENTES:"oy",OY_DET:"oy_det",OY_NEW:"oy_new",OY_QUICK:"oy_quick",OY_EDIT:"oy_edit",CONS:"con",CON_DET:"con_det",CON_NEW:"con_new",CON_EDIT:"con_edit",SORTEO:"sorteo",BUSCAR:"buscar",STATS:"stats",USUARIOS:"usuarios",ACTIVIDAD:"actividad"};

const daysSince=d=>d?Math.floor((Date.now()-new Date(d).getTime())/86400000):null;
const isRecent=o=>{const d=daysSince(o?.ultimoWin);return d!==null&&d<=30;};
const uid=()=>Math.random().toString(36).slice(2,10);
const today=()=>new Date().toISOString().split("T")[0];
const daysUntil=d=>{if(!d)return null;return Math.ceil((new Date(d)-Date.now())/86400000);};
const fmtDate=d=>{if(!d)return"";try{const[y,m,dd]=d.split("-");return`${dd}/${m}/${y}`;}catch{return d;}};

const api=async(action,data=null)=>{
  const u=new URL(GAS_URL);
  u.searchParams.set("action",action);
  if(data)u.searchParams.set("data",JSON.stringify(data));
  const res=await fetch(u.toString(),{redirect:"follow"});
  if(!res.ok)throw new Error("Error de conexión");
  const json=await res.json();
  if(json.error)throw new Error(json.error);
  return json;
};

const makeCSS=C=>`
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Nunito:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}body{background:${C.bg};color:${C.text}}
  input,textarea,select{outline:none;font-family:'Nunito',sans-serif;color:${C.text}}button{cursor:pointer;font-family:'Nunito',sans-serif}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
  .inp{background:${C.inputBg};border:1px solid ${C.border};color:${C.text};border-radius:8px;padding:10px 14px;font-size:14px;width:100%;transition:border-color .2s}.inp:focus{border-color:${C.accent}}
  textarea.inp{resize:vertical;min-height:70px}
  .sel{background:${C.inputBg};border:1px solid ${C.border};color:${C.text};border-radius:8px;padding:10px 14px;font-size:14px;width:100%;appearance:none;cursor:pointer}.sel:focus{border-color:${C.accent}}
  .btn{background:${C.accent};color:#fff;border:none;border-radius:8px;padding:11px 22px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:opacity .15s}.btn:hover{opacity:.85}.btn:disabled{opacity:.4;cursor:not-allowed}
  .btn-ghost{background:transparent;color:${C.muted};border:1px solid ${C.border};border-radius:8px;padding:9px 18px;font-size:13px;transition:all .2s}.btn-ghost:hover{border-color:${C.accent};color:${C.accent}}
  .btn-green{background:${C.green};color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;transition:opacity .15s}.btn-green:hover{opacity:.85}
  .btn-red{background:${C.red};color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;transition:opacity .15s}.btn-red:hover{opacity:.85}
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

/* ─── LOGIN ── */
function LoginScreen({onLogin}){
  const C=LIGHT;
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [shake,setShake]=useState(false);
  const [loading,setLoading]=useState(false);

  const attempt=async()=>{
    if(!pass)return;
    setLoading(true);setErr("");
    try{
      if(pass===ADMIN_PASSWORD){
        onLogin({id:"admin",nombre:"Administrador",apellido:"",puesto:"Administrador",role:"admin"});
        return;
      }
      const res=await api("login",{password:pass});
      if(res.ok&&res.user){
        onLogin({...res.user,role:"producer"});
      }else{
        setErr("Contraseña incorrecta");setShake(true);setTimeout(()=>setShake(false),500);
      }
    }catch(e){
      setErr("Error de conexión. Verificá tu internet.");
    }finally{setLoading(false);}
  };

  return(
    <div style={{minHeight:"100vh",background:"#F0F2F7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <style>{makeCSS(C)}</style>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:14,height:14,borderRadius:"50%",background:C.accent,boxShadow:`0 0 16px ${C.accent}88`,margin:"0 auto 16px"}} className="blink"/>
        <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:800,color:C.text,letterSpacing:3,textTransform:"uppercase"}}>METRO POWER HITS</h1>
        <p style={{color:C.muted,fontSize:13,marginTop:4}}>Gestión de Oyentes y Concursos</p>
      </div>
      <div className={`card${shake?" shake":""} fade-in`} style={{padding:32,width:"100%",maxWidth:360}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:1,marginBottom:20,textAlign:"center"}}>Acceso al sistema</h3>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Tu contraseña</label>
        <input className="inp" type="password" placeholder="••••••••" value={pass}
          onChange={e=>{setPass(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&attempt()}
          autoFocus style={{marginBottom:12}}/>
        {err&&<div style={{color:C.red,fontSize:12,marginBottom:12,textAlign:"center"}}>{err}</div>}
        <button className="btn" onClick={attempt} disabled={loading} style={{width:"100%",padding:13}}>
          {loading
            ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Verificando...</span>
            :"Ingresar →"}
        </button>
        <p style={{color:C.muted,fontSize:11,textAlign:"center",marginTop:12}}>Si no tenés contraseña, pedísela al administrador</p>
      </div>
    </div>
  );
}

function ConfirmModal({C,title,msg,confirmLabel,confirmClass="btn-red",onConfirm,onCancel}){
  return(
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

/* ─── MAIN APP ── */
function MainApp({onLogout,currentUser}){
  const isAdmin=currentUser.role==="admin";
  const opId=currentUser.id;
  const opNombre=isAdmin?"Administrador":[currentUser.nombre,currentUser.apellido].filter(Boolean).join(" ");

  const [dark,setDark]=useState(false);
  const C=dark?DARK:LIGHT;
  const css=useMemo(()=>makeCSS(C),[dark]);

  const [oyentes,setOyentes]=useState([]);
  const [concursos,setConcursos]=useState([]);
  const [participaciones,setPartic]=useState([]);
  const [usuarios,setUsuarios]=useState([]);
  const [actividad,setActividad]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);
  const [view,setView]=useState(V.DASH);
  const [selId,setSelId]=useState(null);
  const [busqueda,setBusqueda]=useState("");
  const [conBusq,setConBusq]=useState("");
  const [formErr,setFormErr]=useState("");
  const [confirm,setConfirm]=useState(null);
  const [sorteoState,setSorteo]=useState({animando:false,ganadores:[],nombres:[]});
  const [cantSortear,setCantSortear]=useState(1);
  const [showArchived,setShowArchived]=useState(false);
  const [extendiendo,setExtendiendo]=useState(false);
  const [nuevaFecha,setNuevaFecha]=useState("");
  const [pickingWinner,setPickingWinner]=useState(null);
  const [cantGanada,setCantGanada]=useState(1);
  const [waMsg,setWaMsg]=useState(null);
  const [filtroGenero,setFiltroGenero]=useState("");
  const [filtroLocalidad,setFiltroLocalidad]=useState("");
  const [filtroEdad,setFiltroEdad]=useState("");
  const [filtroReciente,setFiltroReciente]=useState(false);
  const [mostrarFiltros,setMostrarFiltros]=useState(false);
  const [newPwForm,setNewPwForm]=useState({id:"",pw:""});

  const emptyOy={nombre:"",telefono:"",dni:"",email:"",edad:"",localidad:"",genero:"",nota:""};
  const emptyQuick={nombre:"",telefono:""};
  const emptyCon={nombre:"",premio:"",descripcion:"",fechaDesde:"",fechaHasta:"",tipo:"ganador_directo",stockTotal:""};
  const emptyUser={nombre:"",apellido:"",puesto:"",password:""};
  const [oyConIds,setOyConIds]=useState([]);
  const [oyForm,setOyForm]=useState(emptyOy);
  const [quickForm,setQuickForm]=useState(emptyQuick);
  const [editForm,setEditForm]=useState(emptyOy);
  const [editConId,setEditConId]=useState("");
  const [conForm,setConForm]=useState(emptyCon);
  const [editConForm,setEditConForm]=useState(emptyCon);
  const [userForm,setUserForm]=useState(emptyUser);

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  const loadAll=useCallback(async()=>{
    setLoading(true);
    try{
      const d=await api("getAll");
      setOyentes(d.oyentes||[]);
      setConcursos((d.concursos||[]).map(c=>{
        let f={...c};
        if(!f.estado||!["activo","finalizado","archivado"].includes(f.estado))f.estado="activo";
        if(["activo","finalizado","archivado"].includes(f.ganadorNombre))f.ganadorNombre="";
        if(!f.tipo)f.tipo="ganador_directo";
        return f;
      }));
      setPartic(d.participaciones||[]);
    }catch(e){showToast("Error al cargar: "+e.message,"err");}
    finally{setLoading(false);}
  },[]);

  const loadUsuarios=useCallback(async()=>{
    if(!isAdmin)return;
    try{const r=await api("getUsuarios");setUsuarios((r.usuarios||[]).filter(u=>u.activo==="si"));}
    catch(e){console.error(e);}
  },[isAdmin]);

  const loadActividad=useCallback(async()=>{
    if(!isAdmin)return;
    try{const r=await api("getActividad");setActividad(r.actividad||[]);}
    catch(e){showToast("Error cargando actividad","err");}
  },[isAdmin]);

  useEffect(()=>{loadAll();},[loadAll]);
  useEffect(()=>{loadUsuarios();},[loadUsuarios]);

  const applyNav=(v,id=null)=>{
    setView(v);setSelId(id);setFormErr("");setBusqueda("");setConBusq("");
    setSorteo({animando:false,ganadores:[],nombres:[]});setConfirm(null);
    setExtendiendo(false);setNuevaFecha("");setOyConIds([]);setEditConId("");
    setPickingWinner(null);setCantGanada(1);setWaMsg(null);setCantSortear(1);
    setNewPwForm({id:"",pw:""});
  };
  const nav=(v,id=null)=>{window.history.pushState({view:v,id},"");applyNav(v,id);};

  useEffect(()=>{
    window.history.replaceState({view:V.DASH,id:null},"");
    const onPop=e=>{const s=e.state;if(s&&s.view)applyNav(s.view,s.id||null);else applyNav(V.DASH,null);};
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);

  const selOy=useMemo(()=>oyentes.find(o=>o.id===selId),[oyentes,selId]);
  const selCon=useMemo(()=>concursos.find(c=>c.id===selId),[concursos,selId]);
  const conPartic=useCallback((conId)=>participaciones.filter(p=>p.concursoId===conId).map(p=>oyentes.find(o=>o.id===p.oyenteId)).filter(Boolean),[participaciones,oyentes]);
  const inCon=(oyId,conId)=>participaciones.some(p=>p.oyenteId===oyId&&p.concursoId===conId);
  const consActivos=useMemo(()=>concursos.filter(c=>c.estado==="activo"),[concursos]);
  const consVisibles=useMemo(()=>showArchived?concursos:concursos.filter(c=>c.estado!=="archivado"),[concursos,showArchived]);

  const stats=useMemo(()=>{
    const total=oyentes.length,ganadores=oyentes.filter(o=>parseInt(o.totalWins)>0).length;
    const recentW=oyentes.filter(o=>isRecent(o)).length;
    const edades=oyentes.filter(o=>o.edad).map(o=>parseInt(o.edad));
    const promEdad=edades.length?Math.round(edades.reduce((a,b)=>a+b,0)/edades.length):0;
    const rangos={"18-25":0,"26-35":0,"36-45":0,"46+":0};
    oyentes.forEach(o=>{const e=parseInt(o.edad);if(!e)return;if(e<=25)rangos["18-25"]++;else if(e<=35)rangos["26-35"]++;else if(e<=45)rangos["36-45"]++;else rangos["46+"]++;});
    const generos={Mujer:0,Hombre:0,Otro:0};
    oyentes.forEach(o=>{const g=o.genero;if(g==="Mujer")generos.Mujer++;else if(g==="Hombre")generos.Hombre++;else if(g)generos.Otro++;});
    return{total,ganadores,recentW,promEdad,rangos,generos,consActivos:consActivos.length};
  },[oyentes,consActivos]);

  const conStats=useCallback((conId)=>{
    const parts=conPartic(conId);
    const gen={Mujer:0,Hombre:0,Otro:0,"-":0};
    const rangos={"18-25":0,"26-35":0,"36-45":0,"46+":0,"Sin dato":0};
    const localidades={};
    parts.forEach(o=>{
      if(o.genero==="Mujer")gen.Mujer++;else if(o.genero==="Hombre")gen.Hombre++;else if(o.genero)gen.Otro++;else gen["-"]++;
      const e=parseInt(o.edad);if(!e)rangos["Sin dato"]++;else if(e<=25)rangos["18-25"]++;else if(e<=35)rangos["26-35"]++;else if(e<=45)rangos["36-45"]++;else rangos["46+"]++;
      const loc=o.localidad||"Sin dato";localidades[loc]=(localidades[loc]||0)+1;
    });
    return{gen,rangos,topLocs:Object.entries(localidades).sort((a,b)=>b[1]-a[1]).slice(0,5),total:parts.length};
  },[conPartic]);

  /* ── CRUD oyentes ── */
  const addOyente=async()=>{
    if(!oyForm.nombre||!oyForm.telefono||!oyForm.dni){setFormErr("Nombre, teléfono y DNI son obligatorios.");return;}
    if(oyentes.find(o=>o.telefono===oyForm.telefono)){setFormErr("Ya existe un oyente con ese teléfono.");return;}
    setSaving(true);
    try{
      const newO={id:uid(),...oyForm,edad:parseInt(oyForm.edad)||"",fechaRegistro:today(),veces:0,totalWins:0,ultimoWin:"",creadoPor:opNombre,modificadoPor:"",creadoPorId:opId,creadoPorNombre:opNombre,operadorId:opId,operadorNombre:opNombre};
      await api("addOyente",newO);
      let inscriptos=0,ganados=0;
      for(const conId of oyConIds){
        const con=concursos.find(c=>c.id===conId);if(!con)continue;
        const p={concursoId:conId,oyenteId:newO.id,fecha:today(),concursoNombre:con.nombre||"",concursoPremio:con.premio||"",esGanador:con.tipo==="ganador_directo"?"si":"no",cantGanada:"1",operadorId:opId,operadorNombre:opNombre};
        await api("addParticipante",p);setPartic(prev=>[...prev,p]);inscriptos++;
        if(con.tipo==="ganador_directo"){
          const nw=ganados+1;const su=(parseInt(con.stockUsado)||0)+1;
          await api("setGanadorDirecto",{concursoId:conId,oyenteId:newO.id,oyenteNombre:newO.nombre,newTotalWins:nw,ultimoWin:today(),qty:1,stockUsado:su,operadorId:opId,operadorNombre:opNombre});
          setConcursos(prev=>prev.map(c=>c.id===conId?{...c,stockUsado:su}:c));ganados++;
        }
      }
      const finalOy={...newO,veces:inscriptos,totalWins:ganados,ultimoWin:ganados>0?today():""};
      setOyentes(p=>[...p,finalOy]);setOyForm(emptyOy);setOyConIds([]);
      showToast(inscriptos>0?`Registrado en ${inscriptos} concurso(s) ✓`:"Oyente registrado ✓");
      nav(V.OYENTES);
    }catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const addQuick=async()=>{
    if(!quickForm.nombre||!quickForm.telefono){setFormErr("Nombre y teléfono son obligatorios.");return;}
    if(oyentes.find(o=>o.telefono===quickForm.telefono)){setFormErr("Ya existe un oyente con ese teléfono.");return;}
    setSaving(true);
    try{
      const newO={id:uid(),...quickForm,dni:"",email:"",edad:"",localidad:"",genero:"",nota:"",fechaRegistro:today(),veces:0,totalWins:0,ultimoWin:"",creadoPor:opNombre,modificadoPor:"",creadoPorId:opId,creadoPorNombre:opNombre,operadorId:opId,operadorNombre:opNombre};
      await api("addOyente",newO);
      setOyentes(p=>[...p,newO]);setQuickForm(emptyQuick);
      showToast("Registrado rápidamente ✓");nav(V.OY_DET,newO.id);
    }catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const updateOyente=async()=>{
    if(!editForm.nombre||!editForm.telefono||!editForm.dni){setFormErr("Nombre, teléfono y DNI son obligatorios.");return;}
    const dup=oyentes.find(o=>o.telefono===editForm.telefono&&o.id!==selId);
    if(dup){setFormErr("Ya existe otro oyente con ese teléfono.");return;}
    setSaving(true);
    try{
      const updated={...selOy,...editForm,edad:parseInt(editForm.edad)||"",modificadoPor:opNombre,operadorId:opId,operadorNombre:opNombre};
      await api("updateOyente",updated);
      setOyentes(p=>p.map(o=>o.id===selId?updated:o));
      if(editConId){
        const con=concursos.find(c=>c.id===editConId);
        if(con&&!inCon(selId,editConId)){
          const p={concursoId:editConId,oyenteId:selId,fecha:today(),concursoNombre:con.nombre||"",concursoPremio:con.premio||"",esGanador:con.tipo==="ganador_directo"?"si":"no",cantGanada:"1",operadorId:opId,operadorNombre:opNombre};
          await api("addParticipante",p);setPartic(prev=>[...prev,p]);
          if(con.tipo==="ganador_directo"){
            const nw=(parseInt(updated.totalWins)||0)+1;const su=(parseInt(con.stockUsado)||0)+1;
            await api("setGanadorDirecto",{concursoId:editConId,oyenteId:selId,oyenteNombre:updated.nombre,newTotalWins:nw,ultimoWin:today(),qty:1,stockUsado:su,operadorId:opId,operadorNombre:opNombre});
            setConcursos(prev=>prev.map(c=>c.id===editConId?{...c,stockUsado:su}:c));
            setOyentes(p=>p.map(o=>o.id===selId?{...updated,totalWins:nw,ultimoWin:today(),veces:(parseInt(updated.veces)||0)+1}:o));
            showToast("Guardado · 🏆 Ganador en "+con.nombre);
          }else{
            setOyentes(p=>p.map(o=>o.id===selId?{...updated,veces:(parseInt(updated.veces)||0)+1}:o));
            showToast("Guardado · Inscripto en "+con.nombre);
          }
        }else showToast("Datos actualizados ✓");
      }else showToast("Datos actualizados ✓");
      setEditConId("");nav(V.OY_DET,selId);
    }catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  /* ── CRUD concursos ── */
  const addConcurso=async()=>{
    if(!conForm.nombre||!conForm.premio){setFormErr("Nombre y premio son obligatorios.");return;}
    setSaving(true);
    try{
      const newC={id:uid(),...conForm,stockTotal:parseInt(conForm.stockTotal)||"",stockUsado:0,estado:"activo",ganadorId:"",ganadorNombre:"",operadorId:opId,operadorNombre:opNombre};
      await api("addConcurso",newC);
      setConcursos(p=>[...p,newC]);setConForm(emptyCon);
      showToast("Concurso creado ✓");nav(V.CONS);
    }catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const updateConcurso=async()=>{
    if(!editConForm.nombre||!editConForm.premio){setFormErr("Nombre y premio son obligatorios.");return;}
    setSaving(true);
    try{
      const updated={...selCon,...editConForm,operadorId:opId,operadorNombre:opNombre};
      await api("updateConcurso",updated);
      setConcursos(p=>p.map(c=>c.id===selId?updated:c));
      showToast("Concurso actualizado ✓");nav(V.CON_DET,selId);
    }catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const inscribir=async(oyId,conId)=>{
    if(inCon(oyId,conId))return;
    const con=concursos.find(c=>c.id===conId);
    const esGD=con?.tipo==="ganador_directo";
    try{
      const p={concursoId:conId,oyenteId:oyId,fecha:today(),concursoNombre:con?.nombre||"",concursoPremio:con?.premio||"",esGanador:esGD?"si":"no",cantGanada:"1",operadorId:opId,operadorNombre:opNombre};
      await api("addParticipante",p);setPartic(prev=>[...prev,p]);
      if(esGD){
        const oy=oyentes.find(o=>o.id===oyId);
        const nw=(parseInt(oy?.totalWins)||0)+1;const su=(parseInt(con?.stockUsado)||0)+1;
        await api("setGanadorDirecto",{concursoId:conId,oyenteId:oyId,oyenteNombre:oy?.nombre||"",newTotalWins:nw,ultimoWin:today(),qty:1,stockUsado:su,operadorId:opId,operadorNombre:opNombre});
        setConcursos(prev=>prev.map(c=>c.id===conId?{...c,stockUsado:su}:c));
        setOyentes(prev=>prev.map(o=>o.id===oyId?{...o,veces:(parseInt(o.veces)||0)+1,totalWins:nw,ultimoWin:today()}:o));
        showToast("🏆 Ganador en "+con.nombre);
      }else{
        setOyentes(prev=>prev.map(o=>o.id===oyId?{...o,veces:(parseInt(o.veces)||0)+1}:o));
        showToast("Inscripto en "+con?.nombre+" ✓");
      }
    }catch(e){showToast("Error: "+e.message,"err");}
  };

  const marcarGanadorDirecto=async(oyente,qty=1)=>{
    if(!selCon)return;
    const nw=(parseInt(oyente.totalWins)||0)+1;
    const su=(parseInt(selCon.stockUsado)||0)+qty;
    const st=parseInt(selCon.stockTotal)||0;
    try{
      await api("setGanadorDirecto",{concursoId:selCon.id,oyenteId:oyente.id,oyenteNombre:oyente.nombre,newTotalWins:nw,ultimoWin:today(),qty,stockUsado:su,operadorId:opId,operadorNombre:opNombre});
      setPartic(prev=>prev.map(p=>p.concursoId===selCon.id&&p.oyenteId===oyente.id?{...p,esGanador:"si",cantGanada:String(qty)}:p));
      setConcursos(p=>p.map(c=>c.id===selCon.id?{...c,stockUsado:su,ganadorId:oyente.id,ganadorNombre:oyente.nombre}:c));
      setOyentes(p=>p.map(o=>o.id===oyente.id?{...o,totalWins:nw,ultimoWin:today()}:o));
      setPickingWinner(null);setCantGanada(1);
      const msg=`¡Hola ${oyente.nombre}! 🎉 ¡Felicitaciones! Ganás ${qty>1?qty+" entradas":"una entrada"} para ${selCon.nombre} (${selCon.premio}). Comuniáte con nosotros para coordinar la entrega. — Metro Power Hits 📻`;
      setWaMsg(msg);
      const sinStock=st>0&&su>=st;
      if(sinStock)showToast(`🏆 ${oyente.nombre} · ⚠️ ¡Sin stock!`,"win");
      else showToast(`🏆 ${oyente.nombre} ganó ${qty} entrada${qty>1?"s":""}`, "win");
    }catch(e){showToast("Error: "+e.message,"err");}
  };

  const archivarConcurso=async(conId)=>{
    try{await api("archivarConcurso",{concursoId:conId,operadorId:opId,operadorNombre:opNombre});setConcursos(p=>p.map(c=>c.id===conId?{...c,estado:"archivado"}:c));showToast("Concurso archivado");nav(V.CONS);}
    catch(e){showToast("Error: "+e.message,"err");}setConfirm(null);
  };
  const reactivarConcurso=async(conId)=>{
    try{await api("reactivarConcurso",{concursoId:conId,operadorId:opId,operadorNombre:opNombre});setConcursos(p=>p.map(c=>c.id===conId?{...c,estado:"activo"}:c));showToast("Concurso reactivado ✓");}
    catch(e){showToast("Error: "+e.message,"err");}
  };
  const extenderConcurso=async(conId,nf)=>{
    if(!nf){showToast("Seleccioná una fecha","err");return;}
    try{await api("extenderConcurso",{concursoId:conId,fechaHasta:nf,operadorId:opId,operadorNombre:opNombre});setConcursos(p=>p.map(c=>c.id===conId?{...c,fechaHasta:nf}:c));setExtendiendo(false);setNuevaFecha("");showToast("Extendido hasta "+fmtDate(nf)+" ✓");}
    catch(e){showToast("Error: "+e.message,"err");}
  };
  const eliminarConcurso=async(conId)=>{
    if(!isAdmin){showToast("Solo el administrador puede eliminar concursos","err");setConfirm(null);return;}
    try{await api("eliminarConcurso",{concursoId:conId,operadorId:opId,operadorNombre:opNombre});setConcursos(p=>p.filter(c=>c.id!==conId));showToast("Concurso eliminado");nav(V.CONS);}
    catch(e){showToast("Error: "+e.message,"err");}setConfirm(null);
  };

  const realizarSorteo=async()=>{
    const partic=conPartic(selCon.id);if(!partic.length)return;
    const n=Math.min(cantSortear,partic.length);
    setSorteo({animando:true,ganadores:[],nombres:partic.map(p=>p.nombre)});
    let tick=0;
    const iv=setInterval(()=>{
      tick++;setSorteo(s=>({...s,nombres:[...partic].sort(()=>Math.random()-.5).map(p=>p.nombre)}));
      if(tick>25){
        clearInterval(iv);
        const winners=[...partic].sort(()=>Math.random()-.5).slice(0,n);
        setSorteo({animando:false,ganadores:winners,nombres:[]});
        winners.forEach((winner,i)=>{
          const nw=parseInt(winner.totalWins||0)+1;
          api("setGanador",{concursoId:selCon.id,oyenteId:winner.id,oyenteNombre:winner.nombre,newTotalWins:nw,ultimoWin:today(),operadorId:opId,operadorNombre:opNombre});
          setOyentes(p=>p.map(o=>o.id===winner.id?{...o,totalWins:nw,ultimoWin:today()}:o));
          if(i===0)setConcursos(p=>p.map(c=>c.id===selCon.id?{...c,estado:"finalizado",ganadorId:winner.id,ganadorNombre:winner.nombre}:c));
        });
        showToast(`🏆 ${n} ganador${n>1?"es":""} sorteado${n>1?"s":""}!`,"win");
      }
    },70);
  };

  /* ── Usuarios ── */
  const addUsuario=async()=>{
    if(!userForm.nombre||!userForm.apellido||!userForm.password){setFormErr("Nombre, apellido y contraseña son obligatorios.");return;}
    if(userForm.password===ADMIN_PASSWORD){setFormErr("Esa contraseña está reservada para el administrador.");return;}
    setSaving(true);
    try{
      const newU={id:uid(),...userForm,fechaCreacion:today(),activo:"si",creadoPorId:opId,creadoPorNombre:opNombre};
      const res=await api("addUsuario",newU);
      if(res&&!res.ok&&res.error){setFormErr(res.error);return;}
      setUsuarios(p=>[...p,newU]);setUserForm(emptyUser);
      showToast(`Usuario ${newU.nombre} ${newU.apellido} creado ✓`);
    }catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const bajaUsuario=async(usuarioId)=>{
    try{
      await api("deleteUsuario",{usuarioId,operadorId:opId,operadorNombre:opNombre});
      setUsuarios(p=>p.filter(u=>u.id!==usuarioId));
      showToast("Usuario dado de baja ✓");
    }catch(e){showToast("Error: "+e.message,"err");}
    setConfirm(null);
  };

  const cambiarPassword=async(usuarioId,newPw)=>{
    if(!newPw||newPw.length<4){setFormErr("Mínimo 4 caracteres.");return;}
    if(newPw===ADMIN_PASSWORD){setFormErr("Esa contraseña está reservada.");return;}
    setSaving(true);
    try{
      await api("updateUsuarioPassword",{usuarioId,newPassword:newPw,operadorId:opId,operadorNombre:opNombre});
      setNewPwForm({id:"",pw:""});setFormErr("");
      showToast("Contraseña actualizada ✓");
    }catch(e){setFormErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  /* ── Excel exports ── */
  const exportExcelOyentes=async()=>{
    showToast("Generando Excel...");
    try{
      const ExcelJS=(await import("exceljs")).default;
      const wb=new ExcelJS.Workbook();wb.creator="Metro Power Hits";wb.created=new Date();
      const ws=wb.addWorksheet("Oyentes",{views:[{state:"frozen",ySplit:2}]});
      ws.mergeCells("A1:M1");
      const tc=ws.getCell("A1");tc.value="METRO POWER HITS — Base de Oyentes";tc.font={name:"Arial",bold:true,size:14,color:{argb:"FFFFFFFF"}};tc.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0EA5E9"}};tc.alignment={horizontal:"center",vertical:"middle"};ws.getRow(1).height=30;
      const COLS=[{h:"Nombre",k:"nombre",w:28},{h:"Teléfono",k:"telefono",w:18},{h:"DNI",k:"dni",w:13},{h:"Email",k:"email",w:26},{h:"Edad",k:"edad",w:8},{h:"Localidad",k:"localidad",w:20},{h:"Género",k:"genero",w:10},{h:"Particip.",k:"veces",w:12},{h:"Premios",k:"totalWins",w:12},{h:"Últ.Premio",k:"ultimoWin",w:14},{h:"Nota",k:"nota",w:24},{h:"Registrado por",k:"creadoPor",w:22},{h:"Modificado por",k:"modificadoPor",w:22}];
      ws.columns=COLS.map(c=>({key:c.k,width:c.w}));
      const hr=ws.getRow(2);COLS.forEach((c,i)=>{const cell=hr.getCell(i+1);cell.value=c.h;cell.font={name:"Arial",bold:true,size:10,color:{argb:"FFFFFFFF"}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1E3A5F"}};cell.alignment={horizontal:"center",vertical:"middle"};});hr.height=22;
      const gc=g=>g==="Mujer"?"FFFCE4EC":g==="Hombre"?"FFE3F2FD":"FFF3E5F5";
      oyentes.forEach((o,i)=>{
        const row=ws.addRow({nombre:o.nombre||"",telefono:o.telefono||"",dni:o.dni||"",email:o.email||"",edad:parseInt(o.edad)||"",localidad:o.localidad||"",genero:o.genero||"",veces:parseInt(o.veces)||0,totalWins:parseInt(o.totalWins)||0,ultimoWin:o.ultimoWin||"",nota:o.nota||"",creadoPor:o.creadoPor||"",modificadoPor:o.modificadoPor||""});
        const bg=i%2===0?"FFFFFFFF":"FFF0F7FF";
        row.eachCell(cell=>{cell.font={name:"Arial",size:10};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:bg}};cell.alignment={vertical:"middle"};cell.border={bottom:{style:"hair",color:{argb:"FFDDE6F0"}}};});
        if(o.genero)row.getCell(7).fill={type:"pattern",pattern:"solid",fgColor:{argb:gc(o.genero)}};
        if(parseInt(o.totalWins)>0)row.getCell(9).font={name:"Arial",size:10,bold:true,color:{argb:"FF10B981"}};
        if(isRecent(o))row.getCell(10).font={name:"Arial",size:10,bold:true,color:{argb:"FFD97706"}};
        row.height=18;
      });
      const ws2=wb.addWorksheet("Estadísticas");
      ws2.getColumn(1).width=22;ws2.getColumn(2).width=14;
      const addStat=(title,data,sr)=>{ws2.mergeCells(`A${sr}:B${sr}`);const h=ws2.getCell(`A${sr}`);h.value=title;h.font={name:"Arial",bold:true,size:11,color:{argb:"FFFFFFFF"}};h.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0EA5E9"}};ws2.getRow(sr).height=22;data.forEach(([l,v],i)=>{const r=ws2.getRow(sr+1+i);r.getCell(1).value=l;r.getCell(1).font={name:"Arial",size:10};r.getCell(2).value=v;r.getCell(2).font={name:"Arial",size:10,bold:true,color:{argb:"FF0EA5E9"}};r.getCell(2).alignment={horizontal:"right"};});return sr+data.length+2;};
      const ed={"18-25":0,"26-35":0,"36-45":0,"46+":0};oyentes.forEach(o=>{const e=parseInt(o.edad);if(!e)return;if(e<=25)ed["18-25"]++;else if(e<=35)ed["26-35"]++;else if(e<=45)ed["36-45"]++;else ed["46+"]++;});
      const gen={Mujer:0,Hombre:0,Otro:0};oyentes.forEach(o=>{if(o.genero==="Mujer")gen.Mujer++;else if(o.genero==="Hombre")gen.Hombre++;else if(o.genero)gen.Otro++;});
      let r=1;r=addStat("📊 Resumen",[["Total",oyentes.length],["Con premios",oyentes.filter(o=>parseInt(o.totalWins)>0).length],["Ganaron en 30d",oyentes.filter(o=>isRecent(o)).length]],r);r=addStat("🎂 Edades",Object.entries(ed).map(([k,v])=>[k+" años",v]),r);r=addStat("👤 Género",Object.entries(gen),r);
      const buf=await wb.xlsx.writeBuffer();const blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="MetroPowerHits_Oyentes.xlsx";a.click();URL.revokeObjectURL(url);
      showToast("Excel generado ✓");
    }catch(e){showToast("Error: "+e.message,"err");}
  };

  const exportExcelConcurso=async(conId)=>{
    const con=concursos.find(c=>c.id===conId);if(!con)return;
    showToast("Generando reporte...");
    try{
      const ExcelJS=(await import("exceljs")).default;
      const wb=new ExcelJS.Workbook();wb.creator="Metro Power Hits";
      const ws=wb.addWorksheet("Participantes");
      ws.mergeCells("A1:H1");const tc=ws.getCell("A1");tc.value=`${con.nombre} — ${con.premio}`;tc.font={name:"Arial",bold:true,size:13,color:{argb:"FFFFFFFF"}};tc.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF10B981"}};tc.alignment={horizontal:"center",vertical:"middle"};ws.getRow(1).height=28;
      const COLS=[{h:"Nombre",k:"nombre",w:28},{h:"Teléfono",k:"telefono",w:18},{h:"DNI",k:"dni",w:13},{h:"Email",k:"email",w:24},{h:"Localidad",k:"localidad",w:18},{h:"Premios",k:"_qty",w:12},{h:"Fecha",k:"_fecha",w:14},{h:"Operador",k:"_op",w:22}];
      ws.columns=COLS.map(c=>({key:c.k,width:c.w}));
      const hr=ws.getRow(2);COLS.forEach((c,i)=>{const cell=hr.getCell(i+1);cell.value=c.h;cell.font={name:"Arial",bold:true,size:10,color:{argb:"FFFFFFFF"}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1E3A5F"}};cell.alignment={horizontal:"center",vertical:"middle"};});hr.height=22;
      const all=conPartic(conId).map(o=>{const par=participaciones.find(p=>p.concursoId===conId&&p.oyenteId===o.id);return{...o,_qty:par?.cantGanada||"1",_fecha:par?.fecha||"",_op:par?.operadorNombre||""};});
      all.forEach((o,i)=>{
        const row=ws.addRow({nombre:o.nombre||"",telefono:o.telefono||"",dni:o.dni||"",email:o.email||"",localidad:o.localidad||"",_qty:parseInt(o._qty)||1,_fecha:o._fecha||"",_op:o._op||""});
        const bg=i%2===0?"FFFFFFFF":"FFECFDF5";
        row.eachCell(cell=>{cell.font={name:"Arial",size:10};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:bg}};cell.alignment={vertical:"middle"};cell.border={bottom:{style:"hair",color:{argb:"FFDDE6F0"}}};});row.height=18;
      });
      const buf=await wb.xlsx.writeBuffer();const blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${con.nombre.replace(/\s+/g,"_")}_participantes.xlsx`;a.click();URL.revokeObjectURL(url);
      showToast("Reporte generado ✓");
    }catch(e){showToast("Error: "+e.message,"err");}
  };

  /* sub-components */
  const Lbl=({children})=><label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{children}</label>;
  const FErr=()=>formErr?<div style={{color:C.red,fontSize:12,background:C.red+"11",border:`1px solid ${C.red}44`,borderRadius:6,padding:"8px 12px",marginBottom:14}}>{formErr}</div>:null;
  const Title=({t,sub})=><div style={{marginBottom:22}}><h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:2,lineHeight:1}}>{t}</h2>{sub&&<p style={{color:C.muted,fontSize:13,marginTop:4}}>{sub}</p>}</div>;
  const Back=({to,label="← Volver"})=><button className="btn-ghost" onClick={()=>nav(to)} style={{marginBottom:20}}>{label}</button>;
  const Bar=({val,max,color})=><div style={{height:6,background:C.border,borderRadius:3,marginTop:4}}><div style={{height:"100%",width:`${max?Math.round((val/max)*100):0}%`,background:color||C.accent,borderRadius:3,transition:"width .6s"}}/></div>;
  const Countdown=({fechaHasta})=>{
    if(!fechaHasta)return null;
    const d=daysUntil(fechaHasta);
    if(d===null)return null;
    if(d<0)return<span className="tag-done">Venció hace {Math.abs(d)}d</span>;
    if(d===0)return<span className="tag-warn">Vence hoy</span>;
    if(d<=3)return<span className="tag-warn">⏰ {d}d</span>;
    return<span style={{fontSize:11,color:C.muted}}>📅 {d}d</span>;
  };

  if(loading)return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{css}</style><div style={{textAlign:"center"}}><div style={{width:44,height:44,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",margin:"0 auto 16px",animation:"spin .8s linear infinite"}}/><p style={{color:C.muted,fontSize:14}}>Cargando datos...</p></div></div>);

  const localidades=[...new Set(oyentes.map(o=>o.localidad).filter(Boolean))].sort();
  const oyentesFiltrados=oyentes.filter(o=>{
    if(busqueda){const q=busqueda.toLowerCase();if(!(o.nombre.toLowerCase().includes(q)||o.telefono.includes(busqueda)||(o.dni||"").includes(busqueda)||(o.localidad||"").toLowerCase().includes(q)))return false;}
    if(filtroGenero&&o.genero!==filtroGenero)return false;
    if(filtroLocalidad&&o.localidad!==filtroLocalidad)return false;
    if(filtroEdad){const e=parseInt(o.edad);if(filtroEdad==="18-25"&&!(e>=18&&e<=25))return false;if(filtroEdad==="26-35"&&!(e>=26&&e<=35))return false;if(filtroEdad==="36-45"&&!(e>=36&&e<=45))return false;if(filtroEdad==="46+"&&!(e>=46))return false;}
    if(filtroReciente&&!isRecent(o))return false;
    return true;
  });
  const filtrosActivos=!!(filtroGenero||filtroLocalidad||filtroEdad||filtroReciente);

  const navTabs=[
    {id:V.DASH,icon:"◉",label:"Inicio"},
    {id:V.OYENTES,icon:"👥",label:"Oyentes"},
    {id:V.CONS,icon:"🎯",label:"Concursos"},
    {id:V.BUSCAR,icon:"📱",label:"WhatsApp"},
    ...(isAdmin?[{id:V.USUARIOS,icon:"🔐",label:"Usuarios"},{id:V.ACTIVIDAD,icon:"📋",label:"Actividad"}]:[])
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",color:C.text}}>
      <style>{css}</style>

      {confirm&&confirm.type==="archivar"&&<ConfirmModal C={C} title="Archivar concurso" msg="El concurso deja de verse en el inicio. Los datos de participantes se conservan." confirmLabel="Archivar" confirmClass="btn-ghost" onConfirm={()=>archivarConcurso(confirm.id)} onCancel={()=>setConfirm(null)}/>}
      {confirm&&confirm.type==="eliminar"&&<ConfirmModal C={C} title="Eliminar concurso" msg="Esto elimina el concurso permanentemente. Los oyentes conservan el historial en su perfil." confirmLabel="Eliminar definitivamente" confirmClass="btn-red" onConfirm={()=>eliminarConcurso(confirm.id)} onCancel={()=>setConfirm(null)}/>}
      {confirm&&confirm.type==="baja_usuario"&&<ConfirmModal C={C} title="Dar de baja usuario" msg={`Se va a desactivar el acceso de ${confirm.nombre}. Podrés reactivarlo cuando quieras.`} confirmLabel="Dar de baja" confirmClass="btn-red" onConfirm={()=>bajaUsuario(confirm.id)} onCancel={()=>setConfirm(null)}/>}

      {/* HEADER */}
      <div style={{background:C.headerBg,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,zIndex:200,boxShadow:C.shadow,flexWrap:"wrap"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,boxShadow:`0 0 8px ${C.accent}88`,flexShrink:0}} className="blink"/>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,letterSpacing:2,textTransform:"uppercase",flex:1}}>METRO POWER HITS</span>
        <span style={{background:isAdmin?C.accent+"22":C.warn+"22",color:isAdmin?C.accent:C.warn,border:`1px solid ${isAdmin?C.accent:C.warn}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700}}>
          {isAdmin?"ADMIN":`${currentUser.nombre} ${currentUser.apellido}`.trim()}
        </span>
        <button onClick={exportExcelOyentes} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11,fontWeight:600}}>⬇ Excel</button>
        <button onClick={()=>nav(V.OY_QUICK)} style={{background:C.green,color:"#fff",border:"none",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:700}}>⚡ Rápido</button>
        <button onClick={()=>setDark(d=>!d)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:16,padding:"4px 12px",color:C.muted,fontSize:11,fontWeight:600}}>{dark?"☀️":"🌙"}</button>
        <button onClick={()=>{loadAll();showToast("Actualizado ✓");}} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11}}>↺</button>
        {isAdmin&&<button onClick={async()=>{await api("repairConcursos");await loadAll();showToast("Reparado ✓");}} style={{background:"transparent",border:`1px solid ${C.warn}`,borderRadius:6,padding:"4px 8px",color:C.warn,fontSize:10,fontWeight:600}} title="Reparar datos viejos">🔧</button>}
        <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",color:C.muted,fontSize:11}}>Salir</button>
      </div>

      <div style={{background:C.headerBg,borderBottom:`1px solid ${C.border}`,display:"flex",padding:"0 16px",overflowX:"auto"}}>
        {navTabs.map(n=>(
          <button key={n.id} onClick={()=>nav(n.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${view===n.id?C.accent:"transparent"}`,color:view===n.id?C.accent:C.muted,padding:"12px 14px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"color .2s"}}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      {toast&&<div style={{position:"fixed",top:64,right:16,zIndex:999,background:toast.type==="win"?C.green:toast.type==="err"?C.red:C.accent,color:"#fff",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:14,boxShadow:"0 4px 24px rgba(0,0,0,.2)",maxWidth:320,wordBreak:"break-word"}}>{toast.msg}</div>}

      <div style={{padding:"20px 16px",maxWidth:960,margin:"0 auto"}}>

        {/* ── DASHBOARD ── */}
        {view===V.DASH&&(
          <div className="fade-in">
            <p style={{color:C.muted,fontSize:12,marginBottom:16}}>{new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
              {[
                {title:"OYENTES",sub:"Buscar por nombre, Cel o DNI",icon:"👥",color:C.accent,action:()=>nav(V.OYENTES)},
                {title:"CONCURSOS ACTIVOS",sub:consActivos.length+" concurso"+(consActivos.length!==1?"s":"")+" en curso",icon:"🎯",color:C.warn,action:()=>nav(V.CONS)},
                {title:"WHATSAPP",sub:"Buscar oyente por su WhatsApp",icon:"📱",color:C.green,action:()=>nav(V.BUSCAR)},
                {title:"VER ESTADÍSTICAS",sub:"Edades, géneros y actividad",icon:"📊",color:"#A855F7",action:()=>nav(V.STATS)},
              ].map(({title,sub,icon,color,action})=>(
                <div key={title} className="card row" onClick={action} style={{padding:"22px 18px",cursor:"pointer",borderLeft:`4px solid ${color}`,transition:"transform .15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                  <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,letterSpacing:1,color:C.text,lineHeight:1,marginBottom:5}}>{title}</div>
                  <div style={{fontSize:12,color:C.muted}}>{sub}</div>
                </div>
              ))}
            </div>
            {stats.recentW>0&&<div style={{background:C.warn+"11",border:`1px solid ${C.warn}44`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><span style={{color:C.warn,fontSize:13,fontWeight:600}}>{stats.recentW} oyente{stats.recentW>1?"s":""} ganaron un premio en los últimos 30 días.</span></div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[[stats.total,"👥","Oyentes",C.accent],[stats.consActivos,"🎯","Activos",C.warn],[stats.ganadores,"🏆","Ganadores",C.green],[stats.promEdad?stats.promEdad+"a":"—","📊","Edad prom.","#A855F7"]].map(([v,ic,l,col],i)=>(
                <div key={i} className="card" style={{padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:14,marginBottom:2}}>{ic}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:col,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {view===V.STATS&&(
          <div className="fade-in">
            <Back to={V.DASH}/>
            <Title t="Estadísticas" sub="Resumen de la base de oyentes"/>
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
                    <div style={{color:C.muted,fontSize:11,marginTop:1,display:"flex",gap:8,alignItems:"center"}}>{conPartic(c.id).length} participantes<Countdown fechaHasta={c.fechaHasta}/></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GESTIÓN DE USUARIOS (solo admin) ── */}
        {view===V.USUARIOS&&isAdmin&&(
          <div className="fade-in">
            <Title t="Gestión de Usuarios" sub="Solo vos podés ver esta pantalla"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
              {/* Formulario nuevo usuario */}
              <div className="card" style={{padding:20}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>Crear nuevo usuario</h3>
                <FErr/>
                <Lbl>Nombre *</Lbl>
                <input className="inp" placeholder="Juan" value={userForm.nombre} onChange={e=>{setUserForm(p=>({...p,nombre:e.target.value}));setFormErr("");}} style={{marginBottom:10}}/>
                <Lbl>Apellido *</Lbl>
                <input className="inp" placeholder="Pérez" value={userForm.apellido} onChange={e=>{setUserForm(p=>({...p,apellido:e.target.value}));setFormErr("");}} style={{marginBottom:10}}/>
                <Lbl>Puesto</Lbl>
                <input className="inp" placeholder="Productor" value={userForm.puesto} onChange={e=>setUserForm(p=>({...p,puesto:e.target.value}))} style={{marginBottom:10}}/>
                <Lbl>Contraseña *</Lbl>
                <input className="inp" placeholder="Por ej. su DNI: 32456789" value={userForm.password} onChange={e=>{setUserForm(p=>({...p,password:e.target.value}));setFormErr("");}} style={{marginBottom:16}}/>
                <p style={{color:C.muted,fontSize:11,marginBottom:16,lineHeight:1.6}}>La contraseña puede ser el DNI del empleado u otra combinación única. Cada usuario tendrá su propio acceso.</p>
                <button className="btn" onClick={addUsuario} disabled={saving} style={{width:"100%",padding:11}}>{saving?"Guardando...":"Crear usuario"}</button>
              </div>

              {/* Lista usuarios activos */}
              <div className="card" style={{padding:20}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>Usuarios activos ({usuarios.length})</h3>
                {usuarios.length===0&&<p style={{color:C.muted,fontSize:13}}>No hay usuarios creados aún.</p>}
                {usuarios.map(u=>(
                  <div key={u.id} style={{borderBottom:`1px solid ${C.border}`,padding:"12px 0"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{u.nombre} {u.apellido}</div>
                        <div style={{color:C.muted,fontSize:12}}>{u.puesto||"Sin puesto"} · Desde {fmtDate(u.fechaCreacion)}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>Contraseña: <span style={{fontFamily:"monospace",background:C.bg,padding:"1px 6px",borderRadius:4,border:`1px solid ${C.border}`}}>{u.password}</span></div>
                      </div>
                      <button className="btn-red btn-sm" onClick={()=>setConfirm({type:"baja_usuario",id:u.id,nombre:u.nombre+" "+u.apellido})}>Dar de baja</button>
                    </div>
                    {/* Cambiar contraseña */}
                    {newPwForm.id===u.id
                      ?<div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
                          <input className="inp" placeholder="Nueva contraseña" value={newPwForm.pw} onChange={e=>{setNewPwForm(p=>({...p,pw:e.target.value}));setFormErr("");}} style={{flex:1,minWidth:120,padding:"7px 10px",fontSize:12}}/>
                          <button className="btn btn-sm" onClick={()=>cambiarPassword(u.id,newPwForm.pw)} style={{textTransform:"none",letterSpacing:0}}>Guardar</button>
                          <button className="btn-ghost btn-sm" onClick={()=>{setNewPwForm({id:"",pw:""});setFormErr("");}}>Cancelar</button>
                        </div>
                      :<button className="btn-ghost btn-sm" style={{marginTop:8}} onClick={()=>{setNewPwForm({id:u.id,pw:""});setFormErr("");}}>Cambiar contraseña</button>
                    }
                    {formErr&&newPwForm.id===u.id&&<div style={{color:C.red,fontSize:11,marginTop:4}}>{formErr}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVIDAD (solo admin) ── */}
        {view===V.ACTIVIDAD&&isAdmin&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
              <Title t="Registro de Actividad" sub="Todas las acciones realizadas en el sistema"/>
              <button className="btn-ghost" onClick={loadActividad} style={{fontSize:12}}>Actualizar</button>
            </div>
            {actividad.length===0&&(
              <div className="card" style={{padding:32,textAlign:"center"}}>
                <p style={{color:C.muted,fontSize:14}}>No hay actividad registrada aún.</p>
                <button className="btn" style={{marginTop:16}} onClick={loadActividad}>Cargar actividad</button>
              </div>
            )}
            {actividad.length>0&&(
              <div className="card" style={{overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`,background:C.bg}}>
                        {["Fecha","Hora","Operador","Acción","Detalle"].map(h=>(
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {actividad.slice(0,200).map((a,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.card:C.bg}}>
                          <td style={{padding:"8px 14px",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{fmtDate(a.fecha)}</td>
                          <td style={{padding:"8px 14px",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{a.hora}</td>
                          <td style={{padding:"8px 14px"}}><div style={{fontWeight:600,fontSize:13}}>{a.operadorNombre}</div></td>
                          <td style={{padding:"8px 14px"}}><span style={{background:C.accent+"22",color:C.accent,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{a.accion}</span></td>
                          <td style={{padding:"8px 14px",fontSize:12,color:C.muted}}>{a.detalle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {actividad.length>200&&<div style={{padding:"10px 14px",color:C.muted,fontSize:12,textAlign:"center"}}>Mostrando los 200 últimos registros de {actividad.length} totales</div>}
              </div>
            )}
          </div>
        )}

        {/* ── REGISTRO RÁPIDO ── */}
        {view===V.OY_QUICK&&(
          <div className="fade-in" style={{maxWidth:440}}>
            <Back to={V.OYENTES}/>
            <div style={{background:C.green+"11",border:`1px solid ${C.green}44`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:20}}>⚡</span>
              <div><div style={{fontWeight:700,fontSize:14,color:C.green}}>Registro rápido</div><div style={{color:C.muted,fontSize:12}}>Solo nombre y teléfono. Completás el resto después desde el perfil.</div></div>
            </div>
            <FErr/>
            <Lbl>Nombre completo *</Lbl>
            <input className="inp" type="text" placeholder="Nombre del oyente" value={quickForm.nombre} onChange={e=>{setQuickForm(p=>({...p,nombre:e.target.value}));setFormErr("");}} style={{marginBottom:14}} autoFocus/>
            <Lbl>Teléfono / WhatsApp *</Lbl>
            <input className="inp" type="tel" placeholder="1134567890" value={quickForm.telefono} onChange={e=>{setQuickForm(p=>({...p,telefono:e.target.value}));setFormErr("");}} style={{marginBottom:20}}/>
            <button className="btn-green" onClick={addQuick} disabled={saving} style={{width:"100%",padding:13,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{saving?"Guardando...":"⚡ Registrar ahora"}</button>
          </div>
        )}

        {/* ── OYENTES ── */}
        {view===V.OYENTES&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:10,flexWrap:"wrap"}}>
              <Title t="Oyentes" sub={`${oyentesFiltrados.length}${filtrosActivos?" filtrados de "+oyentes.length+" totales":" registrados"}`}/>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button className="btn-ghost" onClick={()=>nav(V.OY_QUICK)} style={{fontSize:12,color:C.green,borderColor:C.green}}>⚡ Rápido</button>
                <button className="btn" onClick={()=>nav(V.OY_NEW)}>+ Registrar</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <input className="inp" placeholder="Buscar por nombre, teléfono, DNI o localidad..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{flex:1,minWidth:200}}/>
              <button className={filtrosActivos?"btn":"btn-ghost"} onClick={()=>setMostrarFiltros(f=>!f)} style={{flexShrink:0,padding:"10px 14px",fontSize:12,background:filtrosActivos?C.accent:"transparent",borderColor:filtrosActivos?C.accent:C.border,color:filtrosActivos?"#fff":C.muted}}>
                {filtrosActivos?"Filtros ✓":"Filtros"}
              </button>
            </div>
            {mostrarFiltros&&(
              <div className="card fade-in" style={{padding:14,marginBottom:12,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                <div><Lbl>Género</Lbl><select className="sel" value={filtroGenero} onChange={e=>setFiltroGenero(e.target.value)} style={{padding:"7px 10px",fontSize:12}}><option value="">Todos</option><option>Mujer</option><option>Hombre</option><option>Otro</option></select></div>
                <div><Lbl>Localidad</Lbl><select className="sel" value={filtroLocalidad} onChange={e=>setFiltroLocalidad(e.target.value)} style={{padding:"7px 10px",fontSize:12}}><option value="">Todas</option>{localidades.map(l=><option key={l}>{l}</option>)}</select></div>
                <div><Lbl>Edad</Lbl><select className="sel" value={filtroEdad} onChange={e=>setFiltroEdad(e.target.value)} style={{padding:"7px 10px",fontSize:12}}><option value="">Todas</option><option value="18-25">18-25</option><option value="26-35">26-35</option><option value="36-45">36-45</option><option value="46+">46+</option></select></div>
                <div style={{display:"flex",alignItems:"flex-end",paddingBottom:2}}><label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:C.text,fontWeight:600}}><input type="checkbox" checked={filtroReciente} onChange={e=>setFiltroReciente(e.target.checked)} style={{width:14,height:14}}/>Ganó en 30d</label></div>
                {filtrosActivos&&<div style={{display:"flex",alignItems:"flex-end"}}><button className="btn-ghost" onClick={()=>{setFiltroGenero("");setFiltroLocalidad("");setFiltroEdad("");setFiltroReciente(false);}} style={{padding:"6px 12px",fontSize:12}}>Limpiar</button></div>}
              </div>
            )}
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
                    {oyentesFiltrados.map(o=>(
                      <tr key={o.id} className="row" style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>nav(V.OY_DET,o.id)}>
                        <td style={{padding:"11px 14px"}}><div style={{fontWeight:600,fontSize:14}}>{o.nombre}</div><div style={{color:C.muted,fontSize:11,marginTop:1}}>DNI {o.dni}</div></td>
                        <td style={{padding:"11px 14px",fontSize:13,color:C.muted,whiteSpace:"nowrap"}}>{o.telefono}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}>{o.edad||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:13,color:C.muted}}>{o.localidad||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}>{o.genero||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:13}}><span style={{color:C.accent,fontWeight:700}}>{o.veces||0}</span></td>
                        <td style={{padding:"11px 14px"}}>{isRecent(o)?<span className="tag-warn">⚠ {daysSince(o.ultimoWin)}d</span>:parseInt(o.totalWins)>0?<span className="tag-ok">🏆 {o.totalWins}</span>:<span style={{color:C.muted,fontSize:12}}>Sin premios</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {oyentesFiltrados.length===0&&<div style={{padding:32,textAlign:"center",color:C.muted,fontSize:14}}>{filtrosActivos?"No hay oyentes con esos filtros.":"No hay oyentes registrados."}</div>}
            </div>
          </div>
        )}

        {/* ── DETALLE OYENTE ── */}
        {view===V.OY_DET&&selOy&&(
          <div className="fade-in">
            <Back to={V.OYENTES}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:20,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:C.accent+"22",border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,flexShrink:0,color:C.accent}}>{selOy.nombre.charAt(0).toUpperCase()}</div>
                <div>
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{selOy.nombre}</h2>
                  <p style={{color:C.muted,fontSize:13}}>Registrado el {selOy.fechaRegistro}{selOy.creadoPor?` · por ${selOy.creadoPor}`:""}</p>
                  {selOy.modificadoPor&&<p style={{color:C.muted,fontSize:12}}>Modificado por: {selOy.modificadoPor}</p>}
                </div>
              </div>
              <button className="btn-ghost" onClick={()=>{setEditForm({nombre:selOy.nombre||"",telefono:selOy.telefono||"",dni:selOy.dni||"",email:selOy.email||"",edad:selOy.edad||"",localidad:selOy.localidad||"",genero:selOy.genero||"",nota:selOy.nota||""});setFormErr("");nav(V.OY_EDIT,selOy.id);}} style={{display:"flex",alignItems:"center",gap:6}}>✏️ Editar datos</button>
            </div>
            {isRecent(selOy)&&<div style={{background:C.warn+"11",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",gap:8,alignItems:"center"}}><span>⚠️</span><span style={{color:C.warn,fontWeight:600,fontSize:13}}>Ganó un premio hace {daysSince(selOy.ultimoWin)} días.</span></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["📱 Teléfono",selOy.telefono],["🪶 DNI",selOy.dni],["✉️ Email",selOy.email||"—"],["🎂 Edad",selOy.edad?selOy.edad+" años":"—"],["📍 Localidad",selOy.localidad||"—"],["👤 Género",selOy.genero||"—"]].map(([l,val])=>(
                <div key={l} className="card" style={{padding:"12px 14px"}}><div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:600}}>{val}</div></div>
              ))}
            </div>
            {selOy.nota&&<div className="card" style={{padding:"12px 14px",marginBottom:14,borderLeft:`3px solid ${C.warn}`}}><div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>📝 Nota</div><div style={{fontSize:14,color:C.text,lineHeight:1.6}}>{selOy.nota}</div></div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {[["Participaciones",selOy.veces||0,C.accent],["Premios ganados",selOy.totalWins||0,C.green],["Días últ. premio",daysSince(selOy.ultimoWin)!==null?daysSince(selOy.ultimoWin)+"d":"Nunca",C.warn]].map(([l,val,col])=>(
                <div key={l} className="card" style={{padding:16,textAlign:"center"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:800,color:col}}>{val}</div><div style={{color:C.muted,fontSize:11,marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div></div>
              ))}
            </div>
            <div className="card" style={{padding:18,marginBottom:14}}>
              <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Historial de concursos</h3>
              {participaciones.filter(p=>p.oyenteId===selOy.id).length===0&&<p style={{color:C.muted,fontSize:13}}>No participó en concursos aún.</p>}
              {participaciones.filter(p=>p.oyenteId===selOy.id).map(p=>{
                const con=concursos.find(c=>c.id===p.concursoId);
                const nombre=con?.nombre||p.concursoNombre||"Concurso eliminado";
                const premio=con?.premio||p.concursoPremio||"";
                const diasAtras=p.fecha?daysSince(p.fecha):null;
                const cuandoStr=diasAtras===0?"hoy":diasAtras===1?"ayer":diasAtras!==null?"hace "+diasAtras+" días":"";
                const esGan=p.esGanador==="si"||(con?.ganadorId===selOy.id)||(con?.tipo==="ganador_directo");
                return(<div key={p.concursoId+p.oyenteId} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6}}>{nombre}{!con&&<span style={{fontSize:10,color:C.muted,fontWeight:400,background:C.border,borderRadius:4,padding:"1px 6px"}}>eliminado</span>}</div>
                    {premio&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>🎁 {premio}{p.cantGanada&&parseInt(p.cantGanada)>1?" · "+p.cantGanada+" unidades":""}</div>}
                    {cuandoStr&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>🗓 {cuandoStr} · {p.fecha}</div>}
                    {p.operadorNombre&&isAdmin&&<div style={{color:C.muted,fontSize:10,marginTop:1}}>👤 {p.operadorNombre}</div>}
                  </div>
                  <div style={{flexShrink:0,marginLeft:8}}>
                    {esGan?<span className="tag-ok">🏆 Ganador</span>:con?.estado==="activo"?<span className="tag-active">En curso</span>:!con?<span className="tag-done">Finalizado</span>:<span className="tag-done">No ganó</span>}
                  </div>
                </div>);
              })}
            </div>
            {consActivos.filter(c=>!inCon(selOy.id,c.id)).length>0&&(
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Agregar a concurso activo</h3>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {consActivos.filter(c=>!inCon(selOy.id,c.id)).map(c=>(
                    <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,gap:10,flexWrap:"wrap"}}>
                      <div><div style={{fontWeight:600,fontSize:13}}>{c.nombre}</div><div style={{fontSize:11,color:C.muted}}>🎁 {c.premio} · {c.tipo==="sorteo"?"🎲":"🏆"}</div></div>
                      <button className={c.tipo==="ganador_directo"?"btn-green":"btn-ghost"} style={{padding:"6px 14px",fontSize:12,flexShrink:0}} onClick={()=>inscribir(selOy.id,c.id)}>{c.tipo==="ganador_directo"?"🏆 Marcar ganador":"+ Inscribir"}</button>
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
                  <input className="inp" type={t} placeholder={ph} value={oyForm[k]} onChange={e=>{setOyForm(p=>({...p,[k]:e.target.value}));setFormErr("");}}/>
                </div>
              ))}
              <div>
                <Lbl>Género</Lbl>
                <select className="sel" value={oyForm.genero} onChange={e=>{setOyForm(p=>({...p,genero:e.target.value}));setFormErr("");}}>
                  <option value="">Seleccionar...</option><option>Mujer</option><option>Hombre</option><option>Otro</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:14}}>
              <Lbl>Nota interna (opcional)</Lbl>
              <textarea className="inp" placeholder="Observaciones sobre el oyente..." value={oyForm.nota} onChange={e=>setOyForm(p=>({...p,nota:e.target.value}))}/>
            </div>
            {consActivos.length>0&&(
              <div style={{marginTop:20}}>
                <Lbl>Anotar como ganador en concurso activo (opcional)</Lbl>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {consActivos.map(c=>{
                    const selected=oyConIds.includes(c.id);
                    return(
                      <div key={c.id} onClick={()=>setOyConIds(p=>selected?p.filter(id=>id!==c.id):[...p,c.id])} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,border:`2px solid ${selected?C.accent:C.border}`,background:selected?C.accent+"11":C.card,cursor:"pointer",transition:"all .15s"}}>
                        <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selected?C.accent:C.border}`,background:selected?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{selected&&<span style={{color:"#fff",fontSize:12}}>✓</span>}</div>
                        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:selected?C.accent:C.text}}>{c.nombre}</div><div style={{fontSize:11,color:C.muted}}>🎁 {c.premio} · {c.tipo==="sorteo"?"🎲 Sorteo":"🏆 Ganador directo"}</div></div>
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
                  <option value="">Seleccionar...</option><option>Mujer</option><option>Hombre</option><option>Otro</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:14}}>
              <Lbl>Nota interna</Lbl>
              <textarea className="inp" placeholder="Observaciones sobre el oyente..." value={editForm.nota||""} onChange={e=>setEditForm(p=>({...p,nota:e.target.value}))}/>
            </div>
            {consActivos.filter(c=>!inCon(selOy.id,c.id)).length>0&&(
              <div style={{marginTop:20}}>
                <Lbl>Agregar a concurso activo (opcional)</Lbl>
                <select className="sel" value={editConId} onChange={e=>setEditConId(e.target.value)}>
                  <option value="">— No agregar —</option>
                  {consActivos.filter(c=>!inCon(selOy.id,c.id)).map(c=>(
                    <option key={c.id} value={c.id}>{c.tipo==="ganador_directo"?"🏆":"🎲"} {c.nombre} — {c.premio}</option>
                  ))}
                </select>
                {editConId&&(()=>{const con=concursos.find(c=>c.id===editConId);return con?(<p style={{color:con.tipo==="ganador_directo"?C.green:C.accent,fontSize:12,marginTop:6,fontWeight:600}}>{con.tipo==="ganador_directo"?"🏆 Se marcará como ganador en":"🎲 Se inscribirá en"} {con.nombre}</p>):null;})()}
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
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>setShowArchived(s=>!s)} className="btn-ghost" style={{fontSize:12,padding:"6px 14px"}}>{showArchived?"Ocultar archivados":"Ver archivados"}</button>
                <button className="btn" onClick={()=>nav(V.CON_NEW)}>+ Nuevo concurso</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {consVisibles.length===0&&<div className="card" style={{padding:32,textAlign:"center",color:C.muted}}>No hay concursos.</div>}
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
                        {c.fechaHasta&&<Countdown fechaHasta={c.fechaHasta}/>}
                      </div>
                      <div style={{color:C.muted,fontSize:12}}>🎁 {c.premio} · {pCount} participantes{c.fechaDesde?" · "+fmtDate(c.fechaDesde)+(c.fechaHasta?" → "+fmtDate(c.fechaHasta):""):""}</div>
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{selCon.nombre}</h2>
                  {selCon.estado==="activo"&&<span className="tag-active">Activo</span>}
                  {selCon.estado==="finalizado"&&<span className="tag-done">Finalizado</span>}
                  {selCon.estado==="archivado"&&<span className="tag-arch">Archivado</span>}
                  <span style={{background:C.bg,color:C.muted,border:`1px solid ${C.border}`,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600}}>{selCon.tipo==="sorteo"?"🎲 Sorteo":"🏆 Ganador directo"}</span>
                  {selCon.fechaHasta&&<Countdown fechaHasta={selCon.fechaHasta}/>}
                </div>
                <p style={{color:C.muted,fontSize:13}}>🎁 {selCon.premio}{selCon.fechaDesde?" · "+fmtDate(selCon.fechaDesde):""}{selCon.fechaHasta?" → "+fmtDate(selCon.fechaHasta):""}</p>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {selCon.estado==="activo"&&conPartic(selCon.id).length>0&&selCon.tipo==="sorteo"&&<button className="btn-green" onClick={()=>nav(V.SORTEO,selCon.id)}>🎲 Sortear</button>}
                <button className="btn-ghost" style={{fontSize:12}} onClick={()=>exportExcelConcurso(selCon.id)}>⬇ Reporte</button>
                {selCon.estado==="activo"&&<button className="btn-ghost" style={{fontSize:12}} onClick={()=>{setExtendiendo(e=>!e);setNuevaFecha(selCon.fechaHasta||"");}}>&#x1F4C5; Extender</button>}
                {selCon.estado==="activo"&&<button className="btn-ghost" style={{fontSize:12}} onClick={()=>{setEditConForm({nombre:selCon.nombre||"",premio:selCon.premio||"",descripcion:selCon.descripcion||"",fechaDesde:selCon.fechaDesde||"",fechaHasta:selCon.fechaHasta||"",tipo:selCon.tipo||"ganador_directo",stockTotal:selCon.stockTotal||""});setFormErr("");nav(V.CON_EDIT,selCon.id);}}>&#x270F;&#xFE0F; Editar</button>}
                {selCon.estado==="finalizado"&&<button className="btn-ghost" style={{fontSize:12,color:C.green,borderColor:C.green}} onClick={()=>reactivarConcurso(selCon.id)}>► Reactivar</button>}
                {selCon.estado!=="archivado"&&isAdmin&&<button className="btn-ghost" style={{fontSize:12}} onClick={e=>{e.stopPropagation();setConfirm({type:"archivar",id:selCon.id});}}>&#x1F4E6; Archivar</button>}
                {isAdmin&&<button className="btn-red" style={{fontSize:12,padding:"9px 14px"}} onClick={e=>{e.stopPropagation();setConfirm({type:"eliminar",id:selCon.id});}}>🗑</button>}
              </div>
            </div>

            {selCon.ganadorNombre&&<div style={{background:C.green+"11",border:`1px solid ${C.green}44`,borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28}}>🏆</span><div><div style={{color:C.green,fontWeight:700,fontSize:18,fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>{selCon.tipo==="ganador_directo"?"Último ganador:":"Ganador:"} {selCon.ganadorNombre}</div><div style={{color:C.muted,fontSize:12}}>Premio: {selCon.premio}</div></div></div>}

            {waMsg&&<div className="card fade-in" style={{padding:"14px 18px",marginBottom:16,border:`2px solid ${C.green}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontWeight:700,fontSize:13,color:C.green}}>📱 Mensaje para WhatsApp</span><button className="btn-ghost" style={{padding:"3px 10px",fontSize:11}} onClick={()=>setWaMsg(null)}>✕</button></div><div style={{background:C.bg,borderRadius:6,padding:"10px 12px",fontSize:13,color:C.text,lineHeight:1.6,marginBottom:10}}>{waMsg}</div><button className="btn-green" style={{padding:"6px 16px",fontSize:12}} onClick={()=>{navigator.clipboard.writeText(waMsg);showToast("Copiado al portapapeles ✓");}}>&#x1F4CB; Copiar mensaje</button></div>}

            {extendiendo&&<div className="card fade-in" style={{padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><span style={{fontWeight:600,fontSize:13}}>📅 Nueva fecha límite:</span><input className="inp" type="date" value={nuevaFecha} onChange={e=>setNuevaFecha(e.target.value)} style={{width:"auto",flex:1,minWidth:160}}/><button className="btn" style={{padding:"8px 18px",fontSize:13}} onClick={()=>extenderConcurso(selCon.id,nuevaFecha)}>Confirmar</button><button className="btn-ghost" style={{padding:"8px 14px",fontSize:13}} onClick={()=>setExtendiendo(false)}>Cancelar</button></div>}

            {selCon.tipo==="ganador_directo"&&parseInt(selCon.stockTotal)>0&&(()=>{
              const total=parseInt(selCon.stockTotal)||0,usados=parseInt(selCon.stockUsado)||0,restantes=total-usados,pct=Math.min(Math.round((usados/total)*100),100),agotado=restantes<=0;
              return(<div className="card" style={{padding:"14px 18px",marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
                  <div><span style={{fontWeight:700,fontSize:13,color:agotado?C.red:C.text}}>🎁 Stock: </span><span style={{fontWeight:800,fontSize:15,color:agotado?C.red:C.green}}>{restantes}</span><span style={{color:C.muted,fontSize:12}}> de {total} · {usados} entregados</span></div>
                  {agotado&&selCon.estado==="activo"&&<button className="btn-ghost" style={{fontSize:12,padding:"4px 12px"}} onClick={()=>{const extra=prompt("¿Cuántos premios más?","10");if(extra&&parseInt(extra)>0){const nT=total+parseInt(extra);api("extenderStock",{concursoId:selCon.id,stockTotal:nT,operadorId:opId,operadorNombre:opNombre});setConcursos(p=>p.map(c=>c.id===selCon.id?{...c,stockTotal:nT}:c));showToast("Stock ampliado a "+nT+" ✓");}}}>➕ Agregar más</button>}
                </div>
                <div style={{height:8,background:C.border,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:agotado?C.red:restantes<=total*.2?C.warn:C.green,borderRadius:4,transition:"width .5s"}}/></div>
                {agotado&&<p style={{color:C.red,fontSize:12,fontWeight:600,marginTop:6}}>⚠️ Stock agotado.</p>}
                {!agotado&&restantes<=total*.2&&<p style={{color:C.warn,fontSize:12,fontWeight:600,marginTop:6}}>⚠️ Quedan pocos premios ({restantes}).</p>}
              </div>);
            })()}

            {pickingWinner&&<div className="card fade-in" style={{padding:"16px 18px",marginBottom:16,border:`2px solid ${C.green}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                <div><span style={{fontWeight:700,fontSize:14}}>🏆 Dar premio a </span><span style={{fontWeight:800,fontSize:15,color:C.green}}>{pickingWinner.nombre}</span></div>
                <button className="btn-ghost" style={{padding:"4px 10px",fontSize:12}} onClick={()=>{setPickingWinner(null);setCantGanada(1);}}>&#x2715; Cancelar</button>
              </div>
              <Lbl>¿Cuántos premios le das?</Lbl>
              {(()=>{
                const total=parseInt(selCon.stockTotal)||0,usados=parseInt(selCon.stockUsado)||0,restantes=total>0?total-usados:20;
                const opciones=Array.from({length:Math.min(restantes,20)},(_,i)=>i+1);
                return(<div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <select className="sel" value={cantGanada} onChange={e=>setCantGanada(parseInt(e.target.value))} style={{width:"auto",minWidth:140}}>
                    {opciones.map(n=><option key={n} value={n}>{n} {n===1?selCon.premio:"x "+selCon.premio}</option>)}
                  </select>
                  <button className="btn-green" style={{padding:"9px 20px"}} onClick={()=>marcarGanadorDirecto(pickingWinner,cantGanada)}>Confirmar</button>
                </div>);
              })()}
            </div>}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="card" style={{padding:18}}>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Participantes ({conPartic(selCon.id).length})</h3>
                {conPartic(selCon.id).length===0&&<p style={{color:C.muted,fontSize:13}}>Sin participantes aún.</p>}
                {conPartic(selCon.id).map(o=>{
                  const par=participaciones.find(p=>p.concursoId===selCon.id&&p.oyenteId===o.id);
                  const esGan=par?.esGanador==="si"||(selCon.ganadorId===o.id)||(selCon.tipo==="ganador_directo");
                  return(<div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{o.nombre}</div>
                      <div style={{color:C.muted,fontSize:11}}>{o.telefono}{par?.cantGanada&&parseInt(par.cantGanada)>1?" · "+par.cantGanada+"x":""}
                      {par?.operadorNombre&&isAdmin?<span style={{color:C.muted,fontSize:10}}> · {par.operadorNombre}</span>:""}</div>
                    </div>
                    <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {esGan&&<span className="tag-ok">🏆</span>}
                      {isRecent(o)&&!esGan&&<span className="tag-warn">⚠{daysSince(o.ultimoWin)}d</span>}
                      {selCon.estado==="activo"&&selCon.tipo==="ganador_directo"&&(pickingWinner?.id===o.id?null:<button className="btn-green btn-sm" onClick={()=>{setPickingWinner(o);setCantGanada(1);}}>&#x1F3C6; Premio</button>)}
                    </div>
                  </div>);
                })}
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {selCon.estado==="activo"&&<div className="card" style={{padding:18}}>
                  <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Inscribir oyente</h3>
                  <input className="inp" placeholder="Buscar por nombre o teléfono..." value={conBusq} onChange={e=>setConBusq(e.target.value)} style={{marginBottom:10,padding:"8px 12px",fontSize:13}}/>
                  <div style={{maxHeight:220,overflowY:"auto"}}>
                    {oyentes.filter(o=>!inCon(o.id,selCon.id)).filter(o=>!conBusq||o.nombre.toLowerCase().includes(conBusq.toLowerCase())||o.telefono.includes(conBusq)).map(o=>(
                      <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div><div style={{fontWeight:600,fontSize:13}}>{o.nombre}</div><div style={{color:isRecent(o)?C.warn:C.muted,fontSize:11}}>{o.telefono}{isRecent(o)?" · ⚠ "+daysSince(o.ultimoWin)+"d":""}</div></div>
                        <button className="btn-ghost" onClick={()=>inscribir(o.id,selCon.id)} style={{padding:"4px 12px",fontSize:12,flexShrink:0}}>{selCon.tipo==="ganador_directo"?"🏆":"+"}</button>
                      </div>
                    ))}
                    {oyentes.filter(o=>!inCon(o.id,selCon.id)).length===0&&<p style={{color:C.muted,fontSize:13}}>Todos inscriptos.</p>}
                  </div>
                </div>}

                {conPartic(selCon.id).length>0&&(()=>{
                  const cs=conStats(selCon.id);
                  return(<div className="card" style={{padding:18}}>
                    <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Perfil del público</h3>
                    <div style={{marginBottom:12}}><div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Género</div>
                      {Object.entries(cs.gen).filter(([,v])=>v>0).map(([g,n])=>{const col=g==="Mujer"?"#EC4899":g==="Hombre"?"#3B82F6":g==="Otro"?"#8B5CF6":C.muted;return(<div key={g} style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{g}</span><span style={{fontWeight:700}}>{n}</span></div><Bar val={n} max={cs.total} color={col}/></div>);})}
                    </div>
                    <div style={{marginBottom:12}}><div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Edad</div>
                      {Object.entries(cs.rangos).filter(([,v])=>v>0).map(([r,n])=>(<div key={r} style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{r}</span><span style={{fontWeight:700}}>{n}</span></div><Bar val={n} max={cs.total} color={C.accent}/></div>))}
                    </div>
                    {cs.topLocs.length>0&&<div><div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Top localidades</div>{cs.topLocs.map(([l,n])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700}}>{n}</span></div>))}</div>}
                  </div>);
                })()}
              </div>
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
            <p style={{color:C.accent,fontWeight:700,fontSize:16,marginBottom:24}}>🎁 {selCon.premio}</p>
            {!sorteoState.ganadores.length&&!sorteoState.animando&&(
              <div className="card" style={{display:"inline-block",padding:"32px 48px",marginBottom:28,textAlign:"center"}}>
                <p style={{color:C.muted,fontSize:14,marginBottom:16}}>{conPartic(selCon.id).length} participantes en el bombo</p>
                <div style={{marginBottom:20}}>
                  <Lbl>¿Cuántos ganadores?</Lbl>
                  <select className="sel" value={cantSortear} onChange={e=>setCantSortear(parseInt(e.target.value))} style={{width:"auto",minWidth:120,margin:"0 auto"}}>
                    {Array.from({length:Math.min(conPartic(selCon.id).length,10)},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} ganador{n>1?"es":""}</option>)}
                  </select>
                </div>
                <button className="btn" onClick={realizarSorteo} style={{padding:"16px 48px",fontSize:20}}>¡SORTEAR AHORA!</button>
              </div>
            )}
            {sorteoState.animando&&<div className="card pulse" style={{display:"inline-block",padding:"32px 48px",marginBottom:28,minWidth:300}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:800,color:C.accent,letterSpacing:1}}>{sorteoState.nombres[Math.floor(Math.random()*sorteoState.nombres.length)]||"..."}</div></div>}
            {sorteoState.ganadores.length>0&&!sorteoState.animando&&(
              <div className="win-in">
                <div style={{fontSize:60,marginBottom:12}}>🏆</div>
                {sorteoState.ganadores.map((w,i)=>(
                  <div key={w.id} style={{marginBottom:16}}>
                    {sorteoState.ganadores.length>1&&<div style={{color:C.muted,fontSize:13,marginBottom:4}}>Ganador #{i+1}</div>}
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:sorteoState.ganadores.length===1?48:34,fontWeight:800,color:C.green,letterSpacing:2,textTransform:"uppercase",lineHeight:1,marginBottom:6}}>{w.nombre}</div>
                    <div style={{color:C.muted,fontSize:14}}>📱 {w.telefono} · DNI: {w.dni}</div>
                    {parseInt(w.totalWins)>1&&<div style={{color:C.warn,fontSize:12,fontWeight:600,marginTop:4}}>⚠️ Ganó {parseInt(w.totalWins)-1} veces anteriormente</div>}
                  </div>
                ))}
                <button className="btn-ghost" style={{marginTop:16}} onClick={()=>nav(V.CONS)}>Ver todos los concursos</button>
              </div>
            )}
          </div>
        )}

        {/* ── EDITAR CONCURSO ── */}
        {view===V.CON_EDIT&&selCon&&(
          <div className="fade-in" style={{maxWidth:520}}>
            <Back to={V.CON_DET} label="← Volver al concurso"/>
            <Title t="Editar Concurso" sub={selCon.nombre}/>
            <FErr/>
            <Lbl>Nombre del concurso *</Lbl>
            <input className="inp" value={editConForm.nombre} onChange={e=>{setEditConForm(p=>({...p,nombre:e.target.value}));setFormErr("");}} style={{marginBottom:14}}/>
            <Lbl>Premio *</Lbl>
            <input className="inp" value={editConForm.premio} onChange={e=>{setEditConForm(p=>({...p,premio:e.target.value}));setFormErr("");}} style={{marginBottom:14}}/>
            <Lbl>Descripción</Lbl>
            <input className="inp" value={editConForm.descripcion} onChange={e=>setEditConForm(p=>({...p,descripcion:e.target.value}))} style={{marginBottom:14}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div><Lbl>Fecha desde</Lbl><input className="inp" type="date" value={editConForm.fechaDesde} onChange={e=>setEditConForm(p=>({...p,fechaDesde:e.target.value}))}/></div>
              <div><Lbl>Fecha hasta</Lbl><input className="inp" type="date" value={editConForm.fechaHasta} onChange={e=>setEditConForm(p=>({...p,fechaHasta:e.target.value}))}/></div>
            </div>
            <Lbl>Tipo *</Lbl>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["ganador_directo","🏆 Ganador directo","Gana al instante"],["sorteo","🎲 Sorteo","Se sortea entre inscriptos"]].map(([val,label,desc])=>(
                <div key={val} onClick={()=>setEditConForm(p=>({...p,tipo:val}))} style={{border:`2px solid ${editConForm.tipo===val?C.accent:C.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",background:editConForm.tipo===val?C.accent+"11":C.card,transition:"all .15s"}}>
                  <div style={{fontWeight:700,fontSize:14,color:editConForm.tipo===val?C.accent:C.text,marginBottom:4}}>{label}</div>
                  <div style={{fontSize:12,color:C.muted}}>{desc}</div>
                </div>
              ))}
            </div>
            {editConForm.tipo==="ganador_directo"&&<div style={{marginBottom:14}}><Lbl>Cantidad total de premios</Lbl><input className="inp" type="number" min="1" placeholder="Vacío = ilimitado" value={editConForm.stockTotal} onChange={e=>setEditConForm(p=>({...p,stockTotal:e.target.value}))}/></div>}
            <button className="btn" onClick={updateConcurso} disabled={saving} style={{width:"100%",padding:13}}>{saving?"Guardando...":"Guardar cambios"}</button>
          </div>
        )}

        {/* ── NUEVO CONCURSO ── */}
        {view===V.CON_NEW&&(
          <div className="fade-in" style={{maxWidth:520}}>
            <Back to={V.CONS}/>
            <Title t="Nuevo Concurso"/>
            <FErr/>
            <Lbl>Nombre del concurso *</Lbl>
            <input className="inp" placeholder="Ej: Entradas Shakira" value={conForm.nombre} onChange={e=>{setConForm(p=>({...p,nombre:e.target.value}));setFormErr("");}} style={{marginBottom:14}}/>
            <Lbl>Premio *</Lbl>
            <input className="inp" placeholder="Ej: 2 entradas campo" value={conForm.premio} onChange={e=>{setConForm(p=>({...p,premio:e.target.value}));setFormErr("");}} style={{marginBottom:14}}/>
            <Lbl>Descripción</Lbl>
            <input className="inp" placeholder="Detalles adicionales..." value={conForm.descripcion} onChange={e=>setConForm(p=>({...p,descripcion:e.target.value}))} style={{marginBottom:14}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div><Lbl>Fecha desde</Lbl><input className="inp" type="date" value={conForm.fechaDesde} onChange={e=>setConForm(p=>({...p,fechaDesde:e.target.value}))}/></div>
              <div><Lbl>Fecha hasta</Lbl><input className="inp" type="date" value={conForm.fechaHasta} onChange={e=>setConForm(p=>({...p,fechaHasta:e.target.value}))}/></div>
            </div>
            <Lbl>Tipo de concurso *</Lbl>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["ganador_directo","🏆 Ganador directo","El oyente gana en el momento, sin sorteo"],["sorteo","🎲 Sorteo","Se sortea entre varios participantes inscriptos"]].map(([val,label,desc])=>(
                <div key={val} onClick={()=>setConForm(p=>({...p,tipo:val}))} style={{border:`2px solid ${conForm.tipo===val?C.accent:C.border}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",background:conForm.tipo===val?C.accent+"11":C.card,transition:"all .15s"}}>
                  <div style={{fontWeight:700,fontSize:14,color:conForm.tipo===val?C.accent:C.text,marginBottom:4}}>{label}</div>
                  <div style={{fontSize:12,color:C.muted}}>{desc}</div>
                </div>
              ))}
            </div>
            {conForm.tipo==="ganador_directo"&&<div style={{marginBottom:14}}><Lbl>Cantidad de premios disponibles (opcional)</Lbl><input className="inp" type="number" min="1" placeholder="Ej: 40 — vacío = ilimitado" value={conForm.stockTotal} onChange={e=>setConForm(p=>({...p,stockTotal:e.target.value}))}/><p style={{color:C.muted,fontSize:11,marginTop:5}}>El sistema te avisará cuando se agoten los premios.</p></div>}
            <button className="btn" onClick={addConcurso} disabled={saving} style={{width:"100%",padding:13,marginTop:4}}>{saving?"Guardando...":"Crear concurso"}</button>
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
              if(!found)return(<div className="card" style={{padding:28,textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>🔍</div><p style={{color:C.muted,fontSize:14}}>No encontrado. <button className="btn" onClick={()=>nav(V.OY_QUICK)} style={{padding:"8px 16px",marginLeft:8,fontSize:13}}>⚡ Registro rápido</button><button className="btn-ghost" onClick={()=>nav(V.OY_NEW)} style={{padding:"8px 16px",marginLeft:8,fontSize:13}}>+ Completo</button></p></div>);
              return(<div className="card fade-in" style={{padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:16}}>
                  <div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{found.nombre}</div>
                    <div style={{color:C.muted,fontSize:13,margin:"4px 0"}}>📱 {found.telefono} · DNI {found.dni}{found.edad?" · "+found.edad+" años":""}</div>
                    {found.localidad&&<div style={{color:C.muted,fontSize:13}}>📍 {found.localidad}</div>}
                    {found.email&&<div style={{color:C.muted,fontSize:13}}>✉️ {found.email}</div>}
                    {found.nota&&<div style={{color:C.warn,fontSize:12,marginTop:4,fontWeight:600}}>📝 {found.nota}</div>}
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
                {isRecent(found)&&<div style={{background:C.warn+"11",border:`1px solid ${C.warn}44`,borderRadius:8,padding:"12px 16px",display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:18}}>⚠️</span><span style={{color:C.warn,fontWeight:700,fontSize:14}}>Ganó hace {daysSince(found.ultimoWin)} días.</span></div>}
              </div>);
            })()}
            {busqueda.length<4&&<div className="card" style={{padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📱</div><p style={{color:C.muted,fontSize:14,fontWeight:600}}>Escribí al menos 4 dígitos del número</p></div>}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── CONFIG ── */
const GAS_URL="https://script.google.com/macros/s/AKfycbwOu4sAbmNK7Arqgu9enU8zc8vn8t7bYZhvmT8lDIF2ZXg0A6IvjreVzfV9efU4FXiw/exec";
const ADMIN_PASSWORD="mph951";

export default function App(){
  const [loggedIn,setLoggedIn]=useState(false);
  const [currentUser,setCurrentUser]=useState(null);
  return loggedIn&&currentUser
    ?<MainApp onLogout={()=>{setLoggedIn(false);setCurrentUser(null);}} currentUser={currentUser}/>
    :<LoginScreen onLogin={(user)=>{setCurrentUser(user);setLoggedIn(true);}}/>;
}
