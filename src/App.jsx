import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Target, Package, Boxes, LayoutDashboard, LogOut, Search, Plus, Trash2, X, AlertTriangle, ArrowUpDown, Check, Lock, MapPin, ScrollText, Loader, Wrench, Droplet, HelpCircle, ShoppingCart, Tag, Users, ChevronRight, MoreVertical, Star, Backpack, CheckCircle2, ShieldCheck, Eye, Hand, Zap, Menu, Hammer, Send, Bell, CheckCheck, MessageCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUPER_ADMIN_EMAIL = "pierfelicejohnny@yahoo.com";

function LogoIcon({ size = 24 }) { return <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M 100 20 L 160 55 L 160 145 L 100 180 L 40 145 L 40 55 Z" fill="none" stroke="currentColor"/><rect x="60" y="60" width="80" height="80" rx="4" fill="none" stroke="currentColor"/><circle cx="100" cy="100" r="12" fill="none" stroke="currentColor"/><line x1="88" y1="100" x2="112" y2="100" stroke="currentColor"/><line x1="100" y1="88" x2="100" y2="112" stroke="currentColor"/></svg>; }

const MANUFACTURERS = ["Glock","Smith & Wesson","Sig Sauer","Ruger","Colt","Remington","Springfield Armory","Beretta","CZ","Heckler & Koch","Winchester","Mossberg","Savage Arms","Browning","FN Herstal","Walther","Kimber","Daniel Defense","Aero Precision","Palmetto State Armory","Henry","Marlin","Benelli","Tikka","Bergara","Other"];
const CALIBERS = ["9mm",".45 ACP",".40 S&W",".380 ACP","10mm",".22 LR",".223 Rem","5.56 NATO",".308 Win","7.62x39","6.5 Creedmoor",".300 BLK",".30-06",".270 Win","12 Gauge","20 Gauge",".410 Bore",".357 Mag",".38 Special","44 Mag","Other"];
const FIREARM_TYPES = ["Pistol","Revolver","Rifle","Shotgun","Other"];
const ATTACHMENT_TYPES = ["Scope","Red Dot","Holster","Grip","Magazine","Light","Sling","Bipod","Suppressor","Other"];
const AMMO_TYPES = ["FMJ","JHP","Match","Birdshot","Buckshot","Slug","Subsonic","Frangible","Other"];
const SUPPLY_CATEGORIES = ["Cleaning Solvents","Lubricants / CLP","Brushes / Patches / Rods","Gun Cases / Bags","Ammo Storage","Targets","Hearing Protection","Eye Protection","Holsters / Belts","Slings / Gear","Manuals","Gun Safe","Maintenance Kits","Mag Pouches","Bore Cleaners","Lights / Batteries","Sights","Grips","Range Supplies","Other"];
const IMAGE_MAX_MB = 5;
const APP_VERSION = "1.5.2";

const CHANGELOG = [
  { version:"1.5.2", date:"2026-05-17", tag:"current", title:"Complete schema correction — all columns match database", changes:[
    { type:"fixed", text:"All column names now match actual Supabase schema exactly." },
    { type:"fixed", text:"Firearms: value, current_value, nickname, acquired, photo_path." },
    { type:"fixed", text:"Accessories: name, brand, quantity, value, assigned_to, photo_path." },
    { type:"fixed", text:"Ammo: caliber, type, brand, grain, quantity, location, value." },
    { type:"fixed", text:"Range Log: range_name, rounds, firearm_id, loadout_id." },
    { type:"fixed", text:"Loadouts: items (JSONB), use_count, favorite." },
    { type:"fixed", text:"Supplies: est_cost, purchased, purchased_at." },
    { type:"fixed", text:"Photo upload working correctly." },
  ]},
  { version:"1.5.1", date:"2026-05-17", tag:"", title:"Major overhaul — Range Log, Safe Audit, Gemini chatbot", changes:[
    { type:"added", text:"Gemini AI chatbot." },
    { type:"added", text:"Range Log redesign." },
    { type:"changed", text:"Menu reorganization and dashboard redesign." },
  ]},
];

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);
const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);
const money = (n) => (n||n===0)?`$${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—";
function validateImage(file) { if(file.size/1024/1024>IMAGE_MAX_MB) return `Image must be under ${IMAGE_MAX_MB}MB.`; if(!["image/jpeg","image/jpg","image/png","image/webp","image/gif"].includes(file.type)) return "Invalid image type."; return null; }

/* ── shared UI ─────────────────────────────────────── */
function Field({label,children}){return <label className="form-fld"><span>{label}</span>{children}</label>;}
function Modal({title,onClose,children,wide}){return <div className="modal-back" onMouseDown={onClose}><div className={`modal ${wide?"wide":""}`} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18}/></button></div><div className="modal-body">{children}</div></div></div>;}
function Stat({icon:Icon,label,value,accent,onClick}){return <div className="stat" style={accent?{borderColor:accent}:{}} onClick={onClick}><div className="stat-ico" style={accent?{color:accent}:{}}><Icon size={20}/></div><div><div className="stat-val">{value}</div><div className="stat-lbl">{label}</div></div></div>;}
function Empty({icon:Icon,label,hint}){return <div className="empty"><Icon size={40} strokeWidth={1.4}/><strong>{label}</strong><span>{hint}</span></div>;}
function PersistentMenu({items}){const[open,setOpen]=useState(false);return <div className="persistent-menu-wrap" onMouseLeave={()=>setOpen(false)}><button className="icon-btn" onClick={()=>setOpen(!open)}><MoreVertical size={15}/></button>{open&&<div className="persistent-menu">{items.map((it,i)=><button key={i} onClick={()=>{setOpen(false);it.onClick();}} className={it.danger?"danger":""}>{it.icon&&<it.icon size={13}/>} {it.label}</button>)}</div>}</div>;}
function Toolbar({query,setQuery,sortKey,setSortKey,sortDir,setSortDir,sortOptions,onAdd,placeholder,addLabel="Add",children}){return <div className="toolbar">{onAdd&&<button className="primary" onClick={onAdd}><Plus size={16}/> {addLabel}</button>}<div className="search-big"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}/></div>{sortOptions&&<div className="sort"><ArrowUpDown size={14}/><select value={sortKey} onChange={e=>setSortKey(e.target.value)}>{sortOptions.map(o=><option key={o.key} value={o.key}>{o.label}</option>)}</select><button className="dir" onClick={()=>setSortDir(d=>d==="asc"?"desc":"asc")}>{sortDir==="asc"?"↑":"↓"}</button></div>}<div className="spacer"/>{children}</div>;}
function useTable(rows,searchFields,defaultSort){const[query,setQuery]=useState("");const[sortKey,setSortKey]=useState(defaultSort);const[sortDir,setSortDir]=useState("asc");const view=useMemo(()=>{let r=rows;const q=query.trim().toLowerCase();if(q) r=r.filter(x=>searchFields.some(f=>String(x[f]??"").toLowerCase().includes(q)));r=[...r].sort((a,b)=>{let av=a[sortKey],bv=b[sortKey];if(typeof av==="string") av=av.toLowerCase();if(typeof bv==="string") bv=bv.toLowerCase();if(av==null) av="";if(bv==null) bv="";if(av<bv) return sortDir==="asc"?-1:1;if(av>bv) return sortDir==="asc"?1:-1;return 0;});return r;},[rows,query,sortKey,sortDir,searchFields]);return{query,setQuery,sortKey,setSortKey,sortDir,setSortDir,view};}

/* ── Login ─────────────────────────────────────────── */
function Login({onAuth}){
  const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[busy,setBusy]=useState(false);
  useEffect(()=>{const h=window.location.hash;if(h.includes("access_token")){(async()=>{try{const{data,error}=await supabase.auth.getSession();if(!error&&data?.session?.user){onAuth(data.session.user);window.history.replaceState({},document.title,window.location.pathname);}}catch(e){console.error(e);}})();}},[onAuth]);
  const submit=async()=>{setErr("");if(!email.includes("@"))return setErr("Enter a valid email.");if(pw.length<6)return setErr("Password must be 6+ characters.");setBusy(true);try{if(mode==="signup"){const{error}=await supabase.auth.signUp({email,password:pw});if(error){setBusy(false);return setErr(error.message);}alert("Check your email to verify, then log in.");}else{const{data,error}=await supabase.auth.signInWithPassword({email,password:pw});if(error){setBusy(false);return setErr(error.message);}onAuth(data.user);}}catch(e){setErr("Something went wrong.");}setBusy(false);};
  return <div className="login-wrap"><div className="login-bg"/><div className="login-card"><div className="brand-logo"><LogoIcon size={32}/></div><div className="brand"><span>THE GUN SHED</span></div><p className="tagline">Private firearms inventory & range management</p><div className="seg"><button className={mode==="login"?"on":""} onClick={()=>{setMode("login");setErr("");}}>Log In</button><button className={mode==="signup"?"on":""} onClick={()=>{setMode("signup");setErr("");}}>Sign Up</button></div><label className="fld"><span>Email</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></label><label className="fld"><span>Password</span><input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></label>{err&&<div className="err"><AlertTriangle size={14}/> {err}</div>}<button className="primary big" onClick={submit} disabled={busy}>{busy?"Working…":mode==="signup"?"Create Account":"Log In"}</button><div className="note"><Lock size={12}/><span>Protected by Row Level Security.</span></div></div></div>;
}

/* ── Dashboard ─────────────────────────────────────── */
function Dashboard({data,go}){
  const firearms=data.firearms||[];
  const stats=[
    {icon:Target,label:"Firearms",value:firearms.filter(f=>!f.for_sale).length,color:"var(--accent)",action:"firearms"},
    {icon:MapPin,label:"Range Visits",value:(data.rangelog||[]).length,color:"var(--green)",action:"rangelog"},
    {icon:Package,label:"Attachments",value:(data.accessories||[]).length,color:"var(--gold)",action:"attachments"},
    {icon:Boxes,label:"Ammo Types",value:(data.ammo||[]).length,color:"var(--gold)",action:"ammunition"},
  ];
  return <div className="tab"><div className="dashboard-welcome"><h2>Welcome back! 🎯</h2><p>Your firearms are secure. Let's keep them in top shape.</p></div><div className="dashboard-grid">{stats.map(s=><Stat key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.color} onClick={()=>go(s.action)}/>)}</div></div>;
}

/* ── Firearms ──────────────────────────────────────── */
/* DB cols: id uuid, user_id uuid, nickname text, manufacturer text, model text, serial text,
   caliber text, type text, acquired date, value numeric, notes text, photo_path text,
   current_value numeric, for_sale bool, for_sale_listed_at date, sold bool, sold_at date,
   sold_price numeric, last_cleaned date, last_oiled date, last_torn_down date,
   last_safe_audit date, last_optic_check date, last_holster_check date,
   has_carry_holster bool, damaged bool */
function Firearms({data,setData,userId}){
  const EMPTY={nickname:"",manufacturer:"",model:"",serial:"",caliber:"",type:"",acquired:today(),value:0,current_value:0,notes:"",photo_path:""};
  const[editId,setEditId]=useState(null);
  const[form,setForm]=useState({...EMPTY});
  const firearms=(data.firearms||[]).filter(f=>!f.for_sale);
  const table=useTable(firearms,["nickname","manufacturer","model","serial","caliber"],"manufacturer");

  const closeModal=()=>{setEditId(null);setForm({...EMPTY});};
  const openNew=()=>{setForm({...EMPTY});setEditId("new");};
  const openEdit=(f)=>{setForm({nickname:f.nickname||"",manufacturer:f.manufacturer||"",model:f.model||"",serial:f.serial||"",caliber:f.caliber||"",type:f.type||"",acquired:f.acquired||"",value:f.value||0,current_value:f.current_value||0,notes:f.notes||"",photo_path:f.photo_path||""});setEditId(f.id);};

  const save=async()=>{
    try{
      const rec={nickname:form.nickname,manufacturer:form.manufacturer,model:form.model,serial:form.serial,caliber:form.caliber,type:form.type,acquired:form.acquired||null,value:form.value||0,current_value:form.current_value||0,notes:form.notes,photo_path:form.photo_path,user_id:userId};
      let fid=editId;
      if(editId&&editId!=="new"){
        const{error}=await supabase.from("firearms").update(rec).eq("id",editId);
        if(error) throw error;
      }else{
        const{data:ins,error}=await supabase.from("firearms").insert([rec]).select();
        if(error) throw error;
        fid=ins[0].id;
      }
      const{data:d}=await supabase.from("firearms").select("*");
      setData(prev=>({...prev,firearms:d||[]}));
      setEditId(fid);
      alert("Firearm saved!");
    }catch(e){alert("Save failed: "+e.message);}
  };

  const del=async(id)=>{if(!confirm("Delete this firearm?"))return;await supabase.from("firearms").delete().eq("id",id);setData(prev=>({...prev,firearms:(prev.firearms||[]).filter(f=>f.id!==id)}));};
  const moveToSale=async(id)=>{await supabase.from("firearms").update({for_sale:true,for_sale_listed_at:today()}).eq("id",id);setData(prev=>({...prev,firearms:(prev.firearms||[]).map(f=>f.id===id?{...f,for_sale:true,for_sale_listed_at:today()}:f)}));};

  const uploadPhoto=async(file)=>{
    if(!file||editId==="new")return;
    const err=validateImage(file);if(err){alert(err);return;}
    try{
      const path=`${userId}/firearms/${editId}/${uid()}.${file.name.split(".").pop()}`;
      const{error}=await supabase.storage.from("firearm-photos").upload(path,file,{upsert:true});
      if(error) throw error;
      const{data:{publicUrl}}=supabase.storage.from("firearm-photos").getPublicUrl(path);
      await supabase.from("firearms").update({photo_path:publicUrl}).eq("id",editId);
      setForm(prev=>({...prev,photo_path:publicUrl}));
      setData(prev=>({...prev,firearms:(prev.firearms||[]).map(f=>f.id===editId?{...f,photo_path:publicUrl}:f)}));
      alert("Photo uploaded!");
    }catch(e){alert("Upload failed: "+e.message);}
  };

  return <div className="tab">
    <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{key:"manufacturer",label:"Manufacturer"},{key:"acquired",label:"Acquired"},{key:"value",label:"Value"}]} placeholder="Search firearms..." addLabel="Add Firearm" onAdd={openNew}/>
    {table.view.length===0?<Empty icon={Target} label="No Firearms" hint="Add your first firearm."/>:
    <div className="card-grid">{table.view.map(f=><div key={f.id} className="firearm-card">
      {f.photo_path&&<img src={f.photo_path} alt="" style={{width:"100%",height:150,objectFit:"cover",borderRadius:8,marginBottom:10}} onError={e=>{e.target.style.display="none";}}/>}
      <div className="card-head"><div><strong>{f.nickname||f.manufacturer}</strong><span className="dim">{f.model}</span></div>
        <PersistentMenu items={[{label:"Edit",onClick:()=>openEdit(f)},{label:"Move to For Sale",onClick:()=>moveToSale(f.id),icon:Tag},{label:"Delete",onClick:()=>del(f.id),danger:true,icon:Trash2}]}/></div>
      <div className="card-body"><span><strong>{f.caliber}</strong> {f.type}</span><span className="dim">SN: {f.serial||"—"}</span><span className="dim">Acquired: {f.acquired||"—"}</span></div>
      <div className="card-foot"><span>{money(f.current_value||f.value)}</span></div>
    </div>)}</div>}
    {editId&&<Modal title={editId==="new"?"Add Firearm":"Edit Firearm"} onClose={closeModal}>
      <Field label="Nickname"><input value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})}/></Field>
      <Field label="Manufacturer"><select value={form.manufacturer} onChange={e=>setForm({...form,manufacturer:e.target.value})}><option value="">Select...</option>{MANUFACTURERS.map(m=><option key={m}>{m}</option>)}</select></Field>
      <Field label="Model"><input value={form.model} onChange={e=>setForm({...form,model:e.target.value})}/></Field>
      <Field label="Caliber"><select value={form.caliber} onChange={e=>setForm({...form,caliber:e.target.value})}><option value="">Select...</option>{CALIBERS.map(c=><option key={c}>{c}</option>)}</select></Field>
      <Field label="Type"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="">Select...</option>{FIREARM_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Serial"><input value={form.serial} onChange={e=>setForm({...form,serial:e.target.value})}/></Field>
      <Field label="Acquired"><input type="date" value={form.acquired} onChange={e=>setForm({...form,acquired:e.target.value})}/></Field>
      <Field label="Value"><input type="number" value={form.value} onChange={e=>setForm({...form,value:parseFloat(e.target.value)||0})}/></Field>
      <Field label="Current Value"><input type="number" value={form.current_value} onChange={e=>setForm({...form,current_value:parseFloat(e.target.value)||0})}/></Field>
      {editId!=="new"&&<Field label="Photo"><input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&uploadPhoto(e.target.files[0])}/></Field>}
      {editId==="new"&&<p style={{fontSize:11,color:"var(--dim)",marginBottom:12}}>Save first, then you can upload a photo.</p>}
      <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{minHeight:80}}/></Field>
      <div style={{display:"flex",gap:8}}><button className="primary" onClick={save} style={{flex:1}}>Save</button><button className="ghost" onClick={closeModal}>Close</button></div>
    </Modal>}
  </div>;
}

/* ── Attachments (accessories table) ───────────────── */
/* DB cols: id uuid, user_id uuid, name text, type text, brand text, quantity int,
   assigned_to text, value numeric, notes text, for_sale bool, for_sale_listed_at date,
   sold bool, sold_at date, sold_price numeric, photo_path text */
function Attachments({data,setData,userId}){
  const EMPTY={name:"",type:"",brand:"",quantity:0,assigned_to:"",value:0,notes:""};
  const[editId,setEditId]=useState(null);const[form,setForm]=useState({...EMPTY});
  const accessories=data.accessories||[];
  const table=useTable(accessories,["name","brand","assigned_to","type"],"type");

  const save=async()=>{
    try{
      const rec={name:form.name,type:form.type,brand:form.brand,quantity:form.quantity||0,assigned_to:form.assigned_to,value:form.value||0,notes:form.notes,user_id:userId};
      if(editId&&editId!=="new"){const{error}=await supabase.from("accessories").update(rec).eq("id",editId);if(error)throw error;}
      else{const{error}=await supabase.from("accessories").insert([rec]).select();if(error)throw error;}
      const{data:d}=await supabase.from("accessories").select("*");
      setData(prev=>({...prev,accessories:d||[]}));setEditId(null);setForm({...EMPTY});alert("Saved!");
    }catch(e){alert("Save failed: "+e.message);}
  };
  const del=async(id)=>{if(!confirm("Delete?"))return;await supabase.from("accessories").delete().eq("id",id);setData(prev=>({...prev,accessories:(prev.accessories||[]).filter(a=>a.id!==id)}));};

  return <div className="tab">
    <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{key:"type",label:"Type"},{key:"brand",label:"Brand"},{key:"value",label:"Value"}]} placeholder="Search attachments..." addLabel="Add Attachment" onAdd={()=>{setForm({...EMPTY});setEditId("new");}}/>
    {table.view.length===0?<Empty icon={Package} label="No Attachments" hint="Add your first attachment."/>:
    <div className="card-grid">{table.view.map(a=><div key={a.id} className="addon-card">
      <div className="card-head"><div><strong>{a.name}</strong><span className="dim">{a.type}</span></div>
        <PersistentMenu items={[{label:"Edit",onClick:()=>{setForm(a);setEditId(a.id);}},{label:"Delete",onClick:()=>del(a.id),danger:true,icon:Trash2}]}/></div>
      <div className="card-body"><span>{a.brand||"—"}</span><span className="dim">Qty: {a.quantity||0}</span><span className="dim">Assigned: {a.assigned_to||"—"}</span></div>
      <div className="card-foot"><span>{money(a.value)}</span></div>
    </div>)}</div>}
    {editId&&<Modal title={editId==="new"?"Add Attachment":"Edit Attachment"} onClose={()=>setEditId(null)}>
      <Field label="Type"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="">Select...</option>{ATTACHMENT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Brand"><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></Field>
      <Field label="Quantity"><input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||0})}/></Field>
      <Field label="Value"><input type="number" value={form.value} onChange={e=>setForm({...form,value:parseFloat(e.target.value)||0})}/></Field>
      <Field label="Assigned To"><input value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}/></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{minHeight:80}}/></Field>
      <button className="primary" onClick={save} style={{width:"100%"}}>Save</button>
    </Modal>}
  </div>;
}

/* ── Ammunition ────────────────────────────────────── */
/* DB cols: id uuid, user_id uuid, caliber text, type text, brand text, grain text,
   quantity int, location text, value numeric */
function Ammunition({data,setData,userId}){
  const EMPTY={caliber:"",type:"",brand:"",grain:"",quantity:0,location:"",value:0};
  const[editId,setEditId]=useState(null);const[form,setForm]=useState({...EMPTY});
  const ammo=data.ammo||[];
  const table=useTable(ammo,["caliber","brand","location","type"],"caliber");

  const save=async()=>{
    try{
      const rec={caliber:form.caliber,type:form.type,brand:form.brand,grain:form.grain,quantity:form.quantity||0,location:form.location,value:form.value||0,user_id:userId};
      if(editId&&editId!=="new"){const{error}=await supabase.from("ammo").update(rec).eq("id",editId);if(error)throw error;}
      else{const{error}=await supabase.from("ammo").insert([rec]).select();if(error)throw error;}
      const{data:d}=await supabase.from("ammo").select("*");
      setData(prev=>({...prev,ammo:d||[]}));setEditId(null);setForm({...EMPTY});alert("Saved!");
    }catch(e){alert("Save failed: "+e.message);}
  };
  const del=async(id)=>{if(!confirm("Delete?"))return;await supabase.from("ammo").delete().eq("id",id);setData(prev=>({...prev,ammo:(prev.ammo||[]).filter(a=>a.id!==id)}));};

  return <div className="tab">
    <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{key:"caliber",label:"Caliber"},{key:"quantity",label:"Quantity"}]} placeholder="Search ammo..." addLabel="Add Ammo" onAdd={()=>{setForm({...EMPTY});setEditId("new");}}/>
    {table.view.length===0?<Empty icon={Boxes} label="No Ammunition" hint="Log your ammo."/>:
    <div className="card-grid">{table.view.map(a=><div key={a.id} className="ammo-card">
      <div className="card-head"><div><strong>{a.caliber}</strong><span className="dim">{a.type}</span></div>
        <PersistentMenu items={[{label:"Edit",onClick:()=>{setForm(a);setEditId(a.id);}},{label:"Delete",onClick:()=>del(a.id),danger:true,icon:Trash2}]}/></div>
      <div className="card-body"><span className="dim">{a.brand||"—"} {a.grain||""}</span><span className="dim">{a.quantity||0} rounds — {a.location||"—"}</span></div>
      <div className="card-foot"><span>{money(a.value)}</span></div>
    </div>)}</div>}
    {editId&&<Modal title={editId==="new"?"Add Ammo":"Edit Ammo"} onClose={()=>setEditId(null)}>
      <Field label="Caliber"><select value={form.caliber} onChange={e=>setForm({...form,caliber:e.target.value})}><option value="">Select...</option>{CALIBERS.map(c=><option key={c}>{c}</option>)}</select></Field>
      <Field label="Type"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="">Select...</option>{AMMO_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Brand"><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></Field>
      <Field label="Grain"><input value={form.grain} onChange={e=>setForm({...form,grain:e.target.value})}/></Field>
      <Field label="Quantity"><input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||0})}/></Field>
      <Field label="Location"><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></Field>
      <Field label="Value"><input type="number" value={form.value} onChange={e=>setForm({...form,value:parseFloat(e.target.value)||0})}/></Field>
      <button className="primary" onClick={save} style={{width:"100%"}}>Save</button>
    </Modal>}
  </div>;
}

/* ── Up-Keep ───────────────────────────────────────── */
function UpKeep({data,setData}){
  const firearms=data.firearms||[];
  const items=[
    {key:"last_cleaned",label:"Cleaning",freq:30,icon:Wrench,list:firearms.filter(f=>!f.last_cleaned||daysBetween(f.last_cleaned,today())>30)},
    {key:"last_oiled",label:"Oiling",freq:180,icon:Droplet,list:firearms.filter(f=>!f.last_oiled||daysBetween(f.last_oiled,today())>180)},
    {key:"last_torn_down",label:"Tear Down",freq:365,icon:Hammer,list:firearms.filter(f=>!f.last_torn_down||daysBetween(f.last_torn_down,today())>365)},
    {key:"last_optic_check",label:"Optic Check",freq:180,icon:Eye,list:firearms.filter(f=>!f.last_optic_check||daysBetween(f.last_optic_check,today())>180)},
    {key:"last_holster_check",label:"Holster Check",freq:30,icon:Hand,list:firearms.filter(f=>f.has_carry_holster&&(!f.last_holster_check||daysBetween(f.last_holster_check,today())>30))},
  ].sort((a,b)=>b.list.length-a.list.length);

  const reset=async(gunId,key)=>{try{await supabase.from("firearms").update({[key]:today()}).eq("id",gunId);setData(prev=>({...prev,firearms:(prev.firearms||[]).map(f=>f.id===gunId?{...f,[key]:today()}:f)}));}catch(e){alert(e.message);}};

  return <div className="tab">{items.map(it=><div key={it.key} style={{marginBottom:24}}>
    <h3 style={{fontFamily:"'Oswald',sans-serif",fontSize:16,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><it.icon size={18} style={{color:"var(--accent)"}}/> {it.label} <span style={{color:"var(--faint)",fontSize:12,marginLeft:"auto"}}>({it.list.length} due)</span></h3>
    {it.list.length===0?<div style={{padding:20,color:"var(--dim)",textAlign:"center",background:"var(--panel)",borderRadius:"var(--radius)",border:"1px dashed var(--line)"}}>✓ All up to date</div>:
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>{it.list.map(f=><div key={f.id} style={{background:"var(--panel)",border:"1px solid var(--line)",borderRadius:"var(--radius)",padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}><strong style={{fontSize:14}}>{f.nickname||f.manufacturer} {f.model}</strong><button className="primary small" onClick={()=>reset(f.id,it.key)}><Check size={12}/> Clear</button></div>
      <span style={{display:"block",fontSize:12,color:"var(--dim)"}}>Last: {f[it.key]?daysBetween(f[it.key],today())+" days ago":"Never"}</span>
    </div>)}</div>}
  </div>)}</div>;
}

/* ── Range Log ─────────────────────────────────────── */
/* DB cols: id uuid, user_id uuid, firearm_id uuid, visit_date date, range_name text,
   rounds int, notes text, photo_paths array, loadout_id uuid */
function RangeLog({data,setData,userId}){
  const EMPTY={firearm_id:"",visit_date:today(),range_name:"",rounds:0,notes:"",loadout_id:""};
  const[editId,setEditId]=useState(null);const[form,setForm]=useState({...EMPTY});
  const logs=data.rangelog||[];
  const table=useTable(logs,["range_name"],"visit_date");
  const savedRanges=[...new Set(logs.map(l=>l.range_name).filter(Boolean))].slice(0,5);

  const save=async()=>{
    try{
      const rec={firearm_id:form.firearm_id||null,visit_date:form.visit_date,range_name:form.range_name,rounds:form.rounds||0,notes:form.notes,loadout_id:form.loadout_id||null,user_id:userId};
      if(editId&&editId!=="new"){const{error}=await supabase.from("range_log").update(rec).eq("id",editId);if(error)throw error;}
      else{const{error}=await supabase.from("range_log").insert([rec]).select();if(error)throw error;}
      const{data:d}=await supabase.from("range_log").select("*");
      setData(prev=>({...prev,rangelog:d||[]}));setEditId(null);setForm({...EMPTY});alert("Saved!");
    }catch(e){alert("Save failed: "+e.message);}
  };
  const del=async(id)=>{if(!confirm("Delete?"))return;await supabase.from("range_log").delete().eq("id",id);setData(prev=>({...prev,rangelog:(prev.rangelog||[]).filter(l=>l.id!==id)}));};

  return <div className="tab">
    <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{key:"visit_date",label:"Date"},{key:"range_name",label:"Range"}]} placeholder="Search range logs..." addLabel="Log Visit" onAdd={()=>{setForm({...EMPTY});setEditId("new");}}/>
    {table.view.length===0?<Empty icon={MapPin} label="No Range Logs" hint="Log your first visit."/>:
    <div className="card-grid">{table.view.map(l=>{const gun=(data.firearms||[]).find(f=>f.id===l.firearm_id);return <div key={l.id} className="log-card">
      <div className="card-head"><div><strong>{gun?.nickname||gun?.manufacturer||"—"}</strong><span className="dim">{l.visit_date}</span></div>
        <PersistentMenu items={[{label:"Edit",onClick:()=>{setForm(l);setEditId(l.id);}},{label:"Delete",onClick:()=>del(l.id),danger:true,icon:Trash2}]}/></div>
      <div className="card-body"><span><strong>{l.rounds||0}</strong> rounds</span><span className="dim">{l.range_name||"—"}</span></div>
    </div>;})}</div>}
    {editId&&<Modal title={editId==="new"?"Log Range Visit":"Edit Log"} onClose={()=>setEditId(null)}>
      <Field label="Firearm"><select value={form.firearm_id} onChange={e=>setForm({...form,firearm_id:e.target.value})}><option value="">Select...</option>{(data.firearms||[]).filter(f=>!f.for_sale).map(f=><option key={f.id} value={f.id}>{f.nickname||f.manufacturer} {f.model}</option>)}</select></Field>
      <Field label="Date"><input type="date" value={form.visit_date} onChange={e=>setForm({...form,visit_date:e.target.value})}/></Field>
      <Field label="Range Name"><input list="saved-ranges" value={form.range_name} onChange={e=>setForm({...form,range_name:e.target.value})}/><datalist id="saved-ranges">{savedRanges.map(r=><option key={r} value={r}/>)}</datalist></Field>
      <Field label="Rounds"><input type="number" value={form.rounds} onChange={e=>setForm({...form,rounds:parseInt(e.target.value)||0})}/></Field>
      <Field label="Load Out"><select value={form.loadout_id||""} onChange={e=>setForm({...form,loadout_id:e.target.value})}><option value="">None</option>{(data.loadouts||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{minHeight:80}}/></Field>
      <button className="primary" onClick={save} style={{width:"100%"}}>Save</button>
    </Modal>}
  </div>;
}

/* ── Load Out ──────────────────────────────────────── */
/* DB cols: id uuid, user_id uuid, name text NOT NULL, favorite bool, items jsonb NOT NULL,
   notes text, use_count int */
function LoadOut({data,setData,userId}){
  const EMPTY={name:"",items:[],favorite:false,notes:"",use_count:0};
  const[editId,setEditId]=useState(null);const[form,setForm]=useState({...EMPTY});
  const loadouts=data.loadouts||[];

  const save=async()=>{
    try{
      if(!form.name.trim()){alert("Name is required.");return;}
      const rec={name:form.name,items:form.items||[],favorite:form.favorite||false,notes:form.notes,use_count:form.use_count||0,user_id:userId};
      if(editId&&editId!=="new"){const{error}=await supabase.from("loadouts").update(rec).eq("id",editId);if(error)throw error;}
      else{const{error}=await supabase.from("loadouts").insert([rec]).select();if(error)throw error;}
      const{data:d}=await supabase.from("loadouts").select("*");
      setData(prev=>({...prev,loadouts:d||[]}));setEditId(null);setForm({...EMPTY});alert("Saved!");
    }catch(e){alert("Save failed: "+e.message);}
  };
  const del=async(id)=>{if(!confirm("Delete?"))return;await supabase.from("loadouts").delete().eq("id",id);setData(prev=>({...prev,loadouts:(prev.loadouts||[]).filter(l=>l.id!==id)}));};

  return <div className="tab">
    <button className="primary" onClick={()=>{setForm({...EMPTY});setEditId("new");}} style={{marginBottom:16}}><Plus size={16}/> New Loadout</button>
    {loadouts.length===0?<Empty icon={Backpack} label="No Loadouts" hint="Create a range loadout."/>:
    <div className="card-grid">{loadouts.map(l=><div key={l.id} className="loadout-card">
      <div className="card-head"><div><strong>{l.name}</strong>{l.favorite&&<Star size={14} style={{fill:"var(--gold)",color:"var(--gold)"}}/>}</div>
        <PersistentMenu items={[{label:"Edit",onClick:()=>{setForm(l);setEditId(l.id);}},{label:"Delete",onClick:()=>del(l.id),danger:true,icon:Trash2}]}/></div>
      <div className="card-body"><span className="dim">{(l.items||[]).length} items</span><span className="dim">Used {l.use_count||0}x</span></div>
    </div>)}</div>}
    {editId&&<Modal title={editId==="new"?"New Loadout":"Edit Loadout"} onClose={()=>setEditId(null)}>
      <Field label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Select Firearms"><div style={{display:"grid",gap:8,maxHeight:200,overflowY:"auto"}}>{(data.firearms||[]).filter(f=>!f.for_sale).map(f=><label key={f.id} style={{display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={(form.items||[]).includes(f.id)} onChange={e=>setForm({...form,items:e.target.checked?[...(form.items||[]),f.id]:(form.items||[]).filter(x=>x!==f.id)})}/><span>{f.nickname||f.manufacturer} {f.model}</span></label>)}</div></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{minHeight:60}}/></Field>
      <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><input type="checkbox" checked={form.favorite} onChange={e=>setForm({...form,favorite:e.target.checked})}/> Favorite</label>
      <button className="primary" onClick={save} style={{width:"100%"}}>Save</button>
    </Modal>}
  </div>;
}

/* ── Supplies ──────────────────────────────────────── */
/* DB cols: id uuid, user_id uuid, name text NOT NULL, category text, notes text,
   est_cost numeric, purchased bool, purchased_at date */
function SuppliesNeeded({data,setData,userId}){
  const EMPTY={name:"",category:"",notes:"",est_cost:0,purchased:false,purchased_at:null};
  const[editId,setEditId]=useState(null);const[form,setForm]=useState({...EMPTY});
  const supplies=data.supplies||[];
  const table=useTable(supplies,["name","category"],"category");

  const save=async()=>{
    try{
      if(!form.name.trim()){alert("Name is required.");return;}
      const rec={name:form.name,category:form.category,notes:form.notes,est_cost:form.est_cost||0,purchased:form.purchased||false,purchased_at:form.purchased_at||null,user_id:userId};
      if(editId&&editId!=="new"){const{error}=await supabase.from("supplies").update(rec).eq("id",editId);if(error)throw error;}
      else{const{error}=await supabase.from("supplies").insert([rec]).select();if(error)throw error;}
      const{data:d}=await supabase.from("supplies").select("*");
      setData(prev=>({...prev,supplies:d||[]}));setEditId(null);setForm({...EMPTY});alert("Saved!");
    }catch(e){alert("Save failed: "+e.message);}
  };
  const del=async(id)=>{if(!confirm("Delete?"))return;await supabase.from("supplies").delete().eq("id",id);setData(prev=>({...prev,supplies:(prev.supplies||[]).filter(s=>s.id!==id)}));};
  const toggle=async(id)=>{const s=supplies.find(x=>x.id===id);const pa=!s.purchased?today():null;await supabase.from("supplies").update({purchased:!s.purchased,purchased_at:pa}).eq("id",id);setData(prev=>({...prev,supplies:(prev.supplies||[]).map(x=>x.id===id?{...x,purchased:!x.purchased,purchased_at:pa}:x)}));};

  return <div className="tab">
    <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{key:"category",label:"Category"},{key:"name",label:"Name"}]} placeholder="Search supplies..." addLabel="Add Supply" onAdd={()=>{setForm({...EMPTY});setEditId("new");}}/>
    {table.view.length===0?<Empty icon={ShoppingCart} label="No Supplies" hint="Add supplies."/>:
    <div style={{display:"grid",gap:8}}>{table.view.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:12,background:s.purchased?"var(--panel2)":"var(--panel)",border:"1px solid var(--line)",borderRadius:"var(--radius)",opacity:s.purchased?0.6:1}}>
      <input type="checkbox" checked={s.purchased} onChange={()=>toggle(s.id)}/>
      <div style={{flex:1}}><strong>{s.name}</strong><span style={{display:"block",fontSize:11,color:"var(--dim)"}}>{s.category}</span></div>
      <span style={{color:"var(--dim)",fontSize:12}}>{money(s.est_cost)}</span>
      <PersistentMenu items={[{label:"Edit",onClick:()=>{setForm(s);setEditId(s.id);}},{label:"Delete",onClick:()=>del(s.id),danger:true,icon:Trash2}]}/>
    </div>)}</div>}
    {editId&&<Modal title={editId==="new"?"Add Supply":"Edit Supply"} onClose={()=>setEditId(null)}>
      <Field label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Category"><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="">Select...</option>{SUPPLY_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
      <Field label="Estimated Cost"><input type="number" value={form.est_cost} onChange={e=>setForm({...form,est_cost:parseFloat(e.target.value)||0})}/></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{minHeight:60}}/></Field>
      <button className="primary" onClick={save} style={{width:"100%"}}>Save</button>
    </Modal>}
  </div>;
}

/* ── For Sale ──────────────────────────────────────── */
function ForSale({data}){
  const firearms=(data.firearms||[]).filter(f=>f.for_sale);
  const accessories=(data.accessories||[]).filter(a=>a.for_sale);
  return <div className="tab">
    <h3 style={{marginBottom:16,fontFamily:"'Oswald',sans-serif",fontSize:16}}>Firearms for Sale</h3>
    {firearms.length===0?<Empty icon={Target} label="None Listed" hint="Move firearms here from Firearms tab."/>:
    <div className="card-grid">{firearms.map(f=><div key={f.id} className="sale-card"><div className="card-head"><div><strong>{f.nickname||f.manufacturer}</strong><span className="dim">{f.model}</span></div></div><div className="card-body"><span>{f.caliber} {f.type}</span><span className="dim">Asking: {money(f.current_value||f.value)}</span></div></div>)}</div>}
    <h3 style={{marginTop:24,marginBottom:16,fontFamily:"'Oswald',sans-serif",fontSize:16}}>Attachments for Sale</h3>
    {accessories.length===0?<Empty icon={Package} label="None Listed" hint="Move attachments here from Attachments tab."/>:
    <div className="card-grid">{accessories.map(a=><div key={a.id} className="sale-card"><div className="card-head"><div><strong>{a.name}</strong><span className="dim">{a.type}</span></div></div><div className="card-body"><span>{a.brand||"—"}</span><span className="dim">Asking: {money(a.value)}</span></div></div>)}</div>}
  </div>;
}

/* ── Support ───────────────────────────────────────── */
function Support(){
  const docs=[
    {cat:"Getting Started",items:[{t:"Adding a Firearm",c:"Go to the Firearms tab and click Add Firearm. Fill in manufacturer, model, caliber, and type. Save first, then upload a photo."},{t:"Dashboard",c:"Shows stats and quick links. Click any stat to jump to that section."}]},
    {cat:"Inventory",items:[{t:"Firearms",c:"Track all your firearms with value, serial, caliber. Move to For Sale when ready."},{t:"Attachments",c:"Scopes, holsters, lights. Assign to firearms."},{t:"Ammunition",c:"Track caliber, brand, grain, quantity, and storage location."}]},
    {cat:"Maintenance",items:[{t:"Up-Keep",c:"Tracks cleaning (30d), oiling (180d), tear-downs (365d), optic checks (180d), holster checks (30d). Click Clear when done."},{t:"Safe Audit",c:"3-month rolling timer for humidity and dehumidification checks."}]},
    {cat:"Range",items:[{t:"Range Log",c:"Log visits with firearm, range name, rounds fired. Recent range names auto-suggest."},{t:"Load Outs",c:"Pre-built range kits. Select firearms to bring. Track usage count."}]},
  ];
  return <div className="tab"><div style={{display:"grid",gap:24}}>{docs.map(d=><div key={d.cat}><h3 style={{fontFamily:"'Oswald',sans-serif",fontSize:16,marginBottom:12,color:"var(--accent)"}}>{d.cat}</h3><div style={{display:"grid",gap:8}}>{d.items.map((it,i)=><details key={i} style={{background:"var(--panel)",border:"1px solid var(--line)",borderRadius:"var(--radius)"}}><summary style={{padding:"12px 14px",cursor:"pointer",fontWeight:500}}><ChevronRight size={14}/> {it.t}</summary><div style={{padding:"12px 14px",borderTop:"1px solid var(--line)",color:"var(--dim)",lineHeight:1.6,fontSize:13}}>{it.c}</div></details>)}</div></div>)}</div></div>;
}

/* ── Admin ──────────────────────────────────────────── */
function Admin({currentUser}){
  const isSuperAdmin=currentUser?.email===SUPER_ADMIN_EMAIL;
  const[users,setUsers]=useState([]);const[loading,setLoading]=useState(true);const[query,setQuery]=useState("");
  useEffect(()=>{(async()=>{const{data}=await supabase.from("profiles").select("*").order("created_at",{ascending:false});setUsers(data||[]);setLoading(false);})();},[]);
  const filtered=users.filter(u=>!query||(u.email||"").toLowerCase().includes(query.toLowerCase()));
  return <div className="tab"><div className="admin-section"><h3>Users ({users.length})</h3><div className="search-big" style={{marginBottom:16}}><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search email…"/></div>
    {loading?<p>Loading…</p>:<table className="grid-table"><thead><tr><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td><strong>{u.email}</strong>{u.email===currentUser.email&&<span className="pill" style={{marginLeft:8}}>You</span>}</td><td><span className={`role-pill ${u.role}`}>{u.role}</span></td><td className="mono">{u.created_at?.slice(0,10)}</td></tr>)}</tbody></table>}
  </div></div>;
}

/* ── Change Log ────────────────────────────────────── */
function ChangeLog(){
  return <div className="tab"><div className="changelog">{CHANGELOG.map(rel=><div className="release" key={rel.version}>
    <div className="release-rail"><div className={`release-dot ${rel.tag==="current"?"cur":""}`}/></div>
    <div className="release-body"><div className="release-head"><span className="ver">v{rel.version}</span><h3>{rel.title}</h3>{rel.tag==="current"&&<span className="cur-badge">Current</span>}<span className="rel-date">{rel.date}</span></div>
    <ul className="change-list">{rel.changes.map((c,i)=><li key={i}><span className={`ct ct-${c.type}`}>{c.type}</span><span>{c.text}</span></li>)}</ul></div>
  </div>)}</div></div>;
}

/* ── Gemini Chatbot ────────────────────────────────── */
function GeminiChatbot(){
  const[open,setOpen]=useState(false);
  const[msgs,setMsgs]=useState([{role:"assistant",text:"Hi! I'm the Gun Shed assistant. Ask me anything."}]);
  const[input,setInput]=useState("");const[loading,setLoading]=useState(false);
  const send=async()=>{
    if(!input.trim()||!GEMINI_API_KEY)return;
    setMsgs(p=>[...p,{role:"user",text:input}]);setInput("");setLoading(true);
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:input}]}]})});
      const d=await r.json();
      setMsgs(p=>[...p,{role:"assistant",text:d.candidates?.[0]?.content?.parts?.[0]?.text||"No response."}]);
    }catch(e){setMsgs(p=>[...p,{role:"assistant",text:"Error: "+e.message}]);}finally{setLoading(false);}
  };
  return <><button className="chatbot-fab" onClick={()=>setOpen(!open)}><MessageCircle size={20}/></button>
    {open&&<div className="chatbot-modal"><div className="chatbot-head"><strong>Gun Shed AI</strong><button className="icon-btn" onClick={()=>setOpen(false)}><X size={16}/></button></div>
    <div className="chatbot-messages">{msgs.map((m,i)=><div key={i} className={`message ${m.role}`}><span>{m.text}</span></div>)}{loading&&<div className="message assistant"><span>Thinking...</span></div>}</div>
    <div className="chatbot-input"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything..."/><button className="primary small" onClick={send} disabled={loading}><Send size={14}/></button></div></div>}</>;
}

/* ── Main App ──────────────────────────────────────── */
export default function App(){
  const[user,setUser]=useState(null);const[profile,setProfile]=useState(null);const[authChecked,setAuthChecked]=useState(false);
  const[tab,setTab]=useState("dashboard");const[mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const[data,setData]=useState({firearms:[],rangelog:[],accessories:[],ammo:[],loadouts:[],supplies:[]});
  const[loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const{data:{session}}=await supabase.auth.getSession();
    if(session?.user){setUser(session.user);await loadProfile(session.user.id);await loadData();}
    setAuthChecked(true);setLoading(false);
  })();},[]);

  const loadProfile=async(userId)=>{try{const{data}=await supabase.from("profiles").select("*").eq("id",userId).single();setProfile(data);}catch(e){setProfile(null);}};

  const loadData=async()=>{
    try{
      const[f,r,a,am,l,s]=await Promise.all([
        supabase.from("firearms").select("*"),supabase.from("range_log").select("*"),
        supabase.from("accessories").select("*"),supabase.from("ammo").select("*"),
        supabase.from("loadouts").select("*"),supabase.from("supplies").select("*"),
      ]);
      setData({firearms:f.data||[],rangelog:r.data||[],accessories:a.data||[],ammo:am.data||[],loadouts:l.data||[],supplies:s.data||[]});
    }catch(e){console.error(e);}
  };

  const handleAuth=async(u)=>{setUser(u);await loadProfile(u.id);await loadData();};
  const logout=async()=>{await supabase.auth.signOut();setUser(null);setProfile(null);setData({firearms:[],rangelog:[],accessories:[],ammo:[],loadouts:[],supplies:[]});setTab("dashboard");};

  if(!authChecked)return <><Styles/><div className="boot"><Loader size={20} style={{animation:"spin 1s linear infinite"}}/> Loading…</div></>;
  if(!user)return <><Styles/><Login onAuth={handleAuth}/></>;

  const isAdmin=profile?.role==="admin";const isSuperAdmin=user?.email===SUPER_ADMIN_EMAIL;
  const NAV=[
    {key:"dashboard",label:"Dashboard",icon:LayoutDashboard},
    {key:"firearms",label:"Firearms",icon:Target},
    {key:"attachments",label:"Attachments",icon:Package},
    {key:"ammunition",label:"Ammunition",icon:Boxes},
    {key:"upkeep",label:"Up-Keep",icon:Wrench},
    {key:"rangelog",label:"Range Log",icon:MapPin},
    {key:"loadout",label:"Load Out",icon:Backpack},
    {key:"supplies",label:"Supplies Needed",icon:ShoppingCart},
    {key:"forsale",label:"For Sale",icon:Tag},
    {key:"support",label:"Support",icon:HelpCircle},
  ];
  if(isAdmin){NAV.push({key:"admin",label:"Admin",icon:Users});NAV.push({key:"changelog",label:"Change Log",icon:ScrollText});}

  return <><Styles/><div className="app">
    <aside className={`sidebar ${mobileMenuOpen?"open":""}`}>
      <div className="sidebar-top"><button className="mobile-close" onClick={()=>setMobileMenuOpen(false)}><X size={20}/></button><div className="brand-top"><LogoIcon size={20}/><span>THE GUN SHED</span></div></div>
      <nav>{NAV.map(n=><button key={n.key} className={tab===n.key?"on":""} onClick={()=>{setTab(n.key);setMobileMenuOpen(false);}}><n.icon size={17}/><span>{n.label}</span></button>)}</nav>
      <div className="side-foot"><div className="user"><div className="avatar">{user?.email?.[0]?.toUpperCase()}</div><div className="user-info"><span className="email">{user?.email}</span>{isAdmin&&<span className="role-pill admin small">{isSuperAdmin?"super admin":"admin"}</span>}</div><button className="icon-btn" onClick={logout} title="Log out"><LogOut size={15}/></button></div><div className="ver-foot">v{APP_VERSION}</div></div>
    </aside>
    <main className="main">
      <div className="topbar"><button className="mobile-menu-btn" onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}><Menu size={20}/></button><h1>{NAV.find(n=>n.key===tab)?.label}</h1></div>
      <div className="content">
        {tab==="dashboard"&&<Dashboard data={data} go={setTab}/>}
        {tab==="firearms"&&<Firearms data={data} setData={setData} userId={user.id}/>}
        {tab==="attachments"&&<Attachments data={data} setData={setData} userId={user.id}/>}
        {tab==="ammunition"&&<Ammunition data={data} setData={setData} userId={user.id}/>}
        {tab==="upkeep"&&<UpKeep data={data} setData={setData}/>}
        {tab==="rangelog"&&<RangeLog data={data} setData={setData} userId={user.id}/>}
        {tab==="loadout"&&<LoadOut data={data} setData={setData} userId={user.id}/>}
        {tab==="supplies"&&<SuppliesNeeded data={data} setData={setData} userId={user.id}/>}
        {tab==="forsale"&&<ForSale data={data}/>}
        {tab==="support"&&<Support/>}
        {tab==="admin"&&isAdmin&&<Admin currentUser={user}/>}
        {tab==="changelog"&&isAdmin&&<ChangeLog/>}
      </div>
    </main>
  </div><GeminiChatbot/></>;
}

function Styles(){return <style>{`
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo:wght@400;500;600;700&display=swap');
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
:root{--bg:#0f0e0a;--bg2:#1a1815;--panel:#232118;--panel2:#2d2820;--line:#3d372a;--line2:#4a4435;--text:#f0ebe0;--dim:#a8a494;--faint:#7d7969;--accent:#d67c3f;--accent-d:#b85f2d;--green:#5e9178;--gold:#c4a94a;--danger:#c1544f;--radius:12px}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);font-family:'Archivo',system-ui,sans-serif;color:var(--text)}
.boot{color:var(--dim);padding:40px;display:flex;align-items:center;gap:10px}
.app{display:flex;min-height:100vh}
.brand-logo{display:inline-flex;color:var(--accent)}.brand{display:flex;align-items:center;gap:10px;color:var(--accent);font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:2px;font-size:18px;margin:12px 0}.brand span{color:var(--text)}
.sidebar{width:260px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--line);padding:20px 14px;display:flex;flex-direction:column;gap:22px;position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.brand-top{display:flex;align-items:center;gap:8px;font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:1px;color:var(--accent);font-size:14px}
.sidebar nav{display:flex;flex-direction:column;gap:2px}.sidebar nav button{display:flex;align-items:center;gap:11px;padding:11px 12px;background:transparent;border:none;border-radius:8px;cursor:pointer;color:var(--dim);font-family:inherit;font-size:13px;font-weight:500;text-align:left;transition:all .15s;width:100%}
.sidebar nav button:hover{background:var(--panel);color:var(--text)}.sidebar nav button.on{background:linear-gradient(90deg,rgba(214,124,63,.2),rgba(214,124,63,.05));color:var(--text);box-shadow:inset 2px 0 0 var(--accent)}
.side-foot{margin-top:auto;display:flex;flex-direction:column;gap:10px}.user{display:flex;align-items:center;gap:10px;padding:10px;background:var(--panel);border:1px solid var(--line);border-radius:8px}
.avatar{width:32px;height:32px;border-radius:7px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:700;font-size:13px;flex-shrink:0}
.user-info{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.user .email{font-size:11px;color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ver-foot{text-align:center;font-size:10px;color:var(--faint)}
.main{flex:1;min-width:0;display:flex;flex-direction:column}.topbar{padding:18px 24px;border-bottom:1px solid var(--line);background:var(--bg2);display:flex;align-items:center;gap:14px}
.topbar h1{font-family:'Oswald',sans-serif;font-weight:600;font-size:22px;letter-spacing:.5px}.mobile-menu-btn,.mobile-close{display:none;background:transparent;border:none;color:var(--text);cursor:pointer}
.content{flex:1;padding:24px 32px 60px;overflow-y:auto}.tab{position:relative}
.dashboard-welcome{margin-bottom:24px}.dashboard-welcome h2{font-family:'Oswald',sans-serif;font-size:24px;margin-bottom:4px;color:var(--accent)}.dashboard-welcome p{color:var(--dim);font-size:14px}
.dashboard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.firearm-card,.log-card,.addon-card,.ammo-card,.sale-card,.loadout-card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:14px;transition:all .15s}
.firearm-card:hover,.log-card:hover,.addon-card:hover,.ammo-card:hover,.sale-card:hover,.loadout-card:hover{transform:translateY(-2px);border-color:var(--line2)}
.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}.card-head div{display:flex;flex-direction:column;gap:2px}.card-head strong{font-size:14px}
.card-body{display:flex;flex-direction:column;gap:4px;margin-bottom:8px;font-size:12px}.card-body .dim{color:var(--dim)}
.card-foot{display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--line);font-size:12px;color:var(--dim)}
.empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:70px 20px;color:var(--faint);text-align:center;border:1px dashed var(--line2);border-radius:var(--radius)}.empty strong{font-size:15px;color:var(--dim);font-family:'Oswald',sans-serif}
.login-wrap{min-height:100vh;display:grid;place-items:center;position:relative;padding:20px;overflow:hidden}.login-bg{position:absolute;inset:0;background:radial-gradient(700px 500px at 20% 10%,rgba(214,124,63,.08),transparent 60%),var(--bg);z-index:0}
.login-card{position:relative;z-index:1;background:var(--bg2);border:1px solid var(--line2);border-radius:16px;padding:40px 32px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.tagline{text-align:center;color:var(--dim);font-size:13px;margin-bottom:24px}
.seg{display:flex;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:3px;margin-bottom:18px}.seg button{flex:1;background:transparent;border:none;color:var(--dim);padding:8px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:all .15s}.seg button.on{background:var(--accent);color:#fff}
.fld{display:flex;flex-direction:column;gap:5px;margin-bottom:13px}.fld span{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--faint)}
.fld input,.fld select,.fld textarea{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:10px 12px;color:var(--text);font-family:inherit;font-size:13px;outline:none;transition:border-color .15s}.fld input:focus,.fld select:focus,.fld textarea:focus{border-color:var(--accent)}
.err{display:flex;align-items:center;gap:6px;background:rgba(193,84,79,.12);border:1px solid rgba(193,84,79,.35);color:#d98a84;font-size:12px;padding:8px 11px;border-radius:7px;margin-bottom:12px}
.note{display:flex;align-items:flex-start;gap:6px;color:var(--faint);font-size:11px;margin-top:16px}
.admin-section{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:20px}.admin-section h3{font-family:'Oswald',sans-serif;font-size:16px;margin-bottom:16px}
.grid-table{width:100%;border-collapse:collapse;background:var(--panel2);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.grid-table th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;color:var(--faint);padding:11px 14px;background:var(--bg2);border-bottom:1px solid var(--line)}
.grid-table td{padding:12px 14px;font-size:13px;border-bottom:1px solid var(--line);vertical-align:middle}.grid-table tr:last-child td{border-bottom:none}.grid-table tbody tr:hover{background:var(--panel)}
.mono{font-variant-numeric:tabular-nums;color:var(--dim)}.dim{color:var(--dim)}
.pill{font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;background:var(--panel2);border:1px solid var(--line2);color:var(--dim);padding:3px 8px;border-radius:20px}
.role-pill{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.6px;padding:3px 8px;border-radius:5px;font-weight:700}
.role-pill.admin{background:rgba(196,169,74,.15);color:var(--gold);border:1px solid rgba(196,169,74,.35)}.role-pill.user{background:rgba(94,145,120,.15);color:var(--green);border:1px solid rgba(94,145,120,.35)}.role-pill.small{font-size:9px;padding:1px 5px}
.modal-back{position:fixed;inset:0;background:rgba(10,9,6,.78);display:grid;place-items:center;z-index:100;padding:20px;backdrop-filter:blur(2px)}
.modal{background:var(--bg2);border:1px solid var(--line2);border-radius:14px;width:100%;max-width:560px;max-height:90vh;overflow:auto}.modal.wide{max-width:760px}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg2);z-index:5}
.modal-head h3{font-family:'Oswald',sans-serif;font-size:18px;font-weight:600}.modal-body{padding:20px}
.form-fld{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}.form-fld>span{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--faint)}
.form-fld input,.form-fld select,.form-fld textarea{background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:9px 11px;color:var(--text);font-family:inherit;font-size:13px;outline:none;transition:border-color .15s}
.form-fld input:focus,.form-fld select:focus,.form-fld textarea:focus{border-color:var(--accent)}.form-fld select option{background:var(--panel2)}.form-fld textarea{resize:vertical}
button.primary{display:inline-flex;align-items:center;gap:6px;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:9px 15px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;transition:background .15s}
button.primary:hover{background:var(--accent-d)}button.primary:disabled{opacity:.45;cursor:not-allowed}button.primary.big{width:100%;justify-content:center;padding:12px;font-size:14px;margin-top:4px}button.primary.small{padding:6px 10px;font-size:12px}
button.ghost{display:inline-flex;align-items:center;gap:6px;background:var(--panel);border:1px solid var(--line);color:var(--dim);border-radius:8px;padding:9px 13px;cursor:pointer;font-family:inherit;font-size:12px;transition:all .15s}
button.ghost:hover{color:var(--text);border-color:var(--line2)}button.ghost.small{padding:5px 8px;font-size:11px}
.icon-btn{background:var(--panel2);border:1px solid var(--line);color:var(--dim);width:30px;height:30px;border-radius:7px;cursor:pointer;display:grid;place-items:center;transition:all .15s}.icon-btn:hover{color:var(--text);border-color:var(--line2)}
.stat{display:flex;align-items:center;gap:13px;background:var(--panel);border:1px solid var(--line);border-left-width:3px;border-radius:var(--radius);padding:15px 16px;transition:all .15s;cursor:pointer}
.stat:hover{transform:translateY(-2px);border-color:var(--line2)}.stat-ico{color:var(--dim)}.stat-val{font-family:'Oswald',sans-serif;font-size:23px;font-weight:600}.stat-lbl{font-size:11px;color:var(--dim);margin-top:4px;text-transform:uppercase;letter-spacing:.6px}
.search-big{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:0 14px;flex:1;color:var(--faint)}
.search-big input{background:transparent;border:none;outline:none;color:var(--text);font-family:inherit;font-size:14px;padding:12px 0;width:100%}
.toolbar{display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.sort{display:flex;align-items:center;gap:8px}.sort select{background:var(--panel);border:1px solid var(--line);color:var(--text);padding:7px 10px;border-radius:7px;font-size:12px}
.sort .dir{background:var(--panel2);border:1px solid var(--line);color:var(--dim);width:28px;height:28px;border-radius:6px;cursor:pointer;display:grid;place-items:center;font-weight:700;font-size:11px}.spacer{flex:1}
.persistent-menu-wrap{position:relative}.persistent-menu{position:absolute;right:0;top:36px;background:var(--panel2);border:1px solid var(--line2);border-radius:8px;padding:4px;z-index:30;min-width:180px;box-shadow:0 12px 30px rgba(0,0,0,.4)}
.persistent-menu button{display:flex;align-items:center;gap:7px;width:100%;background:transparent;border:none;color:var(--text);padding:8px 10px;font-family:inherit;font-size:12.5px;cursor:pointer;border-radius:5px;text-align:left}
.persistent-menu button:hover{background:var(--panel)}.persistent-menu button.danger{color:var(--danger)}
.changelog{display:flex;flex-direction:column}.release{display:grid;grid-template-columns:34px 1fr}
.release-rail{display:flex;justify-content:center;position:relative}.release-rail::before{content:"";position:absolute;top:0;bottom:0;width:2px;background:var(--line)}
.release:first-child .release-rail::before{top:10px}.release:last-child .release-rail::before{bottom:auto;height:10px}
.release-dot{width:12px;height:12px;border-radius:50%;background:var(--panel2);border:2px solid var(--line2);margin-top:4px;z-index:1}.release-dot.cur{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 4px rgba(214,124,63,.15)}
.release-body{padding:0 0 28px 16px}.release-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.release-head .ver{font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;color:var(--accent);background:rgba(214,124,63,.1);border:1px solid rgba(214,124,63,.3);padding:2px 9px;border-radius:6px}
.release-head h3{font-family:'Oswald',sans-serif;font-size:18px;font-weight:600}.cur-badge{font-size:10px;text-transform:uppercase;letter-spacing:.6px;background:var(--green);color:#fff;padding:3px 8px;border-radius:20px}
.rel-date{margin-left:auto;font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums}
.change-list{list-style:none;display:flex;flex-direction:column;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px}
.change-list li{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.5}
.ct{font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;font-weight:700;padding:3px 7px;border-radius:5px;flex-shrink:0;margin-top:1px;min-width:54px;text-align:center}
.ct-added{background:rgba(94,145,120,.15);color:var(--green);border:1px solid rgba(94,145,120,.35)}.ct-changed{background:rgba(196,169,74,.15);color:var(--gold);border:1px solid rgba(196,169,74,.35)}
.ct-fixed{background:rgba(214,124,63,.15);color:var(--accent);border:1px solid rgba(214,124,63,.35)}.ct-removed{background:rgba(193,84,79,.15);color:var(--danger);border:1px solid rgba(193,84,79,.35)}
.chatbot-fab{position:fixed;bottom:24px;right:24px;width:50px;height:50px;border-radius:50%;background:var(--accent);color:#fff;border:none;cursor:pointer;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:all .2s;z-index:50}
.chatbot-fab:hover{transform:scale(1.1);background:var(--accent-d)}
.chatbot-modal{position:fixed;bottom:90px;right:24px;width:380px;height:500px;background:var(--bg2);border:1px solid var(--line2);border-radius:14px;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.4);z-index:50}
.chatbot-head{padding:14px 16px;border-bottom:1px solid var(--line);font-weight:600;display:flex;justify-content:space-between;align-items:center}
.chatbot-messages{flex:1;padding:14px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
.message{padding:10px 12px;border-radius:8px;max-width:80%;word-wrap:break-word}.message.user{background:var(--accent);color:#fff;margin-left:auto}.message.assistant{background:var(--panel);color:var(--text);margin-right:auto}
.chatbot-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--line)}.chatbot-input input{flex:1;background:var(--panel);border:1px solid var(--line);color:var(--text);padding:8px 10px;border-radius:6px;font-family:inherit;font-size:12px;outline:none}
@media(max-width:768px){.sidebar{position:fixed;left:0;top:0;bottom:0;z-index:100;width:280px;transform:translateX(-100%);transition:transform .3s}.sidebar.open{transform:translateX(0)}.mobile-menu-btn,.mobile-close{display:block}.content{padding:16px 16px 60px}.topbar{padding:14px}.topbar h1{font-size:18px}.card-grid{grid-template-columns:1fr}.chatbot-modal{width:90vw;max-width:380px}}
`}</style>;}
