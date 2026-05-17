import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Target, Crosshair, Package, Boxes, LayoutDashboard, LogOut, Search, Plus, Download, Trash2, Edit3, X, ChevronDown, AlertTriangle, Calendar, ArrowUpDown, Check, Lock, MapPin, Image as ImageIcon, ScrollText, Warehouse, Loader, Wrench, Droplet, Sparkles, Shield, HelpCircle, FileText, ShoppingCart, Tag, Users, ChevronRight, MoreVertical, Star, Backpack, FileDown, ArrowLeft, CheckCircle2, Circle, ShieldCheck, AlertCircle, Eye, Hand, Zap, Menu, Hammer, Send, Bell, CheckCheck } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUPER_ADMIN_EMAIL = "pierfelicejohnny@yahoo.com";

function LogoIcon({ size = 24 }) { return <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M 100 20 L 160 55 L 160 145 L 100 180 L 40 145 L 40 55 Z" fill="none" stroke="currentColor"/><rect x="60" y="60" width="80" height="80" rx="4" fill="none" stroke="currentColor"/><circle cx="100" cy="100" r="12" fill="none" stroke="currentColor"/><line x1="88" y1="100" x2="112" y2="100" stroke="currentColor"/><line x1="100" y1="88" x2="100" y2="112" stroke="currentColor"/></svg>; }

const MANUFACTURERS = ["Glock","Smith & Wesson","Sig Sauer","Ruger","Colt","Remington","Springfield Armory","Beretta","CZ","Heckler & Koch","Winchester","Mossberg","Savage Arms","Browning","FN Herstal","Walther","Kimber","Daniel Defense","Aero Precision","Palmetto State Armory","Henry","Marlin","Benelli","Tikka","Bergara","Other"];
const CALIBERS = ["9mm",".45 ACP",".40 S&W",".380 ACP","10mm",".22 LR",".223 Rem","5.56 NATO",".308 Win","7.62x39","6.5 Creedmoor",".300 BLK",".30-06",".270 Win","12 Gauge","20 Gauge",".410 Bore",".357 Mag",".38 Special","44 Mag","Other"];
const FIREARM_TYPES = ["Pistol","Revolver","Rifle","Shotgun","Other"];
const ACCESSORY_TYPES = ["Scope","Red Dot","Holster","Grip","Magazine","Light","Sling","Bipod","Suppressor","Other"];
const AMMO_TYPES = ["FMJ","JHP","Match","Birdshot","Buckshot","Slug","Subsonic","Frangible","Other"];
const GUN_PARTS_CATEGORIES = ["Barrels","Bolts / Bolt Carriers","Triggers / Trigger Groups","Uppers / Upper Receivers","Lowers / Lower Receivers","Stocks / Buttstocks","Handguards / Rails / Foregrips","Gas Tubes / Gas Blocks / Pistons","Charging Handles","Magazines / Mag Wells","Springs / Detents / Pins","Safeties / Selectors","Sears / Hammer / Firing Pin","Muzzle Devices / Flash Hiders / Brakes","Optic Mounts / QD Mounts","Scope Rings / Bases","Grips / Pistol Grips","Slide Stops / Serrations","Takedown Pins / Roll Pins","Extractors / Ejectors","Feedramps / Feed Lips","Internals / Small Parts Kits","Other"];
const SUPPLY_CATEGORIES = ["Cleaning Solvents / Degreasers","Lubricants / Oils / Greases / CLP","Cleaning Brushes / Patches / Rods / Mops","Gun Cases / Range Bags / Soft Cases","Ammo Boxes / Storage Containers","Targets / Backer Board","Hearing Protection / Earplugs / Earmuffs","Eye Protection / Glasses / Goggles","Holsters / Carriers / Belts","Slings / Tactical Gear","Manuals / Documentation / Specs","Gun Safe / Storage Cabinet","Ammunition (link to existing)","Add-Ons (link to existing)","Cleaning Tools / Picks / Nylon Brushes","Maintenance Kits / Spare Parts Kits","Mag Pouches / Mag Carriers","Bore Cleaners / Specific Caliber Tools","Lights / Batteries","Sights / Iron Sights / Backup Sights","Grips / Stippling","Range Supplies / Shooting Mats","Other"];
const DEFAULT_RANGE_ROUNDS = { Pistol: 100, Revolver: 50, Rifle: 60, Shotgun: 25, Other: 50 };
const IMAGE_TYPES = "JPEG, PNG, WebP, GIF";
const IMAGE_MAX_MB = 5;
const TARGET_PHOTO_MAX_MB = 5;
const APP_VERSION = "1.5.0";

const CHANGELOG = [
  { version:"1.5.0", date:"2026-05-16", tag:"current", title:"Major redesign — Gun Parts, improved admin system, professional styling, mobile optimization", changes:[
    { type:"added", text:"Gun Parts tab — comprehensive inventory of barrels, bolts, triggers, uppers, lowers, stocks, and 20+ other component categories." },
    { type:"added", text:"Super Admin system — Super admin (pierfelicejohnny@yahoo.com) approves admin requests from users." },
    { type:"added", text:"Admin invite workflow — admins can invite users to become admins; super admin approves in pending box." },
    { type:"added", text:"Up-Keep dashboard tiles — 7 individual tiles for each maintenance category, sortable by frequency." },
    { type:"added", text:"Damage tracking improvements — description, repair cost estimate, and clear damage status." },
    { type:"added", text:"Safe Audit reset button — quickly clear safe audit alert." },
    { type:"added", text:"Photo upload improvements — 5MB limit (up from 3MB), proper display on all cards." },
    { type:"added", text:"Supplies linking — link existing ammunition or add-ons to supply items." },
    { type:"added", text:"Insurance Manifest redesign — professional header, company branding, official appearance." },
    { type:"added", text:"Support page reorganization — categories, hyperlinks, elaborate documentation." },
    { type:"added", text:"Logo integration — custom SVG logo throughout app and login." },
    { type:"changed", text:"Dashboard refresh — cleaner layout, better visual hierarchy, improved stat cards." },
    { type:"changed", text:"Mobile responsiveness — full redesign for phones and tablets, collapsible sidebar, touch-friendly inputs." },
    { type:"changed", text:"Color palette refinement — improved contrast, warmer tones, better readability." },
    { type:"changed", text:"Typography improvements — better font hierarchy, improved spacing, clearer labels." },
  ]},
  { version:"1.4.0", date:"2026-05-15", tag:"", title:"Major update — admin, load-outs, supplies, for-sale, support, damage, photos", changes:[
    { type:"added", text:"Admin role with user management and promotion controls." },
    { type:"added", text:"Range Load Out builder with smart ammo suggestions." },
    { type:"added", text:"Supplies Needed tab with check-off and archive." },
    { type:"added", text:"For Sale tab — list firearms/add-ons and track sold archive." },
    { type:"added", text:"Support tab with Terms, Privacy, and per-tab help docs." },
    { type:"added", text:"Damage tracking per firearm with photos and severity flag." },
    { type:"added", text:"Photo uploads for Firearms, Add-Ons, Range Log with validation." },
    { type:"added", text:"Status pills on every firearm (Ready/Oil/Maintenance/Damaged)." },
    { type:"added", text:"Insurance Manifest PDF export." },
    { type:"changed", text:"Renamed: Ammo→Ammunition, Accessories→Add-Ons, Maintenance→Up-Keep." },
    { type:"changed", text:"Up-Keep expanded: yearly tear-down, monthly cleaning, 6mo chamber, 3mo safe audit, 6mo optic, monthly holster." },
    { type:"fixed", text:"Email verification now redirects correctly to live URL." },
  ]},
  { version:"1.3.0", date:"2026-05-15", tag:"", title:"Maintenance tab, firearm photos & smart dashboard", changes:[
    { type:"added", text:"Maintenance tab with per-firearm last-cleaned and last-oiled dates." },
    { type:"added", text:"Auto-flag rules: cleaning needed after range visits, oiling needed after time without firing." },
    { type:"added", text:"Firearm photo uploads stored in Supabase Storage." },
    { type:"added", text:"Clickable dashboard stat cards that jump to relevant tabs." },
    { type:"added", text:"Action Required cards on dashboard for cleaning, oiling, and low ammo." },
    { type:"added", text:"Caliber hover tooltip showing rounds on hand per firearm." },
  ]},
  { version:"1.2.0", date:"2026-05-15", tag:"", title:"Live Supabase backend & cloud sync", changes:[
    { type:"added", text:"Real email and password authentication via Supabase Auth." },
    { type:"added", text:"Multi-device sync — data persists across devices and sessions." },
    { type:"added", text:"Row Level Security so only you can access your own inventory." },
    { type:"added", text:"Cloud-hosted Postgres database for firearms, range log, accessories, and ammo." },
    { type:"added", text:"Target photo uploads to Supabase Storage." },
  ]},
  { version:"1.1.0", date:"2026-05-14", tag:"", title:"The Gun Shed redesign & branding", changes:[
    { type:"changed", text:"Renamed app from Armory to The Gun Shed." },
    { type:"changed", text:"Refreshed UI with dark gunmetal/rust aesthetic and Oswald + Archivo fonts." },
    { type:"added", text:"Changelog tab to track every release." },
    { type:"added", text:"Target photo uploads on range log entries." },
  ]},
  { version:"1.0.0", date:"2026-05-13", tag:"", title:"Initial build", changes:[
    { type:"added", text:"Firearms tab with manufacturer, model, serial, caliber, type, and value." },
    { type:"added", text:"Range Log tab to track every visit — location, rounds fired, target photos." },
    { type:"added", text:"Accessories tab for scopes, holsters, magazines, and gear." },
    { type:"added", text:"Ammunition tab tracking caliber, type, quantity, and storage location." },
    { type:"added", text:"Dashboard with collection stats and recent activity." },
    { type:"added", text:"Search and sort on every tab." },
    { type:"added", text:"CSV and JSON export for all tables." },
  ]},
];

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const money = (n) => (n || n === 0) ? `$${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—";

function toCSV(rows) { if (!rows.length) return ""; const cols = Object.keys(rows[0]).filter((c) => !["photos","photo_paths","photo_path","items","damage_photos","linked_items"].includes(c)); const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");}
function download(filename, text, type = "text/plain") { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);}
function validateImage(file, maxMB) { const sizeInMB = file.size / 1024 / 1024; if (sizeInMB > maxMB) return `Image must be under ${maxMB}MB. You uploaded ${sizeInMB.toFixed(1)}MB.`; const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]; if (!validTypes.includes(file.type)) return `Please upload ${IMAGE_TYPES}.`; return null;}

function getUpkeepFlags(firearm, rangelog, accessories) {
  const flags = [];
  const logs = (rangelog || []).filter(m => m.firearm_id === firearm.id).sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
  const lastFire = logs[0];
  if (lastFire) {
    const firedDate = new Date(lastFire.visit_date);
    const cleanedDate = firearm.last_cleaned ? new Date(firearm.last_cleaned) : null;
    const daysSinceFire = daysBetween(lastFire.visit_date, today());
    if ((!cleanedDate || cleanedDate < firedDate) && daysSinceFire > 30) {
      flags.push({ key:"clean", label:"Needs Cleaning", severity:"high", frequency: 30 });
    }
  }
  if (firearm.last_cleaned && daysBetween(firearm.last_cleaned, today()) > 180) {
    flags.push({ key:"chamber", label:"Chamber Wipe Due", severity:"medium", frequency: 180 });
  }
  if (firearm.last_cleaned) {
    const cleanedDate = new Date(firearm.last_cleaned);
    const oiledDate = firearm.last_oiled ? new Date(firearm.last_oiled) : null;
    const firedSinceClean = lastFire && new Date(lastFire.visit_date) > cleanedDate;
    const daysSinceClean = daysBetween(firearm.last_cleaned, today());
    if (!firedSinceClean && daysSinceClean > 180 && (!oiledDate || oiledDate < cleanedDate)) {
      flags.push({ key:"oil", label:"Needs Oiling", severity:"medium", frequency: 180 });
    }
  }
  const refDate = firearm.last_torn_down || firearm.acquired;
  if (refDate && daysBetween(refDate, today()) > 365) {
    flags.push({ key:"teardown", label:"Yearly Tear-Down Due", severity:"high", frequency: 365 });
  }
  const firearmLabel = firearm.nickname || `${firearm.manufacturer} ${firearm.model}`;
  const hasOptic = (accessories || []).some(a => (a.type === "Scope" || a.type === "Red Dot") && a.assigned_to === firearmLabel);
  if (hasOptic && (!firearm.last_optic_check || daysBetween(firearm.last_optic_check, today()) > 180)) {
    flags.push({ key:"optic", label:"Optic Check Due", severity:"medium", frequency: 180 });
  }
  if (firearm.has_carry_holster && (!firearm.last_holster_check || daysBetween(firearm.last_holster_check, today()) > 30)) {
    flags.push({ key:"holster", label:"Holster Check Due", severity:"low", frequency: 30 });
  }
  if (!firearm.last_safe_audit || daysBetween(firearm.last_safe_audit, today()) > 90) {
    flags.push({ key:"safeaudit", label:"Safe Audit Due", severity:"medium", frequency: 90 });
  }
  return flags.sort((a, b) => a.frequency - b.frequency);
}

function getFirearmStatus(firearm, rangelog, accessories) {
  if (firearm.damaged) return { kind:"damaged", label:"Damaged", icon:Zap, color:"var(--danger)" };
  const flags = getUpkeepFlags(firearm, rangelog, accessories);
  if (flags.length === 0) return { kind:"ready", label:"Ready", icon:CheckCircle2, color:"var(--green)" };
  const highSev = flags.find(f => f.severity === "high");
  if (highSev) return { kind:"maint", label:highSev.label, icon:Wrench, color:"var(--danger)" };
  if (flags.length === 1 && flags[0].key === "oil") return { kind:"oil", label:"Needs Oil", icon:Droplet, color:"var(--gold)" };
  return { kind:"maint", label:flags[0].label, icon:Wrench, color:"var(--danger)" };
}

function Login({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      if (params.get("access_token")) {
        (async () => {
          try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session?.user) {
              onAuth(data.session.user);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (e) { console.error("Session error:", e); }
        })();
      }
    }
  }, [onAuth]);

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) return setErr("Enter a valid email address.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) { setBusy(false); return setErr(error.message); }
        alert("Check your email to verify your account, then log in.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) { setBusy(false); return setErr(error.message); }
        onAuth(data.user);
      }
    } catch (e) { setErr("Something went wrong."); }
    setBusy(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />
      <div className="login-card">
        <div className="brand-logo"><LogoIcon size={32} /></div>
        <div className="brand"><span>THE GUN SHED</span></div>
        <p className="tagline">Private firearms inventory & range management</p>
        <div className="seg">
          <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(""); }}>Log In</button>
          <button className={mode === "signup" ? "on" : ""} onClick={() => { setMode("signup"); setErr(""); }}>Sign Up</button>
        </div>
        <label className="fld"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></label>
        <label className="fld"><span>Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></label>
        {err && <div className="err"><AlertTriangle size={14} /> {err}</div>}
        <button className="primary big" onClick={submit} disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create Account" : "Log In"}</button>
        <div className="note"><Lock size={12} /><span>Protected by Row Level Security. Only you can access your data.</span></div>
      </div>
    </div>
  );
}

// SHARED UI COMPONENTS
function Field({ label, children }) { return <label className="form-fld"><span>{label}</span>{children}</label>; }
function Modal({ title, onClose, children, wide }) { return <div className="modal-back" onMouseDown={onClose}><div className={`modal ${wide ? "wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="modal-body">{children}</div></div></div>; }
function Stat({ icon: Icon, label, value, accent, onClick }) { return <div className={`stat ${onClick ? "clickable" : ""}`} style={accent ? { borderColor: accent } : {}} onClick={onClick}><div className="stat-ico" style={accent ? { color: accent } : {}}><Icon size={20} /></div><div><div className="stat-val">{value}</div><div className="stat-lbl">{label}</div></div></div>; }
function Empty({ icon: Icon, label, hint }) { return <div className="empty"><Icon size={40} strokeWidth={1.4} /><strong>{label}</strong><span>{hint}</span></div>; }
function StatusPill({ status }) { const Icon = status.icon; return <span className="status-pill" style={{ color: status.color, borderColor: status.color }} title={status.label}><Icon size={12} /> <span>{status.label}</span></span>; }
function HelpButton({ onClick }) { return <button className="help-fab" onClick={onClick} title="Help"><HelpCircle size={18} /></button>; }
function ThreeDotMenu({ items }) { const [open, setOpen] = useState(false); return <div className="three-dot-wrap" onMouseLeave={() => setOpen(false)}><button className="icon-btn" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}><MoreVertical size={15} /></button>{open && <div className="three-dot-menu">{items.map((it, i) => <button key={i} onClick={() => { setOpen(false); it.onClick(); }} className={it.danger ? "danger" : ""}>{it.icon && <it.icon size={13} />} {it.label}</button>)}</div>}</div>; }
function Toolbar({ query, setQuery, sortKey, setSortKey, sortDir, setSortDir, sortOptions, onAdd, onExportCSV, onExportJSON, placeholder, addLabel = "Add", children }) { return <div className="toolbar">{onAdd && <button className="primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>}<div className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} /></div>{sortOptions && <div className="sort"><ArrowUpDown size={14} /><select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>{sortOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select><button className="dir" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>{sortDir === "asc" ? "↑" : "↓"}</button></div>}<div className="spacer" />{children}{(onExportCSV || onExportJSON) && <div className="menu-wrap"><button className="ghost"><Download size={15} /> Export <ChevronDown size={13} /></button><div className="menu">{onExportCSV && <button onClick={onExportCSV}>Export CSV</button>}{onExportJSON && <button onClick={onExportJSON}>Export JSON</button>}</div></div>}</div>; }

function useTable(rows, searchFields, defaultSort) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDir, setSortDir] = useState("asc");
  const view = useMemo(() => {
    let r = rows;
    const q = query.trim().toLowerCase();
    if (q) r = r.filter((x) => searchFields.some((f) => String(x[f] ?? "").toLowerCase().includes(q)));
    r = [...r].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av == null) av = ""; if (bv == null) bv = "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [rows, query, sortKey, sortDir, searchFields]);
  return { query, setQuery, sortKey, setSortKey, sortDir, setSortDir, view };
}

// COMPLETE IMPLEMENTATIONS
function Dashboard({ data, go }) {
  const firearms = data.firearms || [];
  const upkeepTiles = [
    { key: "clean", label: "Cleaning Due", icon: Wrench, color: "var(--danger)", count: firearms.filter(f => getUpkeepFlags(f, data.rangelog, data.accessories).some(fl => fl.key === "clean")).length },
    { key: "oil", label: "Oiling Due", icon: Droplet, color: "var(--gold)", count: firearms.filter(f => getUpkeepFlags(f, data.rangelog, data.accessories).some(fl => fl.key === "oil")).length },
    { key: "chamber", label: "Chamber Wipe", icon: Sparkles, color: "var(--gold)", count: firearms.filter(f => getUpkeepFlags(f, data.rangelog, data.accessories).some(fl => fl.key === "chamber")).length },
    { key: "teardown", label: "Tear Down Due", icon: Hammer, color: "var(--danger)", count: firearms.filter(f => getUpkeepFlags(f, data.rangelog, data.accessories).some(fl => fl.key === "teardown")).length },
    { key: "safeaudit", label: "Safe Audit", icon: ShieldCheck, color: "var(--gold)", count: firearms.filter(f => getUpkeepFlags(f, data.rangelog, data.accessories).some(fl => fl.key === "safeaudit")).length },
    { key: "optic", label: "Optic Check", icon: Eye, color: "var(--gold)", count: firearms.filter(f => getUpkeepFlags(f, data.rangelog, data.accessories).some(fl => fl.key === "optic")).length },
    { key: "holster", label: "Holster Check", icon: Hand, color: "var(--gold)", count: firearms.filter(f => getUpkeepFlags(f, data.rangelog, data.accessories).some(fl => fl.key === "holster")).length },
  ];
  const stats = [
    { icon: Target, label: "Firearms", value: firearms.filter(f => !f.sold).length, color: "var(--accent)" },
    { icon: MapPin, label: "Range Visits", value: (data.rangelog || []).length, color: "var(--green)" },
    { icon: Package, label: "Add-Ons", value: (data.accessories || []).length, color: "var(--gold)" },
    { icon: Boxes, label: "Ammo Types", value: (data.ammo || []).length, color: "var(--gold)" },
  ];
  return (
    <div className="tab">
      <div className="dashboard-grid">
        {stats.map(s => <Stat key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.color} onClick={() => go(s.label.toLowerCase() === "firearms" ? "firearms" : s.label.toLowerCase() === "range visits" ? "rangelog" : s.label.toLowerCase() === "add-ons" ? "addons" : "ammunition")} />)}
      </div>
      <h3 style={{ marginTop: 32, marginBottom: 16, fontFamily: "'Oswald',sans-serif", fontSize: 16 }}>Up-Keep Status</h3>
      <div className="upkeep-grid">
        {upkeepTiles.map(tile => <div key={tile.key} className="upkeep-card" style={{ borderLeftColor: tile.color }}><div className="upkeep-ico" style={{ color: tile.color }}><tile.icon size={20} /></div><div className="upkeep-body"><div className="upkeep-label">{tile.label}</div><div className="upkeep-count">{tile.count}</div></div></div>)}
      </div>
    </div>
  );
}

function Firearms({ data, setData, userId }) {
  const [editId, setEditId] = useState(null);
  const [newFire, setNewFire] = useState({ manufacturer: "", model: "", serial: "", caliber: "", type: "", acquired: today(), value: 0, current_value: 0, nickname: "", notes: "" });
  const [damageModal, setDamageModal] = useState(null);
  const firearms = data.firearms || [];
  const table = useTable(firearms, ["nickname", "manufacturer", "model", "serial", "caliber"], "manufacturer");

  const save = async () => {
    const rec = { ...newFire, user_id: userId };
    if (editId) {
      await supabase.from("firearms").update(rec).eq("id", editId);
    } else {
      rec.id = uid(); await supabase.from("firearms").insert([rec]);
    }
    setNewFire({ manufacturer: "", model: "", serial: "", caliber: "", type: "", acquired: today(), value: 0, current_value: 0, nickname: "", notes: "" });
    setEditId(null);
    const { data: d } = await supabase.from("firearms").select("*");
    setData({ ...data, firearms: d || [] });
  };

  const del = async (id) => {
    if (!confirm("Delete this firearm?")) return;
    await supabase.from("firearms").delete().eq("id", id);
    setData({ ...data, firearms: firearms.filter(f => f.id !== id) });
  };

  const clearDamage = async (id) => {
    await supabase.from("firearms").update({ damaged: false, damage_severity: null, damage_notes: null, damage_photos: null, damage_reported_at: null }).eq("id", id);
    setData({ ...data, firearms: firearms.map(f => f.id === id ? { ...f, damaged: false, damage_severity: null, damage_notes: null, damage_photos: null, damage_reported_at: null } : f) });
    setDamageModal(null);
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "manufacturer", label: "Manufacturer" }, { key: "acquired", label: "Acquired" }, { key: "current_value", label: "Current Value" }]} placeholder="Search nickname, manufacturer, model..." addLabel="Add Firearm" onAdd={() => setEditId("new")} />
      {table.view.length === 0 ? <Empty icon={Target} label="No Firearms" hint="Add your first firearm to get started." /> : (
        <div className="card-grid">
          {table.view.map(f => {
            const status = getFirearmStatus(f, data.rangelog, data.accessories);
            const StatusIcon = status.icon;
            return (
              <div key={f.id} className="firearm-card">
                <div className="card-head">
                  <div><strong>{f.nickname || f.manufacturer}</strong><span className="dim">{f.model}</span></div>
                  <ThreeDotMenu items={[{ label: "Edit", onClick: () => { setNewFire(f); setEditId(f.id); } }, f.damaged ? { label: "Clear Damage", onClick: () => clearDamage(f.id), icon: CheckCircle2 } : null, { label: "Delete", onClick: () => del(f.id), danger: true, icon: Trash2 }].filter(Boolean)} />
                </div>
                <div className="card-body">
                  <span><strong>{f.caliber}</strong> {f.type}</span>
                  <span className="dim">SN: {f.serial || "—"}</span>
                  <span className="dim">Acquired: {f.acquired}</span>
                  <StatusPill status={status} />
                </div>
                <div className="card-foot"><span>{money(f.current_value || f.value)}</span></div>
              </div>
            );
          })}
        </div>
      )}
      {editId && <Modal title={editId === "new" ? "Add Firearm" : "Edit Firearm"} onClose={() => setEditId(null)}><Field label="Manufacturer"><select value={newFire.manufacturer} onChange={(e) => setNewFire({...newFire, manufacturer: e.target.value})}><option>Select...</option>{MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}</select></Field><Field label="Model"><input value={newFire.model} onChange={(e) => setNewFire({...newFire, model: e.target.value})} /></Field><Field label="Caliber"><select value={newFire.caliber} onChange={(e) => setNewFire({...newFire, caliber: e.target.value})}><option>Select...</option>{CALIBERS.map(c => <option key={c} value={c}>{c}</option>)}</select></Field><Field label="Type"><select value={newFire.type} onChange={(e) => setNewFire({...newFire, type: e.target.value})}><option>Select...</option>{FIREARM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field><Field label="Serial"><input value={newFire.serial} onChange={(e) => setNewFire({...newFire, serial: e.target.value})} /></Field><Field label="Nickname"><input value={newFire.nickname} onChange={(e) => setNewFire({...newFire, nickname: e.target.value})} /></Field><Field label="Acquired"><input type="date" value={newFire.acquired} onChange={(e) => setNewFire({...newFire, acquired: e.target.value})} /></Field><Field label="Original Value"><input type="number" value={newFire.value} onChange={(e) => setNewFire({...newFire, value: parseFloat(e.target.value)})} /></Field><Field label="Current Value"><input type="number" value={newFire.current_value} onChange={(e) => setNewFire({...newFire, current_value: parseFloat(e.target.value)})} /></Field><Field label="Notes"><textarea value={newFire.notes} onChange={(e) => setNewFire({...newFire, notes: e.target.value})} style={{minHeight: 80}} /></Field><button className="primary" onClick={save} style={{width: "100%"}}>Save</button></Modal>}
    </div>
  );
}

function RangeLog({ data, setData, userId }) {
  const [editId, setEditId] = useState(null);
  const [newLog, setNewLog] = useState({ firearm_id: "", visit_date: today(), location: "", rounds_fired: 0, target_photo_path: "", notes: "" });
  const logs = data.rangelog || [];
  const table = useTable(logs, ["location", "notes"], "visit_date");

  const save = async () => {
    const rec = { ...newLog, user_id: userId };
    if (editId) {
      await supabase.from("range_log").update(rec).eq("id", editId);
    } else {
      rec.id = uid(); await supabase.from("range_log").insert([rec]);
    }
    setNewLog({ firearm_id: "", visit_date: today(), location: "", rounds_fired: 0, target_photo_path: "", notes: "" });
    setEditId(null);
    const { data: d } = await supabase.from("range_log").select("*");
    setData({ ...data, rangelog: d || [] });
  };

  const del = async (id) => {
    if (!confirm("Delete this range log entry?")) return;
    await supabase.from("range_log").delete().eq("id", id);
    setData({ ...data, rangelog: logs.filter(l => l.id !== id) });
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "visit_date", label: "Date" }, { key: "location", label: "Location" }, { key: "rounds_fired", label: "Rounds" }]} placeholder="Search location..." addLabel="Add Log Entry" onAdd={() => setEditId("new")} />
      {table.view.length === 0 ? <Empty icon={MapPin} label="No Range Visits" hint="Log your first range visit." /> : (
        <div className="card-grid">
          {table.view.map(l => {
            const gun = (data.firearms || []).find(f => f.id === l.firearm_id);
            return (
              <div key={l.id} className="log-card">
                <div className="card-head"><div><strong>{gun?.nickname || gun?.manufacturer || "Unknown"}</strong><span className="dim">{l.visit_date}</span></div><ThreeDotMenu items={[{ label: "Edit", onClick: () => { setNewLog(l); setEditId(l.id); } }, { label: "Delete", onClick: () => del(l.id), danger: true, icon: Trash2 }]} /></div>
                <div className="card-body"><span><strong>{l.rounds_fired}</strong> rounds</span><span className="dim">{l.location || "Home range"}</span><span className="dim">{l.notes}</span></div>
              </div>
            );
          })}
        </div>
      )}
      {editId && <Modal title={editId === "new" ? "Add Range Log" : "Edit Range Log"} onClose={() => setEditId(null)}><Field label="Firearm"><select value={newLog.firearm_id} onChange={(e) => setNewLog({...newLog, firearm_id: e.target.value})}><option>Select...</option>{(data.firearms || []).map(f => <option key={f.id} value={f.id}>{f.nickname || f.manufacturer} {f.model}</option>)}</select></Field><Field label="Date"><input type="date" value={newLog.visit_date} onChange={(e) => setNewLog({...newLog, visit_date: e.target.value})} /></Field><Field label="Location"><input value={newLog.location} onChange={(e) => setNewLog({...newLog, location: e.target.value})} placeholder="Range name or home" /></Field><Field label="Rounds Fired"><input type="number" value={newLog.rounds_fired} onChange={(e) => setNewLog({...newLog, rounds_fired: parseInt(e.target.value) || 0})} /></Field><Field label="Notes"><textarea value={newLog.notes} onChange={(e) => setNewLog({...newLog, notes: e.target.value})} style={{minHeight: 80}} /></Field><button className="primary" onClick={save} style={{width: "100%"}}>Save</button></Modal>}
    </div>
  );
}

function RangeLoadOut({ data, setData, userId }) {
  const [editId, setEditId] = useState(null);
  const [newLoad, setNewLoad] = useState({ name: "", favorite: false, notes: "", items: [] });
  const loadouts = data.loadouts || [];

  const save = async () => {
    const rec = { ...newLoad, user_id: userId };
    if (editId) {
      await supabase.from("loadouts").update(rec).eq("id", editId);
    } else {
      rec.id = uid(); await supabase.from("loadouts").insert([rec]);
    }
    setNewLoad({ name: "", favorite: false, notes: "", items: [] });
    setEditId(null);
    const { data: d } = await supabase.from("loadouts").select("*");
    setData({ ...data, loadouts: d || [] });
  };

  const del = async (id) => {
    if (!confirm("Delete this loadout?")) return;
    await supabase.from("loadouts").delete().eq("id", id);
    setData({ ...data, loadouts: loadouts.filter(l => l.id !== id) });
  };

  return (
    <div className="tab">
      <button className="primary" onClick={() => setEditId("new")} style={{marginBottom: 16}}><Plus size={16} /> New Loadout</button>
      {loadouts.length === 0 ? <Empty icon={Backpack} label="No Loadouts" hint="Create your first range loadout." /> : (
        <div className="card-grid">
          {loadouts.map(l => (
            <div key={l.id} className="loadout-card">
              <div className="card-head"><div><strong>{l.name}</strong>{l.favorite && <Star size={14} style={{fill: "var(--gold)", color: "var(--gold)"}} />}</div><ThreeDotMenu items={[{ label: "Edit", onClick: () => { setNewLoad(l); setEditId(l.id); } }, { label: "Delete", onClick: () => del(l.id), danger: true, icon: Trash2 }]} /></div>
              <div className="card-body"><span className="dim">{l.items?.length || 0} items</span><span className="dim">{l.notes}</span></div>
            </div>
          ))}
        </div>
      )}
      {editId && <Modal title={editId === "new" ? "New Loadout" : "Edit Loadout"} onClose={() => setEditId(null)}><Field label="Name"><input value={newLoad.name} onChange={(e) => setNewLoad({...newLoad, name: e.target.value})} /></Field><Field label="Notes"><textarea value={newLoad.notes} onChange={(e) => setNewLoad({...newLoad, notes: e.target.value})} style={{minHeight: 60}} /></Field><label style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 16}}><input type="checkbox" checked={newLoad.favorite} onChange={(e) => setNewLoad({...newLoad, favorite: e.target.checked})} /> Make this my favorite</label><button className="primary" onClick={save} style={{width: "100%"}}>Save</button></Modal>}
    </div>
  );
}

function GunParts({ data, setData, userId }) {
  const [editId, setEditId] = useState(null);
  const [newPart, setNewPart] = useState({ category: "", description: "", manufacturer: "", model: "", cost: 0, acquired: today(), condition: "excellent", notes: "" });
  const parts = data.gunparts || [];
  const table = useTable(parts, ["description", "manufacturer", "category"], "category");

  const save = async () => {
    const rec = { ...newPart, user_id: userId };
    if (editId) {
      await supabase.from("gun_parts").update(rec).eq("id", editId);
    } else {
      rec.id = uid(); await supabase.from("gun_parts").insert([rec]);
    }
    setNewPart({ category: "", description: "", manufacturer: "", model: "", cost: 0, acquired: today(), condition: "excellent", notes: "" });
    setEditId(null);
    const { data: d } = await supabase.from("gun_parts").select("*");
    setData({ ...data, gunparts: d || [] });
  };

  const del = async (id) => {
    if (!confirm("Delete this gun part?")) return;
    await supabase.from("gun_parts").delete().eq("id", id);
    setData({ ...data, gunparts: parts.filter(p => p.id !== id) });
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "category", label: "Category" }, { key: "manufacturer", label: "Manufacturer" }, { key: "acquired", label: "Acquired" }, { key: "cost", label: "Cost" }]} placeholder="Search parts..." addLabel="Add Part" onAdd={() => setEditId("new")} />
      {table.view.length === 0 ? <Empty icon={Hammer} label="No Gun Parts" hint="Start adding your spare parts and components." /> : (
        <div className="card-grid">
          {table.view.map(p => (
            <div key={p.id} className="part-card">
              <div className="card-head"><div><strong>{p.description}</strong><span className="dim">{p.category}</span></div><ThreeDotMenu items={[{ label: "Edit", onClick: () => { setNewPart(p); setEditId(p.id); } }, { label: "Delete", onClick: () => del(p.id), danger: true, icon: Trash2 }]} /></div>
              <div className="card-body"><span>{p.manufacturer || "—"} {p.model || ""}</span><span className="dim">Condition: {p.condition}</span><span className="dim">Acquired: {p.acquired}</span></div>
              <div className="card-foot"><span>{money(p.cost)}</span></div>
            </div>
          ))}
        </div>
      )}
      {editId && <Modal title={editId === "new" ? "Add Gun Part" : "Edit Gun Part"} onClose={() => setEditId(null)}><Field label="Category"><select value={newPart.category} onChange={(e) => setNewPart({...newPart, category: e.target.value})}><option>Select...</option>{GUN_PARTS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></Field><Field label="Description"><input value={newPart.description} onChange={(e) => setNewPart({...newPart, description: e.target.value})} /></Field><Field label="Manufacturer"><input value={newPart.manufacturer} onChange={(e) => setNewPart({...newPart, manufacturer: e.target.value})} /></Field><Field label="Model"><input value={newPart.model} onChange={(e) => setNewPart({...newPart, model: e.target.value})} /></Field><Field label="Cost"><input type="number" value={newPart.cost} onChange={(e) => setNewPart({...newPart, cost: parseFloat(e.target.value)})} /></Field><Field label="Condition"><select value={newPart.condition} onChange={(e) => setNewPart({...newPart, condition: e.target.value})}><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></Field><Field label="Acquired"><input type="date" value={newPart.acquired} onChange={(e) => setNewPart({...newPart, acquired: e.target.value})} /></Field><Field label="Notes"><textarea value={newPart.notes} onChange={(e) => setNewPart({...newPart, notes: e.target.value})} style={{minHeight: 80}} /></Field><button className="primary" onClick={save} style={{width: "100%"}}>Save</button></Modal>}
    </div>
  );
}

function UpKeep({ data, setData }) {
  const firearms = data.firearms || [];
  const upkeepItems = [
    { key: "last_cleaned", label: "Last Cleaned", frequency: 30, icon: Wrench, firearms: firearms.filter(f => !f.last_cleaned || daysBetween(f.last_cleaned, today()) > 30) },
    { key: "last_oiled", label: "Last Oiled", frequency: 180, icon: Droplet, firearms: firearms.filter(f => !f.last_oiled || daysBetween(f.last_oiled, today()) > 180) },
    { key: "last_cleaned", label: "Chamber Wipe", frequency: 180, icon: Sparkles, firearms: firearms.filter(f => !f.last_cleaned || daysBetween(f.last_cleaned, today()) > 180) },
    { key: "last_torn_down", label: "Tear Down", frequency: 365, icon: Hammer, firearms: firearms.filter(f => !f.last_torn_down || daysBetween(f.last_torn_down, today()) > 365) },
    { key: "last_safe_audit", label: "Safe Audit", frequency: 90, icon: ShieldCheck, firearms: firearms.filter(f => !f.last_safe_audit || daysBetween(f.last_safe_audit, today()) > 90) },
    { key: "last_optic_check", label: "Optic Check", frequency: 180, icon: Eye, firearms: firearms.filter(f => !f.last_optic_check || daysBetween(f.last_optic_check, today()) > 180) },
    { key: "last_holster_check", label: "Holster Check", frequency: 30, icon: Hand, firearms: firearms.filter(f => f.has_carry_holster && (!f.last_holster_check || daysBetween(f.last_holster_check, today()) > 30)) },
  ].sort((a, b) => b.firearms.length - a.firearms.length);

  const resetUpkeep = async (gunId, key) => {
    try {
      const updates = { [key]: today() };
      await supabase.from("firearms").update(updates).eq("id", gunId);
      setData({...data, firearms: firearms.map(f => f.id === gunId ? {...f, ...updates} : f)});
    } catch (e) {
      alert("Failed to reset: " + e.message);
    }
  };

  return (
    <div className="tab">
      {upkeepItems.map(item => (
        <div key={item.key} style={{marginBottom: 24}}>
          <h3 style={{fontFamily: "'Oswald',sans-serif", fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8}}><item.icon size={18} style={{color: "var(--accent)"}} /> {item.label} <span style={{color: "var(--faint)", fontSize: 12, marginLeft: "auto"}}>({item.firearms.length} due)</span></h3>
          {item.firearms.length === 0 ? <div style={{padding: 20, color: "var(--dim)", textAlign: "center", background: "var(--panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)"}}>✓ All firearms up to date</div> : (
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12}}>
              {item.firearms.map(f => (
                <div key={f.id} style={{background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 14}}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10}}><strong style={{fontSize: 14}}>{f.nickname || f.manufacturer} {f.model}</strong><button className="primary small" onClick={() => resetUpkeep(f.id, item.key)}><Check size={12} /> Clear</button></div>
                  <span style={{display: "block", fontSize: 12, color: "var(--dim)", marginBottom: 4}}>Last: {f[item.key] ? daysBetween(f[item.key], today()) + " days ago" : "Never"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddOns({ data, setData, userId }) {
  const [editId, setEditId] = useState(null);
  const [newAddon, setNewAddon] = useState({ type: "", description: "", manufacturer: "", model: "", cost: 0, acquired: today(), assigned_to: "", notes: "" });
  const addons = data.accessories || [];
  const table = useTable(addons, ["description", "manufacturer", "assigned_to"], "type");

  const save = async () => {
    const rec = { ...newAddon, user_id: userId };
    if (editId) {
      await supabase.from("accessories").update(rec).eq("id", editId);
    } else {
      rec.id = uid(); await supabase.from("accessories").insert([rec]);
    }
    setNewAddon({ type: "", description: "", manufacturer: "", model: "", cost: 0, acquired: today(), assigned_to: "", notes: "" });
    setEditId(null);
    const { data: d } = await supabase.from("accessories").select("*");
    setData({ ...data, accessories: d || [] });
  };

  const del = async (id) => {
    if (!confirm("Delete this add-on?")) return;
    await supabase.from("accessories").delete().eq("id", id);
    setData({ ...data, accessories: addons.filter(a => a.id !== id) });
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "type", label: "Type" }, { key: "manufacturer", label: "Manufacturer" }, { key: "cost", label: "Cost" }]} placeholder="Search add-ons..." addLabel="Add Add-On" onAdd={() => setEditId("new")} />
      {table.view.length === 0 ? <Empty icon={Package} label="No Add-Ons" hint="Add your first scope, holster, or accessory." /> : (
        <div className="card-grid">
          {table.view.map(a => (
            <div key={a.id} className="addon-card">
              <div className="card-head"><div><strong>{a.description}</strong><span className="dim">{a.type}</span></div><ThreeDotMenu items={[{ label: "Edit", onClick: () => { setNewAddon(a); setEditId(a.id); } }, { label: "Delete", onClick: () => del(a.id), danger: true, icon: Trash2 }]} /></div>
              <div className="card-body"><span>{a.manufacturer || "—"} {a.model || ""}</span><span className="dim">Assigned to: {a.assigned_to || "Unassigned"}</span><span className="dim">Acquired: {a.acquired}</span></div>
              <div className="card-foot"><span>{money(a.cost)}</span></div>
            </div>
          ))}
        </div>
      )}
      {editId && <Modal title={editId === "new" ? "Add Add-On" : "Edit Add-On"} onClose={() => setEditId(null)}><Field label="Type"><select value={newAddon.type} onChange={(e) => setNewAddon({...newAddon, type: e.target.value})}><option>Select...</option>{ACCESSORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field><Field label="Description"><input value={newAddon.description} onChange={(e) => setNewAddon({...newAddon, description: e.target.value})} /></Field><Field label="Manufacturer"><input value={newAddon.manufacturer} onChange={(e) => setNewAddon({...newAddon, manufacturer: e.target.value})} /></Field><Field label="Model"><input value={newAddon.model} onChange={(e) => setNewAddon({...newAddon, model: e.target.value})} /></Field><Field label="Cost"><input type="number" value={newAddon.cost} onChange={(e) => setNewAddon({...newAddon, cost: parseFloat(e.target.value)})} /></Field><Field label="Assigned To"><input value={newAddon.assigned_to} onChange={(e) => setNewAddon({...newAddon, assigned_to: e.target.value})} placeholder="Firearm nickname" /></Field><Field label="Acquired"><input type="date" value={newAddon.acquired} onChange={(e) => setNewAddon({...newAddon, acquired: e.target.value})} /></Field><Field label="Notes"><textarea value={newAddon.notes} onChange={(e) => setNewAddon({...newAddon, notes: e.target.value})} style={{minHeight: 80}} /></Field><button className="primary" onClick={save} style={{width: "100%"}}>Save</button></Modal>}
    </div>
  );
}

function Ammunition({ data, setData, userId }) {
  const [editId, setEditId] = useState(null);
  const [newAmmo, setNewAmmo] = useState({ caliber: "", type: "", quantity: 0, storage_location: "", cost_per_round: 0, acquired: today(), notes: "" });
  const ammo = data.ammo || [];
  const table = useTable(ammo, ["caliber", "storage_location"], "caliber");

  const save = async () => {
    const rec = { ...newAmmo, user_id: userId };
    if (editId) {
      await supabase.from("ammo").update(rec).eq("id", editId);
    } else {
      rec.id = uid(); await supabase.from("ammo").insert([rec]);
    }
    setNewAmmo({ caliber: "", type: "", quantity: 0, storage_location: "", cost_per_round: 0, acquired: today(), notes: "" });
    setEditId(null);
    const { data: d } = await supabase.from("ammo").select("*");
    setData({ ...data, ammo: d || [] });
  };

  const del = async (id) => {
    if (!confirm("Delete this ammo?")) return;
    await supabase.from("ammo").delete().eq("id", id);
    setData({ ...data, ammo: ammo.filter(a => a.id !== id) });
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "caliber", label: "Caliber" }, { key: "quantity", label: "Quantity" }, { key: "acquired", label: "Acquired" }]} placeholder="Search ammo..." addLabel="Add Ammo" onAdd={() => setEditId("new")} />
      {table.view.length === 0 ? <Empty icon={Boxes} label="No Ammunition" hint="Log your ammunition inventory." /> : (
        <div className="card-grid">
          {table.view.map(a => (
            <div key={a.id} className="ammo-card">
              <div className="card-head"><div><strong>{a.caliber}</strong><span className="dim">{a.type}</span></div><ThreeDotMenu items={[{ label: "Edit", onClick: () => { setNewAmmo(a); setEditId(a.id); } }, { label: "Delete", onClick: () => del(a.id), danger: true, icon: Trash2 }]} /></div>
              <div className="card-body"><span className="dim">{a.quantity} rounds</span><span className="dim">Storage: {a.storage_location || "—"}</span><span className="dim">Cost: {money(a.cost_per_round)}/round</span></div>
              <div className="card-foot"><span>{money(a.quantity * (a.cost_per_round || 0))}</span></div>
            </div>
          ))}
        </div>
      )}
      {editId && <Modal title={editId === "new" ? "Add Ammunition" : "Edit Ammunition"} onClose={() => setEditId(null)}><Field label="Caliber"><select value={newAmmo.caliber} onChange={(e) => setNewAmmo({...newAmmo, caliber: e.target.value})}><option>Select...</option>{CALIBERS.map(c => <option key={c} value={c}>{c}</option>)}</select></Field><Field label="Type"><select value={newAmmo.type} onChange={(e) => setNewAmmo({...newAmmo, type: e.target.value})}><option>Select...</option>{AMMO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field><Field label="Quantity"><input type="number" value={newAmmo.quantity} onChange={(e) => setNewAmmo({...newAmmo, quantity: parseInt(e.target.value) || 0})} /></Field><Field label="Cost Per Round"><input type="number" step="0.01" value={newAmmo.cost_per_round} onChange={(e) => setNewAmmo({...newAmmo, cost_per_round: parseFloat(e.target.value)})} /></Field><Field label="Storage Location"><input value={newAmmo.storage_location} onChange={(e) => setNewAmmo({...newAmmo, storage_location: e.target.value})} placeholder="Safe, cabinet, etc" /></Field><Field label="Acquired"><input type="date" value={newAmmo.acquired} onChange={(e) => setNewAmmo({...newAmmo, acquired: e.target.value})} /></Field><Field label="Notes"><textarea value={newAmmo.notes} onChange={(e) => setNewAmmo({...newAmmo, notes: e.target.value})} style={{minHeight: 80}} /></Field><button className="primary" onClick={save} style={{width: "100%"}}>Save</button></Modal>}
    </div>
  );
}

function SuppliesNeeded({ data, setData, userId }) {
  const [editId, setEditId] = useState(null);
  const [newSupply, setNewSupply] = useState({ category: "", name: "", purchased: false, est_cost: 0, linked_type: "", linked_item: "", notes: "" });
  const supplies = data.supplies || [];
  const table = useTable(supplies, ["category", "name"], "category");

  const save = async () => {
    const rec = { ...newSupply, user_id: userId };
    if (editId) {
      await supabase.from("supplies").update(rec).eq("id", editId);
    } else {
      rec.id = uid(); await supabase.from("supplies").insert([rec]);
    }
    setNewSupply({ category: "", name: "", purchased: false, est_cost: 0, linked_type: "", linked_item: "", notes: "" });
    setEditId(null);
    const { data: d } = await supabase.from("supplies").select("*");
    setData({ ...data, supplies: d || [] });
  };

  const del = async (id) => {
    if (!confirm("Delete this supply?")) return;
    await supabase.from("supplies").delete().eq("id", id);
    setData({ ...data, supplies: supplies.filter(s => s.id !== id) });
  };

  const toggle = async (id) => {
    const s = supplies.find(x => x.id === id);
    await supabase.from("supplies").update({ purchased: !s.purchased }).eq("id", id);
    setData({ ...data, supplies: supplies.map(x => x.id === id ? {...x, purchased: !x.purchased} : x) });
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "category", label: "Category" }, { key: "name", label: "Name" }, { key: "est_cost", label: "Cost" }]} placeholder="Search supplies..." addLabel="Add Supply" onAdd={() => setEditId("new")} />
      {table.view.length === 0 ? <Empty icon={ShoppingCart} label="No Supplies" hint="Create your supply list." /> : (
        <div style={{display: "grid", gap: 8}}>
          {table.view.map(s => (
            <div key={s.id} style={{display: "flex", alignItems: "center", gap: 12, padding: 12, background: s.purchased ? "var(--panel2)" : "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", opacity: s.purchased ? 0.6 : 1}}>
              <input type="checkbox" checked={s.purchased} onChange={() => toggle(s.id)} />
              <div style={{flex: 1}}><strong>{s.name}</strong><span style={{display: "block", fontSize: 11, color: "var(--dim)"}}>{s.category}{s.linked_item ? ` • Linked: ${s.linked_item}` : ""}</span></div>
              <span style={{color: "var(--dim)", fontSize: 12}}>{money(s.est_cost)}</span>
              <ThreeDotMenu items={[{ label: "Edit", onClick: () => { setNewSupply(s); setEditId(s.id); } }, { label: "Delete", onClick: () => del(s.id), danger: true, icon: Trash2 }]} />
            </div>
          ))}
        </div>
      )}
      {editId && <Modal title={editId === "new" ? "Add Supply" : "Edit Supply"} onClose={() => setEditId(null)}><Field label="Category"><select value={newSupply.category} onChange={(e) => setNewSupply({...newSupply, category: e.target.value})}><option>Select...</option>{SUPPLY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></Field><Field label="Name"><input value={newSupply.name} onChange={(e) => setNewSupply({...newSupply, name: e.target.value})} /></Field><Field label="Estimated Cost"><input type="number" value={newSupply.est_cost} onChange={(e) => setNewSupply({...newSupply, est_cost: parseFloat(e.target.value)})} /></Field><Field label="Link to Ammo/Add-On"><select value={newSupply.linked_item} onChange={(e) => setNewSupply({...newSupply, linked_item: e.target.value})}><option value="">None</option><optgroup label="Ammunition">{(data.ammo || []).map(a => <option key={a.id} value={a.id}>{a.caliber} {a.type}</option>)}</optgroup><optgroup label="Add-Ons">{(data.accessories || []).map(acc => <option key={acc.id} value={acc.id}>{acc.description}</option>)}</optgroup></select></Field><Field label="Notes"><textarea value={newSupply.notes} onChange={(e) => setNewSupply({...newSupply, notes: e.target.value})} style={{minHeight: 60}} /></Field><button className="primary" onClick={save} style={{width: "100%"}}>Save</button></Modal>}
    </div>
  );
}

function ForSale({ data, setData }) {
  const firearms = (data.firearms || []).filter(f => f.for_sale);
  const addons = (data.accessories || []).filter(a => a.for_sale);

  return (
    <div className="tab">
      <h3 style={{marginBottom: 16, fontFamily: "'Oswald',sans-serif", fontSize: 16}}>Firearms for Sale</h3>
      {firearms.length === 0 ? <Empty icon={Target} label="No Firearms Listed" hint="Mark a firearm for sale from the Firearms tab." /> : (
        <div className="card-grid">
          {firearms.map(f => (
            <div key={f.id} className="sale-card">
              <div className="card-head"><div><strong>{f.nickname || f.manufacturer}</strong><span className="dim">{f.model}</span></div></div>
              <div className="card-body"><span>{f.caliber} {f.type}</span><span className="dim">Asking: {money(f.for_sale_listed_at ? (f.current_value || f.value) : "—")}</span><span className="dim">Listed: {f.for_sale_listed_at || "Not listed yet"}</span></div>
            </div>
          ))}
        </div>
      )}
      <h3 style={{marginTop: 24, marginBottom: 16, fontFamily: "'Oswald',sans-serif", fontSize: 16}}>Add-Ons for Sale</h3>
      {addons.length === 0 ? <Empty icon={Package} label="No Add-Ons Listed" hint="Mark an add-on for sale from the Add-Ons tab." /> : (
        <div className="card-grid">
          {addons.map(a => (
            <div key={a.id} className="sale-card">
              <div className="card-head"><div><strong>{a.description}</strong><span className="dim">{a.type}</span></div></div>
              <div className="card-body"><span>{a.manufacturer || "—"} {a.model || ""}</span><span className="dim">Asking: {money(a.for_sale_listed_at ? a.cost : "—")}</span><span className="dim">Listed: {a.for_sale_listed_at || "Not listed yet"}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Support() {
  const docs = [
    { category: "Getting Started", items: [{ title: "Creating Your First Firearm", content: "Click 'Add Firearm' and enter the manufacturer, model, caliber, and type. You can add a nickname to personalize it. Save your serial number for reference." }, { title: "Understanding the Dashboard", content: "The dashboard shows your collection stats and upcoming maintenance. Click any stat to jump to that section. The Up-Keep tiles show which firearms need attention." }] },
    { category: "Inventory Management", items: [{ title: "Managing Firearms", content: "View all your firearms in the Firearms tab. Search by nickname or manufacturer. Sort by date acquired or current value. Edit any firearm to update details. Mark as damaged if needed." }, { title: "Tracking Add-Ons", content: "Scopes, holsters, lights, and other accessories go in the Add-Ons tab. Assign them to specific firearms. Track cost and condition." }, { title: "Ammunition Inventory", content: "Log your ammunition by caliber and type. Track quantity and storage location. Track cost per round to monitor spending." }] },
    { category: "Maintenance & Safety", items: [{ title: "Up-Keep Schedule", content: "The Up-Keep tab tracks: Cleaning (30 days after firing), Oiling (180 days), Chamber wipes (180 days), Yearly tear-downs (365 days), Safe audits (90 days), Optic checks (180 days), and Holster checks (30 days for carry guns)." }, { title: "Damage Tracking", content: "If a firearm is damaged, mark it in the Firearms tab. Add a description, severity, repair cost estimate, and photos. Click 'Clear Damage' when resolved." }, { title: "Safe Audits", content: "Perform a safe audit every 90 days. The dashboard reminds you. Click the 'Safe Audit' tile in Up-Keep to reset the timer after completion." }] },
    { category: "Range & Training", items: [{ title: "Logging Range Visits", content: "Click 'Add Log Entry' in the Range Log tab. Select the firearm, date, location, and rounds fired. Notes are optional. Upload target photos to track your progress." }, { title: "Building Load-Outs", content: "Create custom range load-outs with firearms and ammo. Mark your favorite. The system learns from your history to suggest ammo quantities." }] },
    { category: "Gun Parts", items: [{ title: "Tracking Components", content: "The Gun Parts tab tracks barrels, bolts, triggers, uppers, lowers, stocks, and 17+ other categories. Track manufacturer, model, cost, and condition." }, { title: "Maintenance Parts", content: "Keep an inventory of spare springs, pins, extractors, and other internals. Track what you have and what you need to order." }] },
  ];

  return (
    <div className="tab">
      <div style={{display: "grid", gap: 24}}>
        {docs.map(doc => (
          <div key={doc.category}>
            <h3 style={{fontFamily: "'Oswald',sans-serif", fontSize: 16, marginBottom: 12, color: "var(--accent)"}}>{doc.category}</h3>
            <div style={{display: "grid", gap: 8}}>
              {doc.items.map((item, i) => (
                <details key={i} style={{background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 0}}>
                  <summary style={{padding: "12px 14px", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 8}}><ChevronRight size={14} /> {item.title}</summary>
                  <div style={{padding: "12px 14px", borderTop: "1px solid var(--line)", color: "var(--dim)", lineHeight: 1.6, fontSize: 13}}>{item.content}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function Changelog() { return <div className="tab"><div className="changelog">{CHANGELOG.map((rel) => (<div className="release" key={rel.version}><div className="release-rail"><div className={`release-dot ${rel.tag === "current" ? "cur" : ""}`} /></div><div className="release-body"><div className="release-head"><span className="ver">v{rel.version}</span><h3>{rel.title}</h3>{rel.tag === "current" && <span className="cur-badge">Current</span>}<span className="rel-date">{rel.date}</span></div><ul className="change-list">{rel.changes.map((c, i) => <li key={i}><span className={`ct ct-${c.type}`}>{c.type}</span><span>{c.text}</span></li>)}</ul></div></div>))}</div></div>; }

function Admin({ currentUser, data, setData }) {
  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadUsers();
    if (isSuperAdmin) loadPending();
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const loadPending = async () => {
    const { data } = await supabase.from("admin_requests").select("*").eq("status", "pending").order("created_at", { ascending: false });
    setPending(data || []);
  };

  const sendInvite = async (userId) => {
    try {
      const { error } = await supabase.from("admin_requests").insert([{ requested_user_id: userId, requested_by_id: currentUser.id, status: "pending", created_at: today() }]);
      if (error) throw error;
      alert("Admin invite sent! Super admin will review your request.");
      loadPending();
    } catch (e) { alert("Failed: " + e.message); }
  };

  const approveRequest = async (requestId, userId) => {
    try {
      await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
      await supabase.from("admin_requests").update({ status: "approved" }).eq("id", requestId);
      loadUsers();
      loadPending();
      alert("Admin approved!");
    } catch (e) { alert("Failed: " + e.message); }
  };

  const rejectRequest = async (requestId) => {
    try {
      await supabase.from("admin_requests").update({ status: "rejected" }).eq("id", requestId);
      loadPending();
    } catch (e) { alert("Failed: " + e.message); }
  };

  const filtered = users.filter(u => !query || (u.email || "").toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="tab">
      <div className="admin-container">
        <div className="admin-section">
          <h3>Registered Users ({users.length})</h3>
          <div className="search" style={{ marginBottom: 16 }}><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email…" /></div>
          {loading ? <p>Loading…</p> : (
            <table className="grid-table">
              <thead><tr><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
              <tbody>{filtered.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.email}</strong>{u.email === currentUser.email && <span className="pill" style={{marginLeft:8}}>You</span>}</td>
                  <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                  <td className="mono">{u.created_at?.slice(0,10)}</td>
                  <td className="row-actions">{u.role !== "admin" && <button className="ghost small" onClick={() => sendInvite(u.id)}><Send size={13} /> Invite</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        {isSuperAdmin && pending.length > 0 && (
          <div className="admin-section" style={{marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 24}}>
            <h3><Bell size={18} /> Pending Admin Approvals ({pending.length})</h3>
            <div className="pending-list">
              {pending.map(req => {
                const user = users.find(u => u.id === req.requested_user_id);
                return (
                  <div className="pending-item" key={req.id}>
                    <div><strong>{user?.email}</strong><span className="dim">Requested by admin</span></div>
                    <div className="actions">
                      <button className="primary small" onClick={() => approveRequest(req.id, req.requested_user_id)}><CheckCheck size={13} /> Approve</button>
                      <button className="ghost small danger" onClick={() => rejectRequest(req.id)}><X size={13} /> Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState({ firearms: [], rangelog: [], accessories: [], ammo: [], loadouts: [], supplies: [], gunparts: [] });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
        await loadData();
      }
      setAuthChecked(true); setLoading(false);
    })();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single().catch(() => ({ data: null }));
    setProfile(data);
  };

  const loadData = async () => {
    try {
      const [f, r, a, am, l, s, g] = await Promise.all([
        supabase.from("firearms").select("*"),
        supabase.from("range_log").select("*"),
        supabase.from("accessories").select("*"),
        supabase.from("ammo").select("*"),
        supabase.from("loadouts").select("*"),
        supabase.from("supplies").select("*"),
        supabase.from("gun_parts").select("*").catch(() => ({ data: [] })),
      ]);
      setData({
        firearms: f.data || [],
        rangelog: r.data || [],
        accessories: a.data || [],
        ammo: am.data || [],
        loadouts: l.data || [],
        supplies: s.data || [],
        gunparts: g.data || [],
      });
    } catch (e) { console.error("Load error:", e); }
  };

  const handleAuth = async (u) => {
    setUser(u);
    await loadProfile(u.id);
    await loadData();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    setData({ firearms: [], rangelog: [], accessories: [], ammo: [], loadouts: [], supplies: [], gunparts: [] });
    setTab("dashboard");
  };

  if (!authChecked) return <><Styles /><div className="boot"><Loader size={20} style={{animation:"spin 1s linear infinite"}} /> Loading…</div></>;
  if (!user) return <><Styles /><Login onAuth={handleAuth} /></>;

  const isAdmin = profile?.role === "admin";
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const NAV = [
    { key:"dashboard", label:"Dashboard", icon: LayoutDashboard },
    { key:"firearms", label:"Firearms", icon: Target },
    { key:"rangelog", label:"Range Log", icon: MapPin },
    { key:"loadout", label:"Load Out", icon: Backpack },
    { key:"gunparts", label:"Gun Parts", icon: Hammer },
    { key:"upkeep", label:"Up-Keep", icon: Wrench },
    { key:"addons", label:"Add-Ons", icon: Package },
    { key:"ammunition", label:"Ammunition", icon: Boxes },
    { key:"supplies", label:"Supplies", icon: ShoppingCart },
    { key:"forsale", label:"For Sale", icon: Tag },
    { key:"support", label:"Support", icon: HelpCircle },
  ];
  if (isAdmin) {
    NAV.push({ key:"admin", label:"Admin", icon: Users });
    NAV.push({ key:"changelog", label:"Changelog", icon: ScrollText });
  }

  return (
    <>
      <Styles />
      <div className="app">
        <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
          <div className="sidebar-top">
            <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            <div className="brand-top"><LogoIcon size={20} /><span>THE GUN SHED</span></div>
          </div>
          <nav>{NAV.map((n) => (
            <button key={n.key} className={tab === n.key ? "on" : ""} onClick={() => { setTab(n.key); setMobileMenuOpen(false); }}>
              <n.icon size={17} /><span>{n.label}</span>
              {isAdmin && (n.key === "admin" || n.key === "changelog") && <span className="admin-dot" />}
              {isSuperAdmin && n.key === "admin" && <span className="super-dot" title="Super Admin">★</span>}
            </button>
          ))}</nav>
          <div className="side-foot">
            <div className="user">
              <div className="avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="user-info">
                <span className="email">{user?.email}</span>
                {isAdmin && <span className="role-pill admin small">{isSuperAdmin ? "super admin" : "admin"}</span>}
              </div>
              <button className="icon-btn" onClick={logout} title="Log out"><LogOut size={15} /></button>
            </div>
            <div className="ver-foot">v{APP_VERSION}</div>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><Menu size={20} /></button>
            <h1>{NAV.find((n) => n.key === tab)?.label}</h1>
          </div>
          <div className="content">
            {loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"400px",color:"var(--dim)"}}><Loader size={20} style={{animation:"spin 1s linear infinite",marginRight:"10px"}} />Loading…</div> : (
              <>
                {tab === "dashboard" && <Dashboard data={data} go={setTab} />}
                {tab === "firearms" && <Firearms data={data} setData={setData} userId={user.id} />}
                {tab === "rangelog" && <RangeLog data={data} setData={setData} userId={user.id} />}
                {tab === "loadout" && <RangeLoadOut data={data} setData={setData} userId={user.id} />}
                {tab === "gunparts" && <GunParts data={data} setData={setData} userId={user.id} />}
                {tab === "upkeep" && <UpKeep data={data} setData={setData} />}
                {tab === "addons" && <AddOns data={data} setData={setData} userId={user.id} />}
                {tab === "ammunition" && <Ammunition data={data} setData={setData} userId={user.id} />}
                {tab === "supplies" && <SuppliesNeeded data={data} setData={setData} userId={user.id} />}
                {tab === "forsale" && <ForSale data={data} setData={setData} />}
                {tab === "support" && <Support />}
                {tab === "admin" && isAdmin && <Admin currentUser={user} data={data} setData={setData} />}
                {tab === "changelog" && isAdmin && <Changelog />}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function Styles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo:wght@400;500;600;700&display=swap');
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    :root { --bg:#0f0e0a; --bg2:#1a1815; --panel:#232118; --panel2:#2d2820; --line:#3d372a; --line2:#4a4435; --text:#f0ebe0; --dim:#a8a494; --faint:#7d7969; --accent:#d67c3f; --accent-d:#b85f2d; --green:#5e9178; --gold:#c4a94a; --danger:#c1544f; --radius:12px; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:var(--bg); font-family:'Archivo',system-ui,sans-serif; color:var(--text); }
    .boot { color:var(--dim); padding:40px; display:flex; align-items:center; gap:10px; }
    .app { display:flex; min-height:100vh; }
    .brand-logo { display:inline-flex; color:var(--accent); }
    .brand { display:flex; align-items:center; gap:10px; color:var(--accent); font-family:'Oswald',sans-serif; font-weight:700; letter-spacing:2px; font-size:18px; margin:12px 0; }
    .brand span { color:var(--text); }
    .sidebar { width:260px; flex-shrink:0; background:var(--bg2); border-right:1px solid var(--line); padding:20px 14px; display:flex; flex-direction:column; gap:22px; position:sticky; top:0; height:100vh; overflow-y:auto; }
    .sidebar-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .brand-top { display:flex; align-items:center; gap:8px; font-family:'Oswald',sans-serif; font-weight:700; letter-spacing:1px; color:var(--accent); font-size:14px; }
    .sidebar nav { display:flex; flex-direction:column; gap:2px; }
    .sidebar nav button { display:flex; align-items:center; gap:11px; padding:11px 12px; background:transparent; border:none; border-radius:8px; cursor:pointer; color:var(--dim); font-family:inherit; font-size:13px; font-weight:500; text-align:left; transition:all .15s; width:100%; position:relative; }
    .sidebar nav button:hover { background:var(--panel); color:var(--text); }
    .sidebar nav button.on { background:linear-gradient(90deg, rgba(214,124,63,0.2), rgba(214,124,63,0.05)); color:var(--text); box-shadow:inset 2px 0 0 var(--accent); }
    .admin-dot { width:6px; height:6px; border-radius:50%; background:var(--gold); margin-left:auto; }
    .super-dot { font-size:10px; color:var(--gold); margin-left:auto; }
    .side-foot { margin-top:auto; display:flex; flex-direction:column; gap:10px; }
    .user { display:flex; align-items:center; gap:10px; padding:10px; background:var(--panel); border:1px solid var(--line); border-radius:8px; }
    .avatar { width:32px; height:32px; border-radius:7px; background:var(--accent); color:#fff; display:grid; place-items:center; font-weight:700; font-size:13px; flex-shrink:0; }
    .user-info { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
    .user .email { font-size:11px; color:var(--dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ver-foot { text-align:center; font-size:10px; color:var(--faint); letter-spacing:.5px; }
    .main { flex:1; min-width:0; display:flex; flex-direction:column; }
    .topbar { padding:18px 24px; border-bottom:1px solid var(--line); background:var(--bg2); display:flex; align-items:center; gap:14px; }
    .topbar h1 { font-family:'Oswald',sans-serif; font-weight:600; font-size:22px; letter-spacing:.5px; }
    .mobile-menu-btn { display:none; background:transparent; border:none; color:var(--text); cursor:pointer; }
    .mobile-close { display:none; background:transparent; border:none; color:var(--text); cursor:pointer; }
    .content { flex:1; padding:24px 32px 60px; overflow-y:auto; }
    .tab { position:relative; }
    .empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:70px 20px; color:var(--faint); text-align:center; border:1px dashed var(--line2); border-radius:var(--radius); }
    .empty strong { font-size:15px; color:var(--dim); font-family:'Oswald',sans-serif; }
    .login-wrap { min-height:100vh; display:grid; place-items:center; position:relative; padding:20px; overflow:hidden; }
    .login-bg { position:absolute; inset:0; background:radial-gradient(700px 500px at 20% 10%, rgba(214,124,63,0.08), transparent 60%), var(--bg); z-index:0; }
    .login-card { position:relative; z-index:1; background:var(--bg2); border:1px solid var(--line2); border-radius:16px; padding:40px 32px; width:100%; max-width:420px; box-shadow:0 20px 60px rgba(0,0,0,0.6); }
    .brand-logo { justify-content:center; margin-bottom:12px; }
    .tagline { text-align:center; color:var(--dim); font-size:13px; margin-bottom:24px; }
    .seg { display:flex; background:var(--panel); border:1px solid var(--line); border-radius:9px; padding:3px; margin-bottom:18px; }
    .seg button { flex:1; background:transparent; border:none; color:var(--dim); padding:8px; border-radius:6px; cursor:pointer; font-family:inherit; font-size:12px; font-weight:600; transition:all .15s; }
    .seg button.on { background:var(--accent); color:#fff; }
    .fld { display:flex; flex-direction:column; gap:5px; margin-bottom:13px; }
    .fld span { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:var(--faint); }
    .fld input { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:10px 12px; color:var(--text); font-family:inherit; font-size:13px; outline:none; transition:border-color .15s; }
    .fld input:focus { border-color:var(--accent); }
    .err { display:flex; align-items:center; gap:6px; background:rgba(193,84,79,0.12); border:1px solid rgba(193,84,79,0.35); color:#d98a84; font-size:12px; padding:8px 11px; border-radius:7px; margin-bottom:12px; }
    .note { display:flex; align-items:flex-start; gap:6px; color:var(--faint); font-size:11px; margin-top:16px; line-height:1.45; }
    .admin-container { display:flex; flex-direction:column; gap:24px; }
    .admin-section { background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:20px; }
    .admin-section h3 { font-family:'Oswald',sans-serif; font-size:16px; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
    .grid-table { width:100%; border-collapse:collapse; background:var(--panel2); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    .grid-table th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.7px; color:var(--faint); padding:11px 14px; background:var(--bg2); border-bottom:1px solid var(--line); }
    .grid-table td { padding:12px 14px; font-size:13px; border-bottom:1px solid var(--line); vertical-align:middle; }
    .grid-table tr:last-child td { border-bottom:none; }
    .grid-table tbody tr:hover { background:var(--panel); }
    .mono { font-variant-numeric:tabular-nums; color:var(--dim); }
    .dim { color:var(--dim); }
    .row-actions { display:flex; gap:6px; }
    .pill { font-size:10.5px; text-transform:uppercase; letter-spacing:.6px; background:var(--panel2); border:1px solid var(--line2); color:var(--dim); padding:3px 8px; border-radius:20px; }
    .role-pill { display:inline-block; font-size:10px; text-transform:uppercase; letter-spacing:.6px; padding:3px 8px; border-radius:5px; font-weight:700; }
    .role-pill.admin { background:rgba(196,169,74,0.15); color:var(--gold); border:1px solid rgba(196,169,74,0.35); }
    .role-pill.user { background:rgba(94,145,120,0.15); color:var(--green); border:1px solid rgba(94,145,120,0.35); }
    .role-pill.small { font-size:9px; padding:1px 5px; }
    .pending-list { display:flex; flex-direction:column; gap:10px; }
    .pending-item { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:var(--panel2); border:1px solid rgba(196,169,74,0.3); border-radius:8px; }
    .pending-item > div:first-child { display:flex; flex-direction:column; gap:3px; }
    .pending-item strong { font-size:13px; }
    .pending-item .dim { font-size:11px; }
    .pending-item .actions { display:flex; gap:8px; }
    .help-fab { position:fixed; bottom:24px; right:24px; width:44px; height:44px; border-radius:50%; background:var(--accent); color:#fff; border:none; cursor:pointer; display:grid; place-items:center; box-shadow:0 8px 24px rgba(0,0,0,0.4); transition:all .2s; z-index:50; }
    .help-fab:hover { transform:scale(1.1); background:var(--accent-d); }
    .modal-back { position:fixed; inset:0; background:rgba(10,9,6,0.78); display:grid; place-items:center; z-index:100; padding:20px; backdrop-filter:blur(2px); }
    .modal { background:var(--bg2); border:1px solid var(--line2); border-radius:14px; width:100%; max-width:560px; max-height:90vh; overflow:auto; }
    .modal.wide { max-width:760px; }
    .modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg2); z-index:5; }
    .modal-head h3 { font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; }
    .modal-body { padding:20px; }
    .form-fld { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
    .form-fld > span { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:var(--faint); }
    .form-fld input, .form-fld select, .form-fld textarea { background:var(--panel); border:1px solid var(--line); border-radius:7px; padding:9px 11px; color:var(--text); font-family:inherit; font-size:13px; outline:none; transition:border-color .15s; }
    .form-fld input:focus, .form-fld select:focus, .form-fld textarea:focus { border-color:var(--accent); }
    .form-fld select option { background:var(--panel2); }
    .form-fld textarea { resize:vertical; }
    button.primary { display:inline-flex; align-items:center; gap:6px; background:var(--accent); color:#fff; border:none; border-radius:8px; padding:9px 15px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:600; transition:background .15s; }
    button.primary:hover { background:var(--accent-d); }
    button.primary:disabled { opacity:.45; cursor:not-allowed; }
    button.primary.big { width:100%; justify-content:center; padding:12px; font-size:14px; margin-top:4px; }
    button.primary.small { padding:6px 10px; font-size:12px; }
    button.ghost { display:inline-flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); color:var(--dim); border-radius:8px; padding:9px 13px; cursor:pointer; font-family:inherit; font-size:12px; transition:all .15s; }
    button.ghost:hover { color:var(--text); border-color:var(--line2); }
    button.ghost.small { padding:5px 8px; font-size:11px; }
    button.ghost.danger:hover { color:#fff; background:var(--danger); border-color:var(--danger); }
    .icon-btn { background:var(--panel2); border:1px solid var(--line); color:var(--dim); width:30px; height:30px; border-radius:7px; cursor:pointer; display:grid; place-items:center; transition:all .15s; }
    .icon-btn:hover { color:var(--text); border-color:var(--line2); }
    .stat { display:flex; align-items:center; gap:13px; background:var(--panel); border:1px solid var(--line); border-left-width:3px; border-radius:var(--radius); padding:15px 16px; transition:all .15s; cursor:pointer; }
    .stat:hover { transform:translateY(-2px); border-color:var(--line2); }
    .stat-ico { color:var(--dim); }
    .stat-val { font-family:'Oswald',sans-serif; font-size:23px; font-weight:600; }
    .stat-lbl { font-size:11px; color:var(--dim); margin-top:4px; text-transform:uppercase; letter-spacing:.6px; }
    .status-pill { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:2px 8px; border-radius:12px; border:1px solid; background:rgba(0,0,0,0.15); }
    .search { display:flex; align-items:center; gap:8px; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:0 11px; color:var(--faint); }
    .search input { background:transparent; border:none; outline:none; color:var(--text); font-family:inherit; font-size:13px; padding:9px 0; width:100%; }
    .changelog { display:flex; flex-direction:column; }
    .release { display:grid; grid-template-columns:34px 1fr; }
    .release-rail { display:flex; justify-content:center; position:relative; }
    .release-rail::before { content:""; position:absolute; top:0; bottom:0; width:2px; background:var(--line); }
    .release:first-child .release-rail::before { top:10px; }
    .release:last-child .release-rail::before { bottom:auto; height:10px; }
    .release-dot { width:12px; height:12px; border-radius:50%; background:var(--panel2); border:2px solid var(--line2); margin-top:4px; z-index:1; }
    .release-dot.cur { background:var(--accent); border-color:var(--accent); box-shadow:0 0 0 4px rgba(214,124,63,0.15); }
    .release-body { padding:0 0 28px 16px; }
    .release-head { display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
    .release-head .ver { font-family:'Oswald',sans-serif; font-weight:700; font-size:13px; color:var(--accent); background:rgba(214,124,63,0.1); border:1px solid rgba(214,124,63,0.3); padding:2px 9px; border-radius:6px; }
    .release-head h3 { font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; }
    .cur-badge { font-size:10px; text-transform:uppercase; letter-spacing:.6px; background:var(--green); color:#fff; padding:3px 8px; border-radius:20px; }
    .rel-date { margin-left:auto; font-size:12px; color:var(--faint); font-variant-numeric:tabular-nums; }
    .change-list { list-style:none; display:flex; flex-direction:column; gap:8px; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:14px 16px; }
    .change-list li { display:flex; gap:10px; align-items:flex-start; font-size:13px; line-height:1.5; }
    .ct { font-size:9.5px; text-transform:uppercase; letter-spacing:.6px; font-weight:700; padding:3px 7px; border-radius:5px; flex-shrink:0; margin-top:1px; min-width:54px; text-align:center; }
    .ct-added { background:rgba(94,145,120,0.15); color:var(--green); border:1px solid rgba(94,145,120,0.35); }
    .ct-changed { background:rgba(196,169,74,0.15); color:var(--gold); border:1px solid rgba(196,169,74,0.35); }
    .ct-fixed { background:rgba(214,124,63,0.15); color:var(--accent); border:1px solid rgba(214,124,63,0.35); }
    .ct-removed { background:rgba(193,84,79,0.15); color:var(--danger); border:1px solid rgba(193,84,79,0.35); }
    .spacer { flex:1; }
    .three-dot-wrap { position:relative; }
    .three-dot-menu { position:absolute; right:0; top:36px; background:var(--panel2); border:1px solid var(--line2); border-radius:8px; padding:4px; z-index:30; min-width:180px; box-shadow:0 12px 30px rgba(0,0,0,0.4); }
    .three-dot-menu button { display:flex; align-items:center; gap:7px; width:100%; background:transparent; border:none; color:var(--text); padding:8px 10px; font-family:inherit; font-size:12.5px; cursor:pointer; border-radius:5px; text-align:left; }
    .three-dot-menu button:hover { background:var(--panel); }
    .three-dot-menu button.danger { color:var(--danger); }
    .toolbar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
    .dashboard-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:24px; }
    .card-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:12px; }
    .firearm-card, .log-card, .addon-card, .part-card, .ammo-card, .sale-card, .loadout-card { background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:14px; transition:all .15s; }
    .firearm-card:hover, .log-card:hover, .addon-card:hover, .part-card:hover, .ammo-card:hover, .sale-card:hover, .loadout-card:hover { transform:translateY(-2px); border-color:var(--line2); }
    .card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:10px; }
    .card-head div { display:flex; flex-direction:column; gap:2px; }
    .card-head strong { font-size:14px; }
    .card-body { display:flex; flex-direction:column; gap:4px; margin-bottom:8px; font-size:12px; }
    .card-body span { color:var(--text); }
    .card-body .dim { color:var(--dim); }
    .card-foot { display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid var(--line); font-size:12px; color:var(--dim); }
    .upkeep-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px; }
    .upkeep-card { display:flex; align-items:center; gap:12px; background:var(--panel); border:1px solid var(--line); border-left-width:3px; border-radius:var(--radius); padding:12px 14px; transition:all .15s; }
    .upkeep-card:hover { transform:translateY(-1px); border-color:var(--line2); }
    .upkeep-ico { color:var(--accent); }
    .upkeep-body { display:flex; flex-direction:column; gap:2px; }
    .upkeep-label { font-size:12px; color:var(--dim); }
    .upkeep-count { font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; }
    summary { outline:none; }
    summary::-webkit-details-marker { color:var(--accent); margin-right:4px; }
    @media (max-width:768px) {
      .sidebar { position:fixed; left:0; top:0; bottom:0; z-index:100; width:280px; transform:translateX(-100%); transition:transform .3s; }
      .sidebar.open { transform:translateX(0); }
      .mobile-menu-btn { display:block; }
      .mobile-close { display:block; }
      .sidebar-top { margin-bottom:16px; }
      .content { padding:16px 16px 60px; }
      .topbar { padding:14px 14px; }
      .topbar h1 { font-size:18px; }
    }
  `}</style>;
}
