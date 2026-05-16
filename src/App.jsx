import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Target, Crosshair, Package, Boxes, LayoutDashboard, LogOut, Search,
  Plus, Download, Trash2, Edit3, X, ChevronDown, AlertTriangle,
  Calendar, ArrowUpDown, Check, Lock, MapPin, Image as ImageIcon,
  ScrollText, Warehouse, Loader, Wrench, Droplet, Sparkles, Shield,
  HelpCircle, FileText, ShoppingCart, Tag, Users, ChevronRight,
  MoreVertical, Star, Backpack, FileDown, ArrowLeft, CheckCircle2,
  Circle, ShieldCheck, AlertCircle, Eye, Hand, Zap
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MANUFACTURERS = ["Glock","Smith & Wesson","Sig Sauer","Ruger","Colt","Remington","Springfield Armory","Beretta","CZ","Heckler & Koch","Winchester","Mossberg","Savage Arms","Browning","FN Herstal","Walther","Kimber","Daniel Defense","Aero Precision","Palmetto State Armory","Henry","Marlin","Benelli","Tikka","Bergara","Other"];
const CALIBERS = ["9mm",".45 ACP",".40 S&W",".380 ACP","10mm",".22 LR",".223 Rem","5.56 NATO",".308 Win","7.62x39","6.5 Creedmoor",".300 BLK",".30-06",".270 Win","12 Gauge","20 Gauge",".410 Bore",".357 Mag",".38 Special","44 Mag","Other"];
const FIREARM_TYPES = ["Pistol","Revolver","Rifle","Shotgun","Other"];
const ACCESSORY_TYPES = ["Scope","Red Dot","Holster","Grip","Magazine","Light","Sling","Bipod","Suppressor","Other"];
const AMMO_TYPES = ["FMJ","JHP","Match","Birdshot","Buckshot","Slug","Subsonic","Frangible","Other"];
const SUPPLY_CATEGORIES = ["Cleaning","Lubrication","Tools","Parts","Range gear","Storage","Other"];
const DAMAGE_SEVERITY = ["Minor","Moderate","Severe"];
const DEFAULT_RANGE_ROUNDS = { Pistol: 100, Revolver: 50, Rifle: 60, Shotgun: 25, Other: 50 };
const IMAGE_TYPES = "JPEG, PNG, WebP, GIF";
const IMAGE_MAX_MB = 3;
const TARGET_PHOTO_MAX_MB = 2.5;
const APP_VERSION = "1.4.0";

const CHANGELOG = [
  { version:"1.4.0", date:"2026-05-15", tag:"current", title:"Major update — admin, load-outs, supplies, for-sale, support, damage, photos", changes:[
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
    { type:"changed", text:"Up-Keep schedule expanded with 7 maintenance categories." },
    { type:"fixed", text:"Email verification redirect now works for new accounts." },
  ]},
  { version:"1.3.0", date:"2026-05-15", tag:"", title:"Maintenance & dashboard", changes:[
    { type:"added", text:"Maintenance tab, dashboard alerts, firearm photos." },
  ]},
];

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const money = (n) => (n || n === 0) ? `$${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—";

function toCSV(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]).filter((c) => !["photos","photo_paths","photo_path","items","damage_photos"].includes(c));
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function download(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function validateImage(file, maxMB) {
  const sizeInMB = file.size / 1024 / 1024;
  if (sizeInMB > maxMB) return `Image must be under ${maxMB} MB. You uploaded ${sizeInMB.toFixed(1)} MB.`;
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) return `Please upload ${IMAGE_TYPES}.`;
  return null;
}

function getUpkeepFlags(firearm, rangelog, accessories) {
  const flags = [];
  const logs = (rangelog || []).filter(m => m.firearm_id === firearm.id).sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
  const lastFire = logs[0];
  if (lastFire) {
    const firedDate = new Date(lastFire.visit_date);
    const cleanedDate = firearm.last_cleaned ? new Date(firearm.last_cleaned) : null;
    const daysSinceFire = daysBetween(lastFire.visit_date, today());
    if ((!cleanedDate || cleanedDate < firedDate) && daysSinceFire > 30) {
      flags.push({ key:"clean", label:"Needs Cleaning", severity:"high" });
    }
  }
  if (firearm.last_cleaned && daysBetween(firearm.last_cleaned, today()) > 180) {
    flags.push({ key:"chamber", label:"Chamber Wipe Due", severity:"medium" });
  }
  if (firearm.last_cleaned) {
    const cleanedDate = new Date(firearm.last_cleaned);
    const oiledDate = firearm.last_oiled ? new Date(firearm.last_oiled) : null;
    const firedSinceClean = lastFire && new Date(lastFire.visit_date) > cleanedDate;
    const daysSinceClean = daysBetween(firearm.last_cleaned, today());
    if (!firedSinceClean && daysSinceClean > 180 && (!oiledDate || oiledDate < cleanedDate)) {
      flags.push({ key:"oil", label:"Needs Oiling", severity:"medium" });
    }
  }
  const refDate = firearm.last_torn_down || firearm.acquired;
  if (refDate && daysBetween(refDate, today()) > 365) {
    flags.push({ key:"teardown", label:"Yearly Tear-Down Due", severity:"high" });
  }
  const firearmLabel = firearm.nickname || `${firearm.manufacturer} ${firearm.model}`;
  const hasOptic = (accessories || []).some(a => (a.type === "Scope" || a.type === "Red Dot") && a.assigned_to === firearmLabel);
  if (hasOptic && (!firearm.last_optic_check || daysBetween(firearm.last_optic_check, today()) > 180)) {
    flags.push({ key:"optic", label:"Optic Check Due", severity:"medium" });
  }
  if (firearm.has_carry_holster && (!firearm.last_holster_check || daysBetween(firearm.last_holster_check, today()) > 30)) {
    flags.push({ key:"holster", label:"Holster Check Due", severity:"low" });
  }
  return flags;
}

function safeAuditDue(firearms) {
  const audits = (firearms || []).map(f => f.last_safe_audit).filter(Boolean);
  if (audits.length === 0) return true;
  const latest = audits.sort().reverse()[0];
  return daysBetween(latest, today()) > 90;
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
        <div className="brand"><Warehouse size={28} strokeWidth={2.2} /><span>THE GUN SHED</span></div>
        <p className="tagline">Private firearms inventory & range log</p>
        <div className="seg">
          <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(""); }}>Log In</button>
          <button className={mode === "signup" ? "on" : ""} onClick={() => { setMode("signup"); setErr(""); }}>Sign Up</button>
        </div>
        <label className="fld"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></label>
        <label className="fld"><span>Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></label>
        {err && <div className="err"><AlertTriangle size={14} /> {err}</div>}
        <button className="primary big" onClick={submit} disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create Account" : "Log In"}</button>
        <div className="note"><Lock size={12} /><span>Protected by Row Level Security. Only you can access your inventory.</span></div>
      </div>
    </div>
  );
}

function Field({ label, children }) { return <label className="form-fld"><span>{label}</span>{children}</label>; }

function Modal({ title, onClose, children, wide }) {
  return <div className="modal-back" onMouseDown={onClose}><div className={`modal ${wide ? "wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="modal-body">{children}</div></div></div>;
}

function Stat({ icon: Icon, label, value, accent, onClick }) {
  return <div className={`stat ${onClick ? "clickable" : ""}`} style={accent ? { borderColor: accent } : {}} onClick={onClick}><div className="stat-ico" style={accent ? { color: accent } : {}}><Icon size={20} /></div><div><div className="stat-val">{value}</div><div className="stat-lbl">{label}</div></div></div>;
}

function Toolbar({ query, setQuery, sortKey, setSortKey, sortDir, setSortDir, sortOptions, onAdd, onExportCSV, onExportJSON, placeholder, addLabel = "Add", children }) {
  return <div className="toolbar">{onAdd && <button className="primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>}<div className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} /></div>{sortOptions && <div className="sort"><ArrowUpDown size={14} /><select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>{sortOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select><button className="dir" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>{sortDir === "asc" ? "↑" : "↓"}</button></div>}<div className="spacer" />{children}{(onExportCSV || onExportJSON) && <div className="menu-wrap"><button className="ghost"><Download size={15} /> Export <ChevronDown size={13} /></button><div className="menu">{onExportCSV && <button onClick={onExportCSV}>Export CSV</button>}{onExportJSON && <button onClick={onExportJSON}>Export JSON</button>}</div></div>}</div>;
}

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

function Empty({ icon: Icon, label, hint }) { return <div className="empty"><Icon size={40} strokeWidth={1.4} /><strong>{label}</strong><span>{hint}</span></div>; }

function StatusPill({ status }) {
  const Icon = status.icon;
  return <span className="status-pill" style={{ color: status.color, borderColor: status.color }} title={status.label}><Icon size={12} /> <span>{status.label}</span></span>;
}

function HelpButton({ onClick }) {
  return <button className="help-fab" onClick={onClick} title="Do you need help, click here"><HelpCircle size={18} /></button>;
}

function ThreeDotMenu({ items }) {
  const [open, setOpen] = useState(false);
  return <div className="three-dot-wrap" onMouseLeave={() => setOpen(false)}><button className="icon-btn" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}><MoreVertical size={15} /></button>{open && <div className="three-dot-menu">{items.map((it, i) => <button key={i} onClick={() => { setOpen(false); it.onClick(); }} className={it.danger ? "danger" : ""}>{it.icon && <it.icon size={13} />} {it.label}</button>)}</div>}</div>;
}

function Firearms({ data, setData, userId, onHelp }) {
  const all = data.firearms || [];
  const rows = all.filter(f => !f.for_sale && !f.sold);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const t = useTable(rows, ["manufacturer","model","serial","caliber","type","nickname"], "manufacturer");
  const blank = { nickname:"", manufacturer:"Glock", model:"", serial:"", caliber:"9mm", type:"Pistol", acquired:today(), value:"", current_value:"", notes:"", photo_path:"", has_carry_holster:false, damaged:false };

  const ammoByCaliber = useMemo(() => {
    const map = {};
    (data.ammo || []).forEach(a => { if (!a.caliber) return; map[a.caliber] = (map[a.caliber] || 0) + (Number(a.quantity) || 0); });
    return map;
  }, [data.ammo]);

  const save = async (rec) => {
    setSaving(true);
    try {
      const payload = {
        nickname: rec.nickname, manufacturer: rec.manufacturer, model: rec.model,
        serial: rec.serial, caliber: rec.caliber, type: rec.type, acquired: rec.acquired,
        value: rec.value ? parseFloat(rec.value) : null,
        current_value: rec.current_value ? parseFloat(rec.current_value) : null,
        notes: rec.notes, photo_path: rec.photo_path,
        has_carry_holster: !!rec.has_carry_holster, damaged: !!rec.damaged,
      };
      if (rec.id && rec.id.length > 20) {
        await supabase.from("firearms").update(payload).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("firearms").insert([{ ...payload, user_id: userId }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.firearms.some((x) => x.id === rec.id);
        return { ...d, firearms: exists ? d.firearms.map((x) => (x.id === rec.id ? { ...x, ...payload, id: rec.id } : x)) : [...d.firearms, { ...payload, id: rec.id, user_id: userId }] };
      });
      setEditing(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this firearm? This also removes its range log entries.")) return;
    try {
      await supabase.from("firearms").delete().eq("id", id);
      setData((d) => ({ ...d, firearms: d.firearms.filter((x) => x.id !== id), rangelog: d.rangelog.filter((m) => m.firearm_id !== id) }));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  const moveToForSale = async (firearm) => {
    try {
      await supabase.from("firearms").update({ for_sale: true, for_sale_listed_at: today() }).eq("id", firearm.id);
      setData((d) => ({ ...d, firearms: d.firearms.map(f => f.id === firearm.id ? { ...f, for_sale: true, for_sale_listed_at: today() } : f) }));
    } catch (e) { alert("Failed to move: " + e.message); }
  };

  const roundCount = useCallback((fid) => (data.rangelog || []).filter((m) => m.firearm_id === fid).reduce((s, m) => s + (Number(m.rounds) || 0), 0), [data.rangelog]);

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search firearms…" addLabel="Add Firearm" sortOptions={[{key:"manufacturer",label:"Manufacturer"},{key:"model",label:"Model"},{key:"caliber",label:"Caliber"},{key:"type",label:"Type"}]} onAdd={() => setEditing({ ...blank, id: uid() })} onExportCSV={() => download("firearms.csv", toCSV(rows), "text/csv")} onExportJSON={() => download("firearms.json", JSON.stringify(rows, null, 2), "application/json")} />
      {t.view.length === 0 ? <Empty icon={Target} label="No firearms yet" hint="Click Add Firearm to log your first one." /> : (
        <div className="cards">
          {t.view.map((f) => {
            const photoUrl = f.photo_path ? supabase.storage.from("firearm-photos").getPublicUrl(f.photo_path).data.publicUrl : null;
            const ammoOnHand = ammoByCaliber[f.caliber] || 0;
            const status = getFirearmStatus(f, data.rangelog, data.accessories);
            return (
              <div className="card firearm-card" key={f.id}>
                {photoUrl && <div className="firearm-photo"><img src={photoUrl} alt={f.model} /></div>}
                <div className="card-inner">
                  <div className="card-top">
                    <div className="card-ico fire"><Crosshair size={18} /></div>
                    <div className="card-title">
                      <div className="title-row"><strong>{f.nickname || f.model || "Unnamed"}</strong><StatusPill status={status} /></div>
                      <span>{f.manufacturer} {f.model}</span>
                    </div>
                    <span className="pill">{f.type}</span>
                  </div>
                  <div className="kv">
                    <div><label>Serial</label><span>{f.serial || "—"}</span></div>
                    <div><label>Caliber</label><span className="caliber-tooltip" title={`${ammoOnHand.toLocaleString()} rounds of ${f.caliber} on hand`}>{f.caliber}<span className="ammo-pill">{ammoOnHand.toLocaleString()}</span></span></div>
                    <div><label>Rounds fired</label><span>{roundCount(f.id).toLocaleString()}</span></div>
                    <div><label>Acquired</label><span>{f.acquired || "—"}</span></div>
                    <div><label>Purchase $</label><span>{money(f.value)}</span></div>
                    <div><label>Current $</label><span>{money(f.current_value)}</span></div>
                  </div>
                  {f.notes && <p className="notes">{f.notes}</p>}
                  <div className="card-actions">
                    <button className="icon-btn" onClick={() => setEditing(f)} title="Edit"><Edit3 size={15} /></button>
                    <button className="icon-btn danger" onClick={() => remove(f.id)} title="Delete"><Trash2 size={15} /></button>
                    <ThreeDotMenu items={[{ label:"Move to For Sale", icon:Tag, onClick: () => moveToForSale(f) }]} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editing && <Modal title={all.some((x) => x.id === editing.id) ? "Edit Firearm" : "Add Firearm"} onClose={() => setEditing(null)}><FirearmForm rec={editing} userId={userId} onSave={save} onCancel={() => setEditing(null)} saving={saving} /></Modal>}
      <HelpButton onClick={() => onHelp("firearms")} />
    </div>
  );
}

function FirearmForm({ rec, userId, onSave, onCancel, saving }) {
  const [f, setF] = useState(rec);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file) return;
    const err = validateImage(file, IMAGE_MAX_MB);
    if (err) { alert(err); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${userId}/${f.id}/${filename}`;
      const { error } = await supabase.storage.from("firearm-photos").upload(path, file);
      if (error) throw error;
      if (f.photo_path) await supabase.storage.from("firearm-photos").remove([f.photo_path]).catch(() => {});
      set("photo_path", path);
    } catch (e) { alert("Upload failed: " + e.message); }
    setUploading(false);
  };

  const removePhoto = async () => {
    if (!f.photo_path) return;
    try { await supabase.storage.from("firearm-photos").remove([f.photo_path]); } catch {}
    set("photo_path", "");
  };

  const photoUrl = f.photo_path ? supabase.storage.from("firearm-photos").getPublicUrl(f.photo_path).data.publicUrl : null;

  return (
    <div className="form">
      <div className="grid2">
        <Field label="Nickname (optional)"><input value={f.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="Truck gun" /></Field>
        <Field label="Type"><select value={f.type} onChange={(e) => set("type", e.target.value)}>{FIREARM_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Manufacturer"><select value={f.manufacturer} onChange={(e) => set("manufacturer", e.target.value)}>{MANUFACTURERS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Model"><input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="G19 Gen5" /></Field>
        <Field label="Serial number"><input value={f.serial} onChange={(e) => set("serial", e.target.value)} placeholder="ABC123" /></Field>
        <Field label="Caliber / Gauge"><select value={f.caliber} onChange={(e) => set("caliber", e.target.value)}>{CALIBERS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Date acquired"><input type="date" value={f.acquired} onChange={(e) => set("acquired", e.target.value)} /></Field>
        <Field label="Purchase price ($)"><input type="number" value={f.value} onChange={(e) => set("value", e.target.value)} placeholder="650" /></Field>
        <Field label="Current value ($)"><input type="number" value={f.current_value} onChange={(e) => set("current_value", e.target.value)} placeholder="700" /></Field>
        <Field label="Carry holster used?"><select value={f.has_carry_holster ? "yes" : "no"} onChange={(e) => set("has_carry_holster", e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes — monthly check</option></select></Field>
        <Field label="Damaged?"><select value={f.damaged ? "yes" : "no"} onChange={(e) => set("damaged", e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></Field>
      </div>
      <Field label="Notes"><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Condition, included items, etc." /></Field>
      <div className="form-fld">
        <span>Firearm photo ({IMAGE_TYPES}, max {IMAGE_MAX_MB}MB)</span>
        {photoUrl ? (
          <div className="thumb form-photo"><img src={photoUrl} alt="Firearm" /><button onClick={removePhoto} type="button"><X size={12} /></button></div>
        ) : (
          <label className="upload"><ImageIcon size={15} /><span>{uploading ? "Uploading…" : "Add a photo"}</span><input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} disabled={uploading} /></label>
        )}
      </div>
      <div className="form-actions">
        <button className="ghost" onClick={onCancel} disabled={saving || uploading}>Cancel</button>
        <button className="primary" onClick={() => onSave(f)} disabled={saving || uploading || (!f.model && !f.nickname)}><Check size={15} /> {saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

function RangeLog({ data, setData, userId, onHelp }) {
  const rows = data.rangelog || [];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const fireName = (id) => { const f = (data.firearms || []).find((x) => x.id === id); return f ? (f.nickname || `${f.manufacturer} ${f.model}`) : "— deleted —"; };
  const enriched = useMemo(() => rows.map((m) => ({ ...m, firearm: fireName(m.firearm_id) })), [rows, data.firearms]);
  const t = useTable(enriched, ["firearm","range_name","notes"], "visit_date");
  const blank = { firearm_id:(data.firearms?.[0]?.id || ""), visit_date:today(), range_name:"", rounds:"", notes:"", photo_paths:[], loadout_id:"" };

  const save = async (rec) => {
    setSaving(true);
    try {
      const payload = {
        firearm_id: rec.firearm_id, visit_date: rec.visit_date, range_name: rec.range_name,
        rounds: rec.rounds ? parseInt(rec.rounds) : null, notes: rec.notes,
        photo_paths: rec.photo_paths || [], loadout_id: rec.loadout_id || null,
      };
      const isUpdate = rec.id && rec.id.length > 20;
      if (isUpdate) {
        await supabase.from("range_log").update(payload).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("range_log").insert([{ ...payload, user_id: userId }]).select();
        if (error) throw error;
        if (inserted?.length) rec.id = inserted[0].id;
        if (payload.loadout_id) {
          const lo = (data.loadouts || []).find(l => l.id === payload.loadout_id);
          if (lo) {
            const newCount = (lo.use_count || 0) + 1;
            await supabase.from("loadouts").update({ use_count: newCount }).eq("id", lo.id);
            setData((d) => ({ ...d, loadouts: d.loadouts.map(l => l.id === lo.id ? { ...l, use_count: newCount } : l) }));
          }
        }
      }
      setData((d) => {
        const exists = d.rangelog.some((x) => x.id === rec.id);
        return { ...d, rangelog: exists ? d.rangelog.map((x) => (x.id === rec.id ? { ...payload, id: rec.id, user_id: rec.user_id || userId } : x)) : [...d.rangelog, { ...payload, id: rec.id, user_id: userId }] };
      });
      setEditing(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this range visit?")) return;
    try {
      await supabase.from("range_log").delete().eq("id", id);
      setData((d) => ({ ...d, rangelog: d.rangelog.filter((x) => x.id !== id) }));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search range log…" addLabel="Add Range Visit" sortOptions={[{key:"visit_date",label:"Date"},{key:"firearm",label:"Firearm"},{key:"range_name",label:"Range"},{key:"rounds",label:"Rounds"}]} onAdd={() => data.firearms?.length ? setEditing({ ...blank, id: uid() }) : alert("Add a firearm first.")} onExportCSV={() => download("rangelog.csv", toCSV(enriched), "text/csv")} onExportJSON={() => download("rangelog.json", JSON.stringify(enriched, null, 2), "application/json")} />
      {t.view.length === 0 ? <Empty icon={MapPin} label="No range visits logged" hint="Log each range trip — location, rounds, target photos, load-out used." /> : (
        <div className="cards">{t.view.map((m) => {
          const lo = (data.loadouts || []).find(l => l.id === m.loadout_id);
          return (
            <div className="card" key={m.id}>
              <div className="card-top"><div className="card-ico range"><MapPin size={18} /></div><div className="card-title"><strong>{m.range_name || "Range visit"}</strong><span>{m.firearm}</span></div><span className="pill">{m.visit_date}</span></div>
              <div className="kv">
                <div><label>Rounds fired</label><span>{m.rounds ? Number(m.rounds).toLocaleString() : "—"}</span></div>
                <div><label>Targets</label><span>{m.photo_paths?.length || 0} photo{(m.photo_paths?.length || 0) === 1 ? "" : "s"}</span></div>
                {lo && <div><label>Load-out</label><span>{lo.name}</span></div>}
              </div>
              {m.photo_paths?.length > 0 && <div className="thumbs">{m.photo_paths.map((path, i) => { const url = supabase.storage.from("target-photos").getPublicUrl(path).data.publicUrl; return <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Target ${i + 1}`} /></a>; })}</div>}
              {m.notes && <p className="notes">{m.notes}</p>}
              <div className="card-actions"><button className="icon-btn" onClick={() => setEditing(rows.find((x) => x.id === m.id))}><Edit3 size={15} /></button><button className="icon-btn danger" onClick={() => remove(m.id)}><Trash2 size={15} /></button></div>
            </div>
          );
        })}</div>
      )}
      {editing && <Modal title={rows.some((x) => x.id === editing.id) ? "Edit Range Visit" : "Add Range Visit"} onClose={() => setEditing(null)}><RangeForm rec={editing} firearms={data.firearms || []} loadouts={data.loadouts || []} userId={userId} onSave={save} onCancel={() => setEditing(null)} saving={saving} /></Modal>}
      <HelpButton onClick={() => onHelp("rangelog")} />
    </div>
  );
}

function RangeForm({ rec, firearms, loadouts, userId, onSave, onCancel, saving }) {
  const [m, setM] = useState(rec);
  const set = (k, v) => setM((s) => ({ ...s, [k]: v }));
  const [uploadingImg, setUploadingImg] = useState(false);

  const addPhotos = async (files) => {
    setUploadingImg(true);
    const paths = [];
    try {
      for (const file of Array.from(files)) {
        const err = validateImage(file, TARGET_PHOTO_MAX_MB);
        if (err) { alert(`"${file.name}": ${err}`); continue; }
        const ext = file.name.split(".").pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${userId}/${m.id}/${filename}`;
        const { error } = await supabase.storage.from("target-photos").upload(path, file);
        if (error) { alert(`Upload failed: ${error.message}`); continue; }
        paths.push(path);
      }
      setM((s) => ({ ...s, photo_paths: [...(s.photo_paths || []), ...paths] }));
    } catch (e) { alert("Upload error: " + e.message); }
    setUploadingImg(false);
  };

  const removePhoto = async (idx) => {
    const path = m.photo_paths[idx];
    try {
      await supabase.storage.from("target-photos").remove([path]);
      setM((s) => ({ ...s, photo_paths: s.photo_paths.filter((_, i) => i !== idx) }));
    } catch (e) { alert("Delete failed: " + e.message); }
  };

  return (
    <div className="form">
      <div className="grid2">
        <Field label="Firearm"><select value={m.firearm_id} onChange={(e) => set("firearm_id", e.target.value)}>{firearms.map((f) => <option key={f.id} value={f.id}>{f.nickname || `${f.manufacturer} ${f.model}`}</option>)}</select></Field>
        <Field label="Date"><input type="date" value={m.visit_date} onChange={(e) => set("visit_date", e.target.value)} /></Field>
        <Field label="Range / Location"><input value={m.range_name} onChange={(e) => set("range_name", e.target.value)} placeholder="Red's Indoor Range" /></Field>
        <Field label="Rounds fired"><input type="number" value={m.rounds} onChange={(e) => set("rounds", e.target.value)} placeholder="150" /></Field>
        <Field label="Load-out used (optional)"><select value={m.loadout_id || ""} onChange={(e) => set("loadout_id", e.target.value)}><option value="">None</option>{loadouts.map(l => <option key={l.id} value={l.id}>{l.name}{l.favorite ? " ★" : ""}</option>)}</select></Field>
      </div>
      <Field label="Notes"><textarea rows={2} value={m.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Drills run, zero, malfunctions, how it shot…" /></Field>
      <div className="form-fld">
        <span>Target photos ({IMAGE_TYPES}, max {TARGET_PHOTO_MAX_MB}MB each)</span>
        <label className="upload"><ImageIcon size={15} /><span>{uploadingImg ? "Uploading…" : "Add target photos"}</span><input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" multiple style={{ display: "none" }} onChange={(e) => e.target.files && addPhotos(e.target.files)} disabled={uploadingImg} /></label>
        {m.photo_paths?.length > 0 && (
          <div className="thumbs edit">{m.photo_paths.map((path, i) => { const url = supabase.storage.from("target-photos").getPublicUrl(path).data.publicUrl; return <div className="thumb" key={i}><img src={url} alt={`Target ${i + 1}`} /><button onClick={() => removePhoto(i)} type="button"><X size={12} /></button></div>; })}</div>
        )}
      </div>
      <div className="form-actions">
        <button className="ghost" onClick={onCancel} disabled={saving || uploadingImg}>Cancel</button>
        <button className="primary" onClick={() => onSave(m)} disabled={saving || uploadingImg}><Check size={15} /> {saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

function AddOns({ data, setData, userId, onHelp }) {
  const all = data.accessories || [];
  const rows = all.filter(a => !a.for_sale && !a.sold);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const t = useTable(rows, ["name","type","brand","assigned_to"], "type");
  const blank = { name:"", type:"Scope", brand:"", quantity:1, assigned_to:"", value:"", notes:"", photo_path:"" };

  const save = async (rec) => {
    setSaving(true);
    try {
      const payload = {
        name: rec.name, type: rec.type, brand: rec.brand,
        quantity: parseInt(rec.quantity) || 1, assigned_to: rec.assigned_to,
        value: rec.value ? parseFloat(rec.value) : null, notes: rec.notes,
        photo_path: rec.photo_path || null,
      };
      if (rec.id && rec.id.length > 20) {
        await supabase.from("accessories").update(payload).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("accessories").insert([{ ...payload, user_id: userId }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.accessories.some((x) => x.id === rec.id);
        return { ...d, accessories: exists ? d.accessories.map((x) => (x.id === rec.id ? { ...x, ...payload, id: rec.id } : x)) : [...d.accessories, { ...payload, id: rec.id, user_id: userId }] };
      });
      setEditing(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this add-on?")) return;
    try {
      await supabase.from("accessories").delete().eq("id", id);
      setData((d) => ({ ...d, accessories: d.accessories.filter((x) => x.id !== id) }));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  const moveToForSale = async (item) => {
    try {
      await supabase.from("accessories").update({ for_sale: true, for_sale_listed_at: today() }).eq("id", item.id);
      setData((d) => ({ ...d, accessories: d.accessories.map(a => a.id === item.id ? { ...a, for_sale: true, for_sale_listed_at: today() } : a) }));
    } catch (e) { alert("Failed to move: " + e.message); }
  };

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search add-ons…" addLabel="Add Add-On" sortOptions={[{key:"type",label:"Type"},{key:"name",label:"Name"},{key:"brand",label:"Brand"},{key:"quantity",label:"Quantity"}]} onAdd={() => setEditing({ ...blank, id: uid() })} onExportCSV={() => download("addons.csv", toCSV(rows), "text/csv")} onExportJSON={() => download("addons.json", JSON.stringify(rows, null, 2), "application/json")} />
      {t.view.length === 0 ? <Empty icon={Package} label="No add-ons yet" hint="Scopes, holsters, grips, magazines and more." /> : (
        <div className="cards">{t.view.map((a) => {
          const photoUrl = a.photo_path ? supabase.storage.from("addon-photos").getPublicUrl(a.photo_path).data.publicUrl : null;
          return (
            <div className="card firearm-card" key={a.id}>
              {photoUrl && <div className="firearm-photo"><img src={photoUrl} alt={a.name} /></div>}
              <div className="card-inner">
                <div className="card-top"><div className="card-ico acc"><Package size={18} /></div><div className="card-title"><strong>{a.name || a.type}</strong><span>{a.brand || "—"}</span></div><span className="pill">{a.type}</span></div>
                <div className="kv"><div><label>Quantity</label><span>{a.quantity}</span></div><div><label>Assigned to</label><span>{a.assigned_to || "Unassigned"}</span></div><div><label>Est. value</label><span>{money(a.value)}</span></div></div>
                {a.notes && <p className="notes">{a.notes}</p>}
                <div className="card-actions">
                  <button className="icon-btn" onClick={() => setEditing(a)}><Edit3 size={15} /></button>
                  <button className="icon-btn danger" onClick={() => remove(a.id)}><Trash2 size={15} /></button>
                  <ThreeDotMenu items={[{ label:"Move to For Sale", icon:Tag, onClick: () => moveToForSale(a) }]} />
                </div>
              </div>
            </div>
          );
        })}</div>
      )}
      {editing && <Modal title={all.some((x) => x.id === editing.id) ? "Edit Add-On" : "Add Add-On"} onClose={() => setEditing(null)}><AddOnForm rec={editing} data={data} userId={userId} onSave={save} onCancel={() => setEditing(null)} saving={saving} /></Modal>}
      <HelpButton onClick={() => onHelp("addons")} />
    </div>
  );
}

function AddOnForm({ rec, data, userId, onSave, onCancel, saving }) {
  const [a, setA] = useState(rec);
  const set = (k, v) => setA((s) => ({ ...s, [k]: v }));
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file) return;
    const err = validateImage(file, IMAGE_MAX_MB);
    if (err) { alert(err); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${userId}/${a.id}/${filename}`;
      const { error } = await supabase.storage.from("addon-photos").upload(path, file);
      if (error) throw error;
      if (a.photo_path) await supabase.storage.from("addon-photos").remove([a.photo_path]).catch(() => {});
      set("photo_path", path);
    } catch (e) { alert("Upload failed: " + e.message); }
    setUploading(false);
  };

  const removePhoto = async () => {
    if (!a.photo_path) return;
    try { await supabase.storage.from("addon-photos").remove([a.photo_path]); } catch {}
    set("photo_path", "");
  };

  const photoUrl = a.photo_path ? supabase.storage.from("addon-photos").getPublicUrl(a.photo_path).data.publicUrl : null;

  return (
    <div className="form">
      <div className="grid2">
        <Field label="Name"><input value={a.name} onChange={(e) => set("name", e.target.value)} placeholder="Vortex Venom" /></Field>
        <Field label="Type"><select value={a.type} onChange={(e) => set("type", e.target.value)}>{ACCESSORY_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Brand"><input value={a.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Vortex" /></Field>
        <Field label="Quantity"><input type="number" value={a.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
        <Field label="Assigned to firearm"><select value={a.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}><option value="">Unassigned</option>{(data.firearms || []).filter(f => !f.sold).map((f) => <option key={f.id} value={f.nickname || `${f.manufacturer} ${f.model}`}>{f.nickname || `${f.manufacturer} ${f.model}`}</option>)}</select></Field>
        <Field label="Estimated value ($)"><input type="number" value={a.value} onChange={(e) => set("value", e.target.value)} /></Field>
      </div>
      <Field label="Notes"><textarea rows={2} value={a.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      <div className="form-fld">
        <span>Add-On photo ({IMAGE_TYPES}, max {IMAGE_MAX_MB}MB)</span>
        {photoUrl ? (
          <div className="thumb form-photo"><img src={photoUrl} alt="Add-On" /><button onClick={removePhoto} type="button"><X size={12} /></button></div>
        ) : (
          <label className="upload"><ImageIcon size={15} /><span>{uploading ? "Uploading…" : "Add a photo"}</span><input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} disabled={uploading} /></label>
        )}
      </div>
      <div className="form-actions"><button className="ghost" onClick={onCancel} disabled={saving || uploading}>Cancel</button><button className="primary" onClick={() => onSave(a)} disabled={saving || uploading}><Check size={15} /> {saving ? "Saving…" : "Save"}</button></div>
    </div>
  );
}

function Ammunition({ data, setData, userId, onHelp }) {
  const rows = data.ammo || [];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const t = useTable(rows, ["caliber","type","brand","location"], "caliber");
  const LOW = 100;
  const blank = { caliber:"9mm", type:"FMJ", brand:"", grain:"", quantity:0, location:"", value:"" };

  const save = async (rec) => {
    setSaving(true);
    try {
      const payload = { caliber: rec.caliber, type: rec.type, brand: rec.brand, grain: rec.grain, quantity: parseInt(rec.quantity) || 0, location: rec.location, value: rec.value ? parseFloat(rec.value) : null };
      if (rec.id && rec.id.length > 20) {
        await supabase.from("ammo").update(payload).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("ammo").insert([{ ...payload, user_id: userId }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.ammo.some((x) => x.id === rec.id);
        return { ...d, ammo: exists ? d.ammo.map((x) => (x.id === rec.id ? { ...x, ...payload, id: rec.id } : x)) : [...d.ammo, { ...payload, id: rec.id, user_id: userId }] };
      });
      setEditing(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this ammunition?")) return;
    try {
      await supabase.from("ammo").delete().eq("id", id);
      setData((d) => ({ ...d, ammo: d.ammo.filter((x) => x.id !== id) }));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search ammunition…" addLabel="Add Ammunition" sortOptions={[{key:"caliber",label:"Caliber"},{key:"type",label:"Type"},{key:"quantity",label:"Quantity"},{key:"location",label:"Location"}]} onAdd={() => setEditing({ ...blank, id: uid() })} onExportCSV={() => download("ammunition.csv", toCSV(rows), "text/csv")} onExportJSON={() => download("ammunition.json", JSON.stringify(rows, null, 2), "application/json")} />
      {t.view.length === 0 ? <Empty icon={Boxes} label="No ammunition logged" hint="Track caliber, type, quantity and storage location." /> : (
        <table className="grid-table">
          <thead><tr><th>Caliber</th><th>Type</th><th>Brand</th><th>Grain</th><th>Quantity</th><th>Location</th><th></th></tr></thead>
          <tbody>{t.view.map((a) => (
            <tr key={a.id} className={Number(a.quantity) < LOW ? "low" : ""}>
              <td><strong>{a.caliber}</strong></td><td>{a.type}</td><td>{a.brand || "—"}</td><td>{a.grain || "—"}</td>
              <td>{Number(a.quantity).toLocaleString()}{Number(a.quantity) < LOW && <span className="low-flag"><AlertTriangle size={12} /> low</span>}</td>
              <td className="dim">{a.location || "—"}</td>
              <td className="row-actions"><button className="icon-btn" onClick={() => setEditing(a)}><Edit3 size={14} /></button><button className="icon-btn danger" onClick={() => remove(a.id)}><Trash2 size={14} /></button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
      {editing && (
        <Modal title={rows.some((x) => x.id === editing.id) ? "Edit Ammunition" : "Add Ammunition"} onClose={() => setEditing(null)}>
          <div className="form">
            <div className="grid2">
              <Field label="Caliber / Gauge"><select value={editing.caliber} onChange={(e) => setEditing({ ...editing, caliber: e.target.value })}>{CALIBERS.map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="Type"><select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>{AMMO_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="Brand"><input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} placeholder="Federal" /></Field>
              <Field label="Grain weight"><input value={editing.grain} onChange={(e) => setEditing({ ...editing, grain: e.target.value })} placeholder="115gr" /></Field>
              <Field label="Quantity (rounds)"><input type="number" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: e.target.value })} /></Field>
              <Field label="Storage location"><input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Safe — ammo can A" /></Field>
            </div>
            <div className="form-actions"><button className="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="primary" onClick={() => save(editing)} disabled={saving}><Check size={15} /> {saving ? "Saving…" : "Save"}</button></div>
          </div>
        </Modal>
      )}
      <HelpButton onClick={() => onHelp("ammunition")} />
    </div>
  );
}

function UpKeep({ data, setData, onHelp }) {
  const rows = (data.firearms || []).filter(f => !f.sold);
  const [savingId, setSavingId] = useState(null);

  const updateField = async (firearm, field, value) => {
    setSavingId(firearm.id);
    try {
      await supabase.from("firearms").update({ [field]: value || null }).eq("id", firearm.id);
      setData((d) => ({ ...d, firearms: d.firearms.map((f) => f.id === firearm.id ? { ...f, [field]: value || null } : f) }));
    } catch (e) { alert("Failed to update: " + e.message); }
    setSavingId(null);
  };

  const setToday = (firearm, field) => updateField(firearm, field, today());

  if (rows.length === 0) return <div className="tab"><Empty icon={Wrench} label="No firearms yet" hint="Add firearms first to track up-keep." /><HelpButton onClick={() => onHelp("upkeep")} /></div>;

  return (
    <div className="tab">
      <div className="maint-help">
        <span><Sparkles size={13} /> Auto-flag rules</span>
        <span>• <strong>Cleaning</strong> — every month after a range visit</span>
        <span>• <strong>Chamber wipe</strong> — 6 months from last cleaning</span>
        <span>• <strong>Oiling</strong> — cleaned more than 6 months ago, not fired since</span>
        <span>• <strong>Yearly tear-down</strong> — 1 year from acquired (or last tear-down)</span>
        <span>• <strong>Safe audit</strong> — every 3 months</span>
        <span>• <strong>Optic check</strong> — every 6 months when scope/red dot assigned</span>
        <span>• <strong>Holster check</strong> — every month when carry holster in use</span>
      </div>
      <div className="maint-table-wrap">
      <table className="grid-table maint-table">
        <thead><tr><th>Firearm</th><th>Last Cleaned</th><th>Last Oiled</th><th>Last Tear-Down</th><th>Last Safe Audit</th><th>Last Optic</th><th>Last Holster</th><th>Status</th></tr></thead>
        <tbody>{rows.map((f) => {
          const flags = getUpkeepFlags(f, data.rangelog, data.accessories);
          const saving = savingId === f.id;
          const firearmLabel = f.nickname || `${f.manufacturer} ${f.model}`;
          const hasOptic = (data.accessories || []).some(a => (a.type === "Scope" || a.type === "Red Dot") && a.assigned_to === firearmLabel);
          return (
            <tr key={f.id}>
              <td><strong>{firearmLabel}</strong><div className="dim" style={{fontSize:"11px"}}>{f.manufacturer} {f.model}</div></td>
              <td><div className="maint-cell"><input type="date" value={f.last_cleaned || ""} onChange={(e) => updateField(f, "last_cleaned", e.target.value)} disabled={saving} /><button className="ghost small" onClick={() => setToday(f, "last_cleaned")} disabled={saving}><Wrench size={12} /></button></div></td>
              <td><div className="maint-cell"><input type="date" value={f.last_oiled || ""} onChange={(e) => updateField(f, "last_oiled", e.target.value)} disabled={saving} /><button className="ghost small" onClick={() => setToday(f, "last_oiled")} disabled={saving}><Droplet size={12} /></button></div></td>
              <td><div className="maint-cell"><input type="date" value={f.last_torn_down || ""} onChange={(e) => updateField(f, "last_torn_down", e.target.value)} disabled={saving} /><button className="ghost small" onClick={() => setToday(f, "last_torn_down")} disabled={saving}><ShieldCheck size={12} /></button></div></td>
              <td><div className="maint-cell"><input type="date" value={f.last_safe_audit || ""} onChange={(e) => updateField(f, "last_safe_audit", e.target.value)} disabled={saving} /><button className="ghost small" onClick={() => setToday(f, "last_safe_audit")} disabled={saving}><Warehouse size={12} /></button></div></td>
              <td>{hasOptic ? <div className="maint-cell"><input type="date" value={f.last_optic_check || ""} onChange={(e) => updateField(f, "last_optic_check", e.target.value)} disabled={saving} /><button className="ghost small" onClick={() => setToday(f, "last_optic_check")} disabled={saving}><Eye size={12} /></button></div> : <span className="dim small">—</span>}</td>
              <td>{f.has_carry_holster ? <div className="maint-cell"><input type="date" value={f.last_holster_check || ""} onChange={(e) => updateField(f, "last_holster_check", e.target.value)} disabled={saving} /><button className="ghost small" onClick={() => setToday(f, "last_holster_check")} disabled={saving}><Hand size={12} /></button></div> : <span className="dim small">—</span>}</td>
              <td>{flags.length === 0 ? <span className="ok-flag">✓ Good</span> : flags.map(fl => <span key={fl.key} className={`maint-flag sev-${fl.severity}`}><AlertTriangle size={11} /> {fl.label}</span>)}</td>
            </tr>
          );
        })}</tbody>
      </table>
      </div>
      <HelpButton onClick={() => onHelp("upkeep")} />
    </div>
  );
}

function RangeLoadOut({ data, setData, userId, onHelp }) {
  const all = data.loadouts || [];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const t = useTable(all, ["name","notes"], "favorite");
  const blank = { name:"", favorite:false, items:[], notes:"" };

  const save = async (rec) => {
    setSaving(true);
    try {
      const payload = { name: rec.name, favorite: !!rec.favorite, items: rec.items || [], notes: rec.notes };
      if (rec.id && rec.id.length > 20) {
        await supabase.from("loadouts").update(payload).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("loadouts").insert([{ ...payload, user_id: userId, use_count: 0 }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.loadouts.some((x) => x.id === rec.id);
        return { ...d, loadouts: exists ? d.loadouts.map((x) => (x.id === rec.id ? { ...x, ...payload, id: rec.id } : x)) : [...d.loadouts, { ...payload, id: rec.id, user_id: userId, use_count: 0 }] };
      });
      setEditing(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this load-out?")) return;
    try {
      await supabase.from("loadouts").delete().eq("id", id);
      setData((d) => ({ ...d, loadouts: d.loadouts.filter((x) => x.id !== id) }));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  const toggleFavorite = async (lo) => {
    try {
      await supabase.from("loadouts").update({ favorite: !lo.favorite }).eq("id", lo.id);
      setData((d) => ({ ...d, loadouts: d.loadouts.map(l => l.id === lo.id ? { ...l, favorite: !l.favorite } : l) }));
    } catch (e) { alert("Failed: " + e.message); }
  };

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search load-outs…" addLabel="Build Load-Out" sortOptions={[{key:"name",label:"Name"},{key:"use_count",label:"Most used"},{key:"favorite",label:"Favorites first"}]} onAdd={() => setEditing({ ...blank, id: uid() })} />
      {t.view.length === 0 ? <Empty icon={Backpack} label="No load-outs yet" hint="Build a load-out — pick firearms and the suggested ammo rounds to pack." /> : (
        <div className="cards">{t.view.map((lo) => (
          <div className="card" key={lo.id}>
            <div className="card-top">
              <div className="card-ico fire"><Backpack size={18} /></div>
              <div className="card-title"><strong>{lo.name}</strong><span>{lo.items?.length || 0} firearm{lo.items?.length === 1 ? "" : "s"}</span></div>
              <button className="fav-btn" onClick={() => toggleFavorite(lo)} title={lo.favorite ? "Unfavorite" : "Favorite"}><Star size={16} fill={lo.favorite ? "currentColor" : "none"} /></button>
            </div>
            <div className="loadout-items">{lo.items?.map((it, i) => { const f = (data.firearms || []).find(x => x.id === it.firearm_id); if (!f) return null; return <div className="loadout-item" key={i}><span className="lo-firearm">{f.nickname || `${f.manufacturer} ${f.model}`}</span><span className="lo-caliber">{f.caliber}</span><span className="lo-rounds">{Number(it.suggested_rounds || 0).toLocaleString()} rds</span></div>; })}</div>
            <div className="kv">
              <div><label>Total rounds</label><span>{(lo.items || []).reduce((s,i) => s + (Number(i.suggested_rounds) || 0), 0).toLocaleString()}</span></div>
              <div><label>Times used</label><span>{lo.use_count || 0}</span></div>
            </div>
            {lo.notes && <p className="notes">{lo.notes}</p>}
            <div className="card-actions"><button className="icon-btn" onClick={() => setEditing(lo)}><Edit3 size={15} /></button><button className="icon-btn danger" onClick={() => remove(lo.id)}><Trash2 size={15} /></button></div>
          </div>
        ))}</div>
      )}
      {editing && <Modal title={all.some(x => x.id === editing.id) ? "Edit Load-Out" : "Build Load-Out"} onClose={() => setEditing(null)} wide><LoadoutForm rec={editing} firearms={(data.firearms || []).filter(f => !f.sold)} rangelog={data.rangelog || []} onSave={save} onCancel={() => setEditing(null)} saving={saving} /></Modal>}
      <HelpButton onClick={() => onHelp("loadout")} />
    </div>
  );
}

function LoadoutForm({ rec, firearms, rangelog, onSave, onCancel, saving }) {
  const [lo, setLo] = useState({ ...rec, items: (rec.items || []).map(it => ({ ...it })) });

  const suggestRounds = (firearm) => {
    const visits = rangelog.filter(m => m.firearm_id === firearm.id && m.rounds);
    if (visits.length >= 2) {
      const recent = visits.sort((a,b) => new Date(b.visit_date) - new Date(a.visit_date)).slice(0, 5);
      const avg = recent.reduce((s, m) => s + (Number(m.rounds) || 0), 0) / recent.length;
      return Math.round(avg / 10) * 10;
    }
    return DEFAULT_RANGE_ROUNDS[firearm.type] || 50;
  };

  const toggleFirearm = (firearm) => {
    setLo(s => {
      const exists = s.items.find(i => i.firearm_id === firearm.id);
      if (exists) return { ...s, items: s.items.filter(i => i.firearm_id !== firearm.id) };
      return { ...s, items: [...s.items, { firearm_id: firearm.id, suggested_rounds: suggestRounds(firearm) }] };
    });
  };

  const updateRounds = (firearmId, rounds) => {
    setLo(s => ({ ...s, items: s.items.map(i => i.firearm_id === firearmId ? { ...i, suggested_rounds: parseInt(rounds) || 0 } : i) }));
  };

  return (
    <div className="form">
      <div className="grid2">
        <Field label="Load-out name"><input value={lo.name} onChange={(e) => setLo({ ...lo, name: e.target.value })} placeholder="Weekend defensive practice" /></Field>
        <Field label="Favorite?"><select value={lo.favorite ? "yes" : "no"} onChange={(e) => setLo({ ...lo, favorite: e.target.value === "yes" })}><option value="no">No</option><option value="yes">Yes</option></select></Field>
      </div>
      <div className="form-fld">
        <span>Pick firearms and confirm round count</span>
        <div className="loadout-picker">
          {firearms.map((f) => {
            const item = lo.items.find(i => i.firearm_id === f.id);
            const checked = !!item;
            return (
              <div key={f.id} className={`pick-row ${checked ? "on" : ""}`}>
                <button type="button" className="pick-toggle" onClick={() => toggleFirearm(f)}>
                  {checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  <span className="pick-name">{f.nickname || `${f.manufacturer} ${f.model}`}</span>
                  <span className="pick-cal">{f.caliber}</span>
                </button>
                {checked && <div className="pick-rounds"><input type="number" value={item.suggested_rounds} onChange={(e) => updateRounds(f.id, e.target.value)} /><span>rounds</span></div>}
              </div>
            );
          })}
          {firearms.length === 0 && <div className="empty">Add a firearm first.</div>}
        </div>
      </div>
      <Field label="Notes"><textarea rows={2} value={lo.notes} onChange={(e) => setLo({ ...lo, notes: e.target.value })} /></Field>
      <div className="form-actions"><button className="ghost" onClick={onCancel} disabled={saving}>Cancel</button><button className="primary" onClick={() => onSave(lo)} disabled={saving || !lo.name}><Check size={15} /> {saving ? "Saving…" : "Save"}</button></div>
    </div>
  );
}

function SuppliesNeeded({ data, setData, userId, onHelp }) {
  const all = data.supplies || [];
  const active = all.filter(s => !s.purchased);
  const archived = all.filter(s => s.purchased);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const t = useTable(active, ["name","category","notes"], "category");
  const blank = { name:"", category:"Cleaning", notes:"", est_cost:"" };

  const save = async (rec) => {
    setSaving(true);
    try {
      const payload = { name: rec.name, category: rec.category, notes: rec.notes, est_cost: rec.est_cost ? parseFloat(rec.est_cost) : null };
      if (rec.id && rec.id.length > 20) {
        await supabase.from("supplies").update(payload).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("supplies").insert([{ ...payload, user_id: userId, purchased: false }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.supplies.some((x) => x.id === rec.id);
        return { ...d, supplies: exists ? d.supplies.map((x) => (x.id === rec.id ? { ...x, ...payload, id: rec.id } : x)) : [...d.supplies, { ...payload, id: rec.id, user_id: userId, purchased: false }] };
      });
      setEditing(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const togglePurchased = async (item) => {
    const now = !item.purchased;
    try {
      await supabase.from("supplies").update({ purchased: now, purchased_at: now ? today() : null }).eq("id", item.id);
      setData((d) => ({ ...d, supplies: d.supplies.map(s => s.id === item.id ? { ...s, purchased: now, purchased_at: now ? today() : null } : s) }));
    } catch (e) { alert("Failed: " + e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this supply item?")) return;
    try {
      await supabase.from("supplies").delete().eq("id", id);
      setData((d) => ({ ...d, supplies: d.supplies.filter((x) => x.id !== id) }));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search shopping list…" addLabel="Add Item" sortOptions={[{key:"category",label:"Category"},{key:"name",label:"Name"},{key:"est_cost",label:"Cost"}]} onAdd={() => setEditing({ ...blank, id: uid() })} />
      {active.length === 0 ? <Empty icon={ShoppingCart} label="Nothing on your list" hint="Add items to buy. Check them off when purchased." /> : (
        <div className="supplies-list">{t.view.map((s) => (
          <div className="supply-row" key={s.id}>
            <button className="check-btn" onClick={() => togglePurchased(s)}><Circle size={18} /></button>
            <div className="supply-main">
              <strong>{s.name}</strong>
              <div className="supply-meta"><span className="pill small">{s.category}</span>{s.est_cost && <span className="dim">{money(s.est_cost)}</span>}{s.notes && <span className="dim">— {s.notes}</span>}</div>
            </div>
            <button className="icon-btn" onClick={() => setEditing(s)}><Edit3 size={14} /></button>
            <button className="icon-btn danger" onClick={() => remove(s.id)}><Trash2 size={14} /></button>
          </div>
        ))}</div>
      )}
      {archived.length > 0 && (
        <div className="archive-section">
          <button className="archive-toggle" onClick={() => setShowArchive(s => !s)}>{showArchive ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Purchased ({archived.length})</button>
          {showArchive && (
            <div className="supplies-list dim-list">{archived.map(s => (
              <div className="supply-row done" key={s.id}>
                <button className="check-btn" onClick={() => togglePurchased(s)}><CheckCircle2 size={18} /></button>
                <div className="supply-main"><strong>{s.name}</strong><div className="supply-meta"><span className="pill small">{s.category}</span><span className="dim">purchased {s.purchased_at}</span></div></div>
                <button className="icon-btn danger" onClick={() => remove(s.id)}><Trash2 size={14} /></button>
              </div>
            ))}</div>
          )}
        </div>
      )}
      {editing && (
        <Modal title={all.some(x => x.id === editing.id) ? "Edit Supply" : "Add Supply"} onClose={() => setEditing(null)}>
          <div className="form">
            <div className="grid2">
              <Field label="Name"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Hoppe's No. 9" /></Field>
              <Field label="Category"><select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{SUPPLY_CATEGORIES.map(x => <option key={x}>{x}</option>)}</select></Field>
              <Field label="Estimated cost ($)"><input type="number" value={editing.est_cost} onChange={(e) => setEditing({ ...editing, est_cost: e.target.value })} /></Field>
            </div>
            <Field label="Notes"><textarea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            <div className="form-actions"><button className="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="primary" onClick={() => save(editing)} disabled={saving || !editing.name}><Check size={15} /> {saving ? "Saving…" : "Save"}</button></div>
          </div>
        </Modal>
      )}
      <HelpButton onClick={() => onHelp("supplies")} />
    </div>
  );
}

function ForSale({ data, setData, onHelp }) {
  const firearmsForSale = (data.firearms || []).filter(f => f.for_sale && !f.sold);
  const addonsForSale = (data.accessories || []).filter(a => a.for_sale && !a.sold);
  const firearmsSold = (data.firearms || []).filter(f => f.sold);
  const addonsSold = (data.accessories || []).filter(a => a.sold);
  const [showSold, setShowSold] = useState(false);
  const [markingSold, setMarkingSold] = useState(null);
  const [soldPrice, setSoldPrice] = useState("");

  const returnToInventory = async (kind, id) => {
    const table = kind === "firearm" ? "firearms" : "accessories";
    try {
      await supabase.from(table).update({ for_sale: false, for_sale_listed_at: null }).eq("id", id);
      const key = kind === "firearm" ? "firearms" : "accessories";
      setData((d) => ({ ...d, [key]: d[key].map(x => x.id === id ? { ...x, for_sale: false, for_sale_listed_at: null } : x) }));
    } catch (e) { alert("Failed: " + e.message); }
  };

  const confirmSold = async () => {
    const { kind, id } = markingSold;
    const table = kind === "firearm" ? "firearms" : "accessories";
    const key = kind === "firearm" ? "firearms" : "accessories";
    try {
      await supabase.from(table).update({ sold: true, sold_at: today(), sold_price: soldPrice ? parseFloat(soldPrice) : null, for_sale: false }).eq("id", id);
      setData((d) => ({ ...d, [key]: d[key].map(x => x.id === id ? { ...x, sold: true, sold_at: today(), sold_price: soldPrice ? parseFloat(soldPrice) : null, for_sale: false } : x) }));
      setMarkingSold(null); setSoldPrice("");
    } catch (e) { alert("Failed: " + e.message); }
  };

  const totalListed = firearmsForSale.reduce((s, f) => s + (Number(f.current_value || f.value) || 0), 0) + addonsForSale.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const totalSold = firearmsSold.reduce((s, f) => s + (Number(f.sold_price) || 0), 0) + addonsSold.reduce((s, a) => s + (Number(a.sold_price) || 0), 0);

  return (
    <div className="tab">
      <div className="dash-stats" style={{ marginBottom: 18 }}>
        <Stat icon={Tag} label="Items listed" value={firearmsForSale.length + addonsForSale.length} accent="#c8643c" />
        <Stat icon={Boxes} label="Estimated value" value={money(totalListed)} accent="#b89a4a" />
        <Stat icon={CheckCircle2} label="Sold total" value={money(totalSold)} accent="#5b8a72" />
      </div>
      {firearmsForSale.length === 0 && addonsForSale.length === 0 ? (
        <Empty icon={Tag} label="Nothing listed for sale" hint="From any firearm or add-on, click the 3-dot menu → Move to For Sale." />
      ) : (
        <>
          {firearmsForSale.length > 0 && (<>
            <h3 className="section-title">Firearms ({firearmsForSale.length})</h3>
            <div className="cards">{firearmsForSale.map(f => (
              <div className="card" key={f.id}>
                <div className="card-top"><div className="card-ico fire"><Crosshair size={18} /></div><div className="card-title"><strong>{f.nickname || f.model}</strong><span>{f.manufacturer} {f.model}</span></div><span className="pill">{f.type}</span></div>
                <div className="kv"><div><label>Listed</label><span>{f.for_sale_listed_at}</span></div><div><label>Asking</label><span>{money(f.current_value || f.value)}</span></div><div><label>Caliber</label><span>{f.caliber}</span></div><div><label>Serial</label><span>{f.serial || "—"}</span></div></div>
                <div className="card-actions">
                  <button className="primary small" onClick={() => { setMarkingSold({ kind:"firearm", id:f.id, item:f }); setSoldPrice(String(f.current_value || f.value || "")); }}><CheckCircle2 size={14} /> Mark Sold</button>
                  <button className="ghost small" onClick={() => returnToInventory("firearm", f.id)}><ArrowLeft size={14} /> Return</button>
                </div>
              </div>
            ))}</div>
          </>)}
          {addonsForSale.length > 0 && (<>
            <h3 className="section-title">Add-Ons ({addonsForSale.length})</h3>
            <div className="cards">{addonsForSale.map(a => (
              <div className="card" key={a.id}>
                <div className="card-top"><div className="card-ico acc"><Package size={18} /></div><div className="card-title"><strong>{a.name}</strong><span>{a.brand || "—"}</span></div><span className="pill">{a.type}</span></div>
                <div className="kv"><div><label>Listed</label><span>{a.for_sale_listed_at}</span></div><div><label>Asking</label><span>{money(a.value)}</span></div><div><label>Quantity</label><span>{a.quantity}</span></div></div>
                <div className="card-actions">
                  <button className="primary small" onClick={() => { setMarkingSold({ kind:"accessory", id:a.id, item:a }); setSoldPrice(String(a.value || "")); }}><CheckCircle2 size={14} /> Mark Sold</button>
                  <button className="ghost small" onClick={() => returnToInventory("accessory", a.id)}><ArrowLeft size={14} /> Return</button>
                </div>
              </div>
            ))}</div>
          </>)}
        </>
      )}
      {(firearmsSold.length > 0 || addonsSold.length > 0) && (
        <div className="archive-section" style={{ marginTop: 24 }}>
          <button className="archive-toggle" onClick={() => setShowSold(s => !s)}>{showSold ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Sold archive ({firearmsSold.length + addonsSold.length})</button>
          {showSold && (
            <div className="cards" style={{ marginTop: 12 }}>
              {firearmsSold.map(f => (
                <div className="card sold-card" key={f.id}>
                  <div className="card-top"><div className="card-ico fire"><Crosshair size={18} /></div><div className="card-title"><strong>{f.nickname || f.model}</strong><span>{f.manufacturer} {f.model}</span></div><span className="pill sold">Sold</span></div>
                  <div className="kv"><div><label>Sold on</label><span>{f.sold_at}</span></div><div><label>Sale price</label><span>{money(f.sold_price)}</span></div></div>
                </div>
              ))}
              {addonsSold.map(a => (
                <div className="card sold-card" key={a.id}>
                  <div className="card-top"><div className="card-ico acc"><Package size={18} /></div><div className="card-title"><strong>{a.name}</strong><span>{a.brand || "—"}</span></div><span className="pill sold">Sold</span></div>
                  <div className="kv"><div><label>Sold on</label><span>{a.sold_at}</span></div><div><label>Sale price</label><span>{money(a.sold_price)}</span></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {markingSold && (
        <Modal title="Mark as Sold" onClose={() => setMarkingSold(null)}>
          <div className="form">
            <p className="dim" style={{fontSize:13}}>This will archive <strong>{markingSold.item.nickname || markingSold.item.name || markingSold.item.model}</strong> as sold.</p>
            <Field label="Sale price ($)"><input type="number" value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} placeholder="650" autoFocus /></Field>
            <div className="form-actions"><button className="ghost" onClick={() => setMarkingSold(null)}>Cancel</button><button className="primary" onClick={confirmSold}><Check size={15} /> Confirm Sold</button></div>
          </div>
        </Modal>
      )}
      <HelpButton onClick={() => onHelp("forsale")} />
    </div>
  );
}

function Admin({ currentUser, onHelp }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (u) => {
    if (u.email === "pierfelicejohnny@yahoo.com") { alert("The owner account can't be demoted."); return; }
    const newRole = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Change ${u.email} to ${newRole}?`)) return;
    try {
      await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    } catch (e) { alert("Failed: " + e.message); }
  };

  const filtered = users.filter(u => !query || (u.email || "").toLowerCase().includes(query.toLowerCase()));
  const adminCount = users.filter(u => u.role === "admin").length;
  const userCount = users.filter(u => u.role === "user").length;

  return (
    <div className="tab">
      <div className="dash-stats" style={{marginBottom: 18}}>
        <Stat icon={Users} label="Total accounts" value={users.length} accent="#c8643c" />
        <Stat icon={Shield} label="Admins" value={adminCount} accent="#b89a4a" />
        <Stat icon={Target} label="Standard users" value={userCount} accent="#5b8a72" />
      </div>
      <div className="toolbar"><div className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email…" /></div></div>
      {loading ? <div className="dim">Loading…</div> : (
        <table className="grid-table">
          <thead><tr><th>Email</th><th>Role</th><th>Signed up</th><th></th></tr></thead>
          <tbody>{filtered.map(u => (
            <tr key={u.id}>
              <td><strong>{u.email}</strong>{u.email === currentUser.email && <span className="pill" style={{marginLeft:8}}>You</span>}</td>
              <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
              <td className="mono">{u.created_at?.slice(0,10)}</td>
              <td className="row-actions"><button className="ghost small" onClick={() => toggleRole(u)} disabled={u.email === "pierfelicejohnny@yahoo.com"}>{u.role === "admin" ? "Demote" : "Promote"}</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
      <p className="dim" style={{fontSize:12, marginTop:14}}>You can see accounts exist, but never their inventory. Each user's data is isolated by Row Level Security.</p>
      <HelpButton onClick={() => onHelp("admin")} />
    </div>
  );
}

function Changelog({ onHelp }) {
  return (
    <div className="tab">
      <div className="changelog">{CHANGELOG.map((rel) => (
        <div className="release" key={rel.version}>
          <div className="release-rail"><div className={`release-dot ${rel.tag === "current" ? "cur" : ""}`} /></div>
          <div className="release-body">
            <div className="release-head"><span className="ver">v{rel.version}</span><h3>{rel.title}</h3>{rel.tag === "current" && <span className="cur-badge">Current</span>}<span className="rel-date">{rel.date}</span></div>
            <ul className="change-list">{rel.changes.map((c, i) => <li key={i}><span className={`ct ct-${c.type}`}>{c.type}</span><span>{c.text}</span></li>)}</ul>
          </div>
        </div>
      ))}</div>
      <HelpButton onClick={() => onHelp("changelog")} />
    </div>
  );
}

const SUPPORT_ARTICLES = {
  terms: { title: "Terms of Use", body: `Welcome to The Gun Shed. By creating an account and using this application, you agree to the following terms.

**1. Acceptable use.** The Gun Shed is a personal inventory and recordkeeping tool. You may use it only to track firearms, ammunition, and accessories you lawfully own.

**2. Accuracy of information.** You are solely responsible for the accuracy of the data you enter, including serial numbers, dates, and valuations.

**3. Account responsibility.** You are responsible for safeguarding your email and password.

**4. Local laws.** You are responsible for understanding and complying with all federal, state, and local laws applicable to your firearms.

**5. No professional advice.** The Gun Shed provides reminders and suggestions for convenience only. These are not a substitute for professional advice.

**6. Insurance manifest.** The PDF export feature is provided as a convenience and is not a guarantee of insurance acceptance.

**7. Service availability.** Provided "as is" without warranty. May be suspended or modified.

**8. Limitation of liability.** To the maximum extent permitted by law, the operator is not liable for indirect damages.

**9. Changes to terms.** May be updated. Continued use constitutes acceptance.

**10. Termination.** You may delete your account at any time.` },
  privacy: { title: "Privacy Policy", body: `**What we collect.** Your email, encrypted password, and the inventory data you enter (firearms, range visits, accessories, ammunition, photos, load-outs, supplies).

**Where data is stored.** Postgres database and object storage operated by Supabase, with HTTPS encryption in transit and at rest.

**Who can see your data.** Only you. Row Level Security blocks all cross-user access. Administrators can see that accounts exist (email and signup date) but never your inventory.

**Sharing.** We do not sell, rent, or share your data with advertisers.

**Photos.** Stored in private storage buckets, served via signed URLs.

**Cookies.** Only authentication cookies. No analytics or advertising trackers.

**Data deletion.** Delete records anytime. For account deletion, contact the administrator.

**Data export.** Export inventory anytime via CSV, JSON, or PDF manifest.

**Children.** Not intended for users under 18.

**Contact.** pierfelicejohnny@yahoo.com` },
  dashboard: { title: "Dashboard", body: `The Dashboard is your at-a-glance overview.

**Stat cards.** Six summary cards showing firearms, range visits, add-ons, ammunition, rounds fired, and value. Each clickable to jump to that tab.

**Action Required cards.** Highlighted when items need attention — cleaning, oiling, damaged firearms, low ammo.

**Damaged Firearms.** Shows count of any firearm flagged as damaged.

**Up-Keep Alerts.** Detailed list of all maintenance issues. Click to jump to the relevant tab.

**Recent Range Visits.** Your last six range trips.

**Insurance Manifest button.** Generates a one-click PDF with serial numbers, purchase prices, current values, and acquisition dates.` },
  firearms: { title: "Firearms", body: `**Add Firearm button.** Opens a form with: nickname, type, manufacturer, model, serial, caliber, date acquired, purchase price, current value, carry holster usage, damaged flag, notes, and photo.

**Photo upload.** Supports ${IMAGE_TYPES}, max ${IMAGE_MAX_MB}MB.

**Search & Sort.** Filter and reorder firearms.

**Status pill.** Green check (ready), orange drop (needs oil), red wrench (maintenance), red lightning (damaged).

**Caliber hover.** Shows ammo on hand for that caliber.

**Three-dot menu.** Move to For Sale.

**Export.** CSV or JSON.` },
  rangelog: { title: "Range Log", body: `**Add Range Visit button.** Required: firearm, date, range name, rounds fired. Optional: load-out used, notes, target photos.

**Target photos.** ${IMAGE_TYPES}, max ${TARGET_PHOTO_MAX_MB}MB each.

**Why this matters.** Range visits drive cleaning schedules — log them or auto-flags won't work.

**Load-out tracking.** Picking a saved load-out increments its "times used" counter.` },
  upkeep: { title: "Up-Keep", body: `Track maintenance per firearm.

**Date columns.** Last Cleaned, Last Oiled, Last Tear-Down, Last Safe Audit, Last Optic Check (if scope assigned), Last Holster Check (if carry holster).

**Icon buttons.** Click to instantly mark today.

**Auto-flags:**
- Cleaning — every month after a range visit
- Chamber wipe — 6 months from last cleaning
- Oiling — cleaned >6mo ago, not fired since
- Tear-down — 1 year from acquired
- Safe audit — every 3 months
- Optic check — every 6 months when scope assigned
- Holster check — every month for carry guns` },
  loadout: { title: "Range Load Out", body: `Build, save, and track load-outs.

**Build Load-Out.** Pick firearms, suggest rounds. Suggestions use:
- Your last 5 visits average (if you have 2+ visits)
- Otherwise: Pistol 100, Revolver 50, Rifle 60, Shotgun 25

**Favorites.** Star a load-out to sort it to the top.

**Use tracking.** Pick a load-out in Range Log to increment its counter.` },
  supplies: { title: "Supplies Needed", body: `Shopping list for parts and consumables.

**Add Item.** Name, category, estimated cost, notes.

**Check-off.** Click the circle to mark purchased — moves to archive.

**Archive.** Expand "Purchased" to see history. Uncheck to bring items back.` },
  forsale: { title: "For Sale", body: `Track items you're selling.

**How items get here.** From Firearms or Add-Ons tab, click 3-dot menu → Move to For Sale.

**Active listings.** Mark Sold (records sale price) or Return to Inventory.

**Sold archive.** Permanent record of every sale with prices and dates.

**Ammunition is not eligible** — partial sales are too messy to track.` },
  addons: { title: "Add-Ons", body: `Scopes, holsters, grips, magazines, lights, slings, bipods, suppressors, etc.

**Important.** Scopes and Red Dots assigned to a firearm activate 6-month Optic Check on Up-Keep.

**Photo upload.** ${IMAGE_TYPES}, max ${IMAGE_MAX_MB}MB.

**Three-dot menu.** Move to For Sale.` },
  ammunition: { title: "Ammunition", body: `Tracked by caliber, type, and storage location.

**Low-stock flag.** Rows below 100 rounds highlighted red.

**Caliber matching.** Spelling must match Firearms caliber for hover-tooltip to work. Use the dropdown.` },
  admin: { title: "Admin", body: `Visible only to admins.

**See.** Every account's email, role, signup date.

**Do.** Promote to admin or demote to user.

**Cannot see.** Other users' inventory — RLS blocks it at database level.

**Owner protection.** The owner email cannot be demoted to prevent lockout.` },
  changelog: { title: "Changelog", body: `Admin-only version history. Shows release date, title, and categorized changes (added/changed/fixed/removed).` },
  support: { title: "Support", body: `Click any card to read the article for that topic.

The "?" icon at the bottom-right of every tab opens the relevant article for that screen.` },
};

function Support({ openArticle, onHelp }) {
  const articles = [
    { key:"terms", icon:FileText, title:"Terms of Use", desc:"How you agree to use The Gun Shed." },
    { key:"privacy", icon:Lock, title:"Privacy Policy", desc:"What we collect, how it's stored, who can see it." },
    { key:"dashboard", icon:LayoutDashboard, title:"Dashboard", desc:"Stat cards, action items, recent activity." },
    { key:"firearms", icon:Target, title:"Firearms", desc:"How to add and manage firearms." },
    { key:"rangelog", icon:MapPin, title:"Range Log", desc:"Logging range visits and target photos." },
    { key:"upkeep", icon:Wrench, title:"Up-Keep", desc:"Maintenance schedules and auto-flags." },
    { key:"loadout", icon:Backpack, title:"Range Load Out", desc:"Build, save, and track load-outs." },
    { key:"supplies", icon:ShoppingCart, title:"Supplies Needed", desc:"Shopping list with check-off." },
    { key:"forsale", icon:Tag, title:"For Sale", desc:"List items, mark sold, archive transactions." },
    { key:"addons", icon:Package, title:"Add-Ons", desc:"Scopes, holsters, grips, mags, and more." },
    { key:"ammunition", icon:Boxes, title:"Ammunition", desc:"Tracking ammo by caliber and storage." },
    { key:"admin", icon:Users, title:"Admin", desc:"For admins — manage user accounts." },
    { key:"changelog", icon:ScrollText, title:"Changelog", desc:"For admins — app version history." },
    { key:"support", icon:HelpCircle, title:"Support", desc:"Using the support documentation." },
  ];
  return (
    <div className="tab">
      <div className="support-grid">{articles.map(a => (
        <button key={a.key} className="support-card" onClick={() => openArticle(a.key)}>
          <div className="support-ico"><a.icon size={20} /></div>
          <div><strong>{a.title}</strong><span>{a.desc}</span></div>
          <ChevronRight size={16} />
        </button>
      ))}</div>
      <HelpButton onClick={() => onHelp("support")} />
    </div>
  );
}

function SupportArticle({ articleKey, onBack }) {
  const article = SUPPORT_ARTICLES[articleKey];
  if (!article) return <div className="tab"><Empty icon={HelpCircle} label="Article not found" hint="" /></div>;
  const renderBody = (text) => {
    return text.split("\n\n").map((p, i) => {
      const parts = p.split(/(\*\*[^*]+\*\*)/g);
      return <p key={i}>{parts.map((part, j) => part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>)}</p>;
    });
  };
  return (
    <div className="tab">
      <button className="ghost" onClick={onBack} style={{marginBottom:18}}><ArrowLeft size={14} /> Back to Support</button>
      <article className="support-article">
        <h2>{article.title}</h2>
        {renderBody(article.body)}
      </article>
    </div>
  );
}

function Dashboard({ data, go, onHelp }) {
  const activeFirearms = (data.firearms || []).filter(f => !f.sold);
  const damagedCount = activeFirearms.filter(f => f.damaged).length;
  const totalRounds = (data.rangelog || []).reduce((s, m) => s + (Number(m.rounds) || 0), 0);
  const totalAmmo = (data.ammo || []).reduce((s, a) => s + (Number(a.quantity) || 0), 0);
  const collectionValue = activeFirearms.reduce((s, f) => s + (Number(f.current_value || f.value) || 0), 0) +
    (data.accessories || []).filter(a => !a.sold).reduce((s, a) => s + (Number(a.value) || 0) * (Number(a.quantity) || 1), 0);

  const maintenance = useMemo(() => {
    const needsClean = [];
    const needsOil = [];
    const otherIssues = [];
    activeFirearms.forEach((f) => {
      const flags = getUpkeepFlags(f, data.rangelog, data.accessories);
      flags.forEach(fl => {
        if (fl.key === "clean") needsClean.push({ firearm: f, flag: fl });
        else if (fl.key === "oil") needsOil.push({ firearm: f, flag: fl });
        else otherIssues.push({ firearm: f, flag: fl });
      });
    });
    return { needsClean, needsOil, otherIssues };
  }, [data]);

  const lowAmmo = (data.ammo || []).filter((a) => Number(a.quantity) < 100);
  const safeAuditNeeded = safeAuditDue(activeFirearms);

  const generateInsurancePDF = async () => {
    try {
      const { jsPDF } = await import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm");
      const doc = new jsPDF();
      let y = 18;
      doc.setFontSize(18);
      doc.text("Firearms Insurance Manifest", 14, y); y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 10;
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(`Total firearms: ${activeFirearms.length}`, 14, y); y += 5;
      const totalPurchase = activeFirearms.reduce((s, f) => s + (Number(f.value) || 0), 0);
      const totalCurrent = activeFirearms.reduce((s, f) => s + (Number(f.current_value || f.value) || 0), 0);
      doc.text(`Total purchase value: ${money(totalPurchase)}`, 14, y); y += 5;
      doc.text(`Total estimated current value: ${money(totalCurrent)}`, 14, y); y += 9;
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("#", 14, y); doc.text("Manufacturer / Model", 24, y); doc.text("Serial", 90, y); doc.text("Caliber", 125, y); doc.text("Purch $", 150, y); doc.text("Current $", 175, y);
      y += 2;
      doc.line(14, y, 196, y); y += 5;
      doc.setFont(undefined, "normal");
      activeFirearms.forEach((f, i) => {
        if (y > 270) { doc.addPage(); y = 18; }
        const name = (f.nickname ? `${f.nickname} — ` : "") + `${f.manufacturer || ""} ${f.model || ""}`.trim();
        doc.text(String(i + 1), 14, y);
        doc.text(name.slice(0, 38), 24, y);
        doc.text((f.serial || "—").slice(0, 18), 90, y);
        doc.text(f.caliber || "—", 125, y);
        doc.text(money(f.value).replace("$",""), 150, y);
        doc.text(money(f.current_value || f.value).replace("$",""), 175, y);
        y += 6;
        if (f.acquired) {
          doc.setFontSize(8); doc.setTextColor(120);
          doc.text(`acquired ${f.acquired}`, 24, y);
          doc.setFontSize(10); doc.setTextColor(0);
          y += 5;
        }
        y += 1;
      });
      doc.save(`gun-shed-insurance-manifest-${today()}.pdf`);
    } catch (e) {
      alert("Failed to generate PDF: " + e.message);
    }
  };

  return (
    <div className="tab">
      <div className="dash-stats">
        <Stat icon={Target} label="Firearms" value={activeFirearms.length} accent="#c8643c" onClick={() => go("firearms")} />
        <Stat icon={MapPin} label="Range visits" value={(data.rangelog || []).length} accent="#5b8a72" onClick={() => go("rangelog")} />
        <Stat icon={Package} label="Add-Ons" value={(data.accessories || []).filter(a => !a.sold).reduce((s, a) => s + (Number(a.quantity) || 1), 0)} accent="#7a86b8" onClick={() => go("addons")} />
        <Stat icon={Boxes} label="Rounds on hand" value={totalAmmo.toLocaleString()} accent="#b89a4a" onClick={() => go("ammunition")} />
        <Stat icon={Crosshair} label="Rounds fired" value={totalRounds.toLocaleString()} accent="#9c5a5a" onClick={() => go("rangelog")} />
        <Stat icon={Warehouse} label="Collection value" value={money(collectionValue)} accent="#6f9bb5" onClick={() => go("firearms")} />
        <Stat icon={Zap} label="Damaged firearms" value={damagedCount} accent={damagedCount > 0 ? "#d9534f" : "#9a9582"} onClick={() => go("firearms")} />
      </div>

      <div className="dash-action-row">
        <div className={`action-card ${maintenance.needsClean.length > 0 ? "active" : ""}`} onClick={() => go("upkeep")}>
          <div className="action-ico clean"><Wrench size={20} /></div>
          <div><div className="action-val">{maintenance.needsClean.length}</div><div className="action-lbl">Need Cleaning</div></div>
          {maintenance.needsClean.length > 0 && <span className="action-badge">Action Required</span>}
        </div>
        <div className={`action-card ${maintenance.needsOil.length > 0 ? "active" : ""}`} onClick={() => go("upkeep")}>
          <div className="action-ico oil"><Droplet size={20} /></div>
          <div><div className="action-val">{maintenance.needsOil.length}</div><div className="action-lbl">Need Oiling</div></div>
          {maintenance.needsOil.length > 0 && <span className="action-badge">Action Required</span>}
        </div>
        <div className={`action-card ${maintenance.otherIssues.length > 0 ? "active" : ""}`} onClick={() => go("upkeep")}>
          <div className="action-ico maint"><AlertCircle size={20} /></div>
          <div><div className="action-val">{maintenance.otherIssues.length}</div><div className="action-lbl">Other Up-Keep</div></div>
          {maintenance.otherIssues.length > 0 && <span className="action-badge">Action Required</span>}
        </div>
        <div className={`action-card ${lowAmmo.length > 0 ? "active" : ""}`} onClick={() => go("ammunition")}>
          <div className="action-ico low"><AlertTriangle size={20} /></div>
          <div><div className="action-val">{lowAmmo.length}</div><div className="action-lbl">Low Ammo</div></div>
          {lowAmmo.length > 0 && <span className="action-badge">Action Required</span>}
        </div>
      </div>

      {safeAuditNeeded && (
        <div className="safe-audit-banner" onClick={() => go("upkeep")}>
          <ShieldCheck size={16} />
          <span><strong>Safe audit due</strong> — more than 3 months since your last moisture and dehumidifier check.</span>
        </div>
      )}

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head"><AlertTriangle size={16} /><h3>Up-Keep Alerts</h3></div>
          {maintenance.needsClean.length + maintenance.needsOil.length + maintenance.otherIssues.length + lowAmmo.length === 0 ? (
            <p className="panel-empty">Everything looks good. No alerts right now.</p>
          ) : (
            <ul className="alert-list">
              {[...maintenance.needsClean, ...maintenance.needsOil, ...maintenance.otherIssues].map((x, i) => (
                <li key={`f-${i}`} onClick={() => go("upkeep")} style={{cursor:"pointer"}}>
                  <strong>{x.firearm.nickname || `${x.firearm.manufacturer} ${x.firearm.model}`}</strong>
                  <span>{x.flag.label}</span>
                </li>
              ))}
              {lowAmmo.map((a) => (
                <li key={`l-${a.id}`} onClick={() => go("ammunition")} style={{cursor:"pointer"}}>
                  <strong>{a.caliber} {a.type}</strong>
                  <span>Low stock — {a.quantity} rounds left.</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <div className="panel-head"><Calendar size={16} /><h3>Recent Range Visits</h3></div>
          {(data.rangelog || []).length === 0 ? <p className="panel-empty">No range visits logged yet.</p> : (
            <ul className="activity-list">{[...(data.rangelog || [])].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)).slice(0, 6).map((m) => {
              const f = activeFirearms.find((x) => x.id === m.firearm_id);
              return <li key={m.id} onClick={() => go("rangelog")} style={{cursor:"pointer"}}><span className="mono">{m.visit_date}</span><span>{m.range_name || "Range visit"}</span><span className="dim">{f ? (f.nickname || `${f.manufacturer} ${f.model}`) : "—"}</span></li>;
            })}</ul>
          )}
        </div>
      </div>

      <div className="insurance-row">
        <button className="primary" onClick={generateInsurancePDF} disabled={activeFirearms.length === 0}><FileDown size={15} /> Generate Insurance Manifest (PDF)</button>
        <span className="dim small">Includes every firearm, serial, purchase price, current value, and acquisition date.</span>
      </div>

      <HelpButton onClick={() => onHelp("dashboard")} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState({ firearms: [], rangelog: [], accessories: [], ammo: [], loadouts: [], supplies: [] });
  const [loading, setLoading] = useState(true);
  const [supportArticle, setSupportArticle] = useState(null);

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
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  const loadData = async () => {
    try {
      const [firearmsRes, rangeRes, accessoriesRes, ammoRes, loadoutsRes, suppliesRes] = await Promise.all([
        supabase.from("firearms").select("*"),
        supabase.from("range_log").select("*"),
        supabase.from("accessories").select("*"),
        supabase.from("ammo").select("*"),
        supabase.from("loadouts").select("*"),
        supabase.from("supplies").select("*"),
      ]);
      setData({
        firearms: firearmsRes.data || [],
        rangelog: rangeRes.data || [],
        accessories: accessoriesRes.data || [],
        ammo: ammoRes.data || [],
        loadouts: loadoutsRes.data || [],
        supplies: suppliesRes.data || [],
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
    setData({ firearms: [], rangelog: [], accessories: [], ammo: [], loadouts: [], supplies: [] });
    setTab("dashboard");
  };

  const openHelp = (articleKey) => {
    setSupportArticle(articleKey);
    setTab("support");
  };

  if (!authChecked) return <><Styles /><div className="boot"><Loader size={20} style={{animation:"spin 1s linear infinite"}} /> Loading…</div></>;
  if (!user) return <><Styles /><Login onAuth={handleAuth} /></>;

  const isAdmin = profile?.role === "admin";

  const NAV = [
    { key:"dashboard", label:"Dashboard", icon: LayoutDashboard, sub:"Overview of your collection, alerts and recent activity." },
    { key:"firearms", label:"Firearms", icon: Target, sub:"Identification, photos, caliber, value and round count." },
    { key:"rangelog", label:"Range Log", icon: MapPin, sub:"Every range visit — location, rounds fired, target photos." },
    { key:"loadout", label:"Range Load Out", icon: Backpack, sub:"Build and save load-outs for range trips." },
    { key:"upkeep", label:"Up-Keep", icon: Wrench, sub:"Maintenance schedules per firearm." },
    { key:"addons", label:"Add-Ons", icon: Package, sub:"Scopes, holsters, grips, magazines and other gear." },
    { key:"ammunition", label:"Ammunition", icon: Boxes, sub:"Type, quantity and storage location." },
    { key:"supplies", label:"Supplies Needed", icon: ShoppingCart, sub:"Shopping list with purchase check-off." },
    { key:"forsale", label:"For Sale", icon: Tag, sub:"Items listed for sale and your sold archive." },
    { key:"support", label:"Support", icon: HelpCircle, sub:"Terms, privacy, and per-tab help docs." },
  ];
  if (isAdmin) {
    NAV.push({ key:"admin", label:"Admin", icon: Users, sub:"Manage registered user accounts." });
    NAV.push({ key:"changelog", label:"Changelog", icon: ScrollText, sub:"Version history of every revision to the app." });
  }

  return (
    <>
      <Styles />
      <div className="app">
        <aside className="sidebar">
          <div className="brand sm"><Warehouse size={20} strokeWidth={2.2} /><span>THE GUN SHED</span></div>
          <nav>{NAV.map((n) => (
            <button key={n.key} className={tab === n.key ? "on" : ""} onClick={() => { setTab(n.key); setSupportArticle(null); }}>
              <n.icon size={17} /><span>{n.label}</span>
              {isAdmin && (n.key === "admin" || n.key === "changelog") && <span className="admin-dot" title="Admin only" />}
            </button>
          ))}</nav>
          <div className="side-foot">
            <div className="lock-badge"><Lock size={12} /> Cloud synced</div>
            <div className="user">
              <div className="avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="user-info">
                <span className="email">{user?.email}</span>
                {isAdmin && <span className="role-pill admin small">admin</span>}
              </div>
              <button className="icon-btn" onClick={logout} title="Log out"><LogOut size={15} /></button>
            </div>
            <div className="ver-foot">v{APP_VERSION}</div>
          </div>
        </aside>
        <main className="main">
          <header className="topbar">
            <h1>{NAV.find((n) => n.key === tab)?.label}</h1>
            <p>{NAV.find((n) => n.key === tab)?.sub}</p>
          </header>
          <div className="content">
            {loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"400px",color:"var(--dim)"}}><Loader size={20} style={{animation:"spin 1s linear infinite",marginRight:"10px"}} />Loading your data…</div> : (
              <>
                {tab === "dashboard" && <Dashboard data={data} go={setTab} onHelp={openHelp} />}
                {tab === "firearms" && <Firearms data={data} setData={setData} userId={user.id} onHelp={openHelp} />}
                {tab === "rangelog" && <RangeLog data={data} setData={setData} userId={user.id} onHelp={openHelp} />}
                {tab === "loadout" && <RangeLoadOut data={data} setData={setData} userId={user.id} onHelp={openHelp} />}
                {tab === "upkeep" && <UpKeep data={data} setData={setData} onHelp={openHelp} />}
                {tab === "addons" && <AddOns data={data} setData={setData} userId={user.id} onHelp={openHelp} />}
                {tab === "ammunition" && <Ammunition data={data} setData={setData} userId={user.id} onHelp={openHelp} />}
                {tab === "supplies" && <SuppliesNeeded data={data} setData={setData} userId={user.id} onHelp={openHelp} />}
                {tab === "forsale" && <ForSale data={data} setData={setData} onHelp={openHelp} />}
                {tab === "support" && (supportArticle ? <SupportArticle articleKey={supportArticle} onBack={() => setSupportArticle(null)} /> : <Support openArticle={setSupportArticle} onHelp={openHelp} />)}
                {tab === "admin" && isAdmin && <Admin currentUser={user} onHelp={openHelp} />}
                {tab === "changelog" && isAdmin && <Changelog onHelp={openHelp} />}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function Styles() {
  return (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo:wght@400;500;600;700&display=swap');
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    :root {
      --bg:#15140f; --bg2:#1d1c15; --panel:#232118; --panel2:#2a2820;
      --line:#3a3729; --line2:#46422f; --text:#ece6d6; --dim:#9a9582;
      --faint:#6f6b5c; --accent:#c8643c; --accent-d:#a6512f; --green:#5b8a72;
      --gold:#b89a4a; --danger:#b8504a; --radius:10px;
    }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:var(--bg); }
    .boot { color:var(--dim); font-family:'Archivo',sans-serif; padding:40px; display:flex; align-items:center; gap:10px; }
    .app { display:flex; min-height:100vh; font-family:'Archivo',system-ui,sans-serif; color:var(--text);
      background:radial-gradient(900px 500px at 100% 0%, rgba(200,100,60,0.06), transparent 60%), var(--bg); }
    .brand { display:flex; align-items:center; gap:9px; color:var(--accent); font-family:'Oswald',sans-serif; font-weight:700; letter-spacing:2px; font-size:20px; }
    .brand.sm { font-size:16px; letter-spacing:1.5px; padding:4px 4px 0; }
    .brand span { color:var(--text); }
    .sidebar { width:248px; flex-shrink:0; background:var(--bg2); border-right:1px solid var(--line); padding:22px 16px; display:flex; flex-direction:column; gap:24px; position:sticky; top:0; height:100vh; overflow-y:auto; }
    .sidebar nav { display:flex; flex-direction:column; gap:3px; }
    .sidebar nav button { display:flex; align-items:center; gap:11px; padding:11px 12px; background:transparent; border:none; border-radius:8px; cursor:pointer; color:var(--dim); font-family:inherit; font-size:13.5px; font-weight:500; text-align:left; transition:all .15s; width:100%; position:relative; }
    .sidebar nav button:hover { background:var(--panel); color:var(--text); }
    .sidebar nav button.on { background:linear-gradient(90deg, rgba(200,100,60,0.16), rgba(200,100,60,0.04)); color:var(--text); box-shadow:inset 2px 0 0 var(--accent); }
    .admin-dot { width:6px; height:6px; border-radius:50%; background:var(--gold); margin-left:auto; }
    .side-foot { margin-top:auto; display:flex; flex-direction:column; gap:10px; }
    .lock-badge { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--green); background:rgba(91,138,114,0.1); border:1px solid rgba(91,138,114,0.3); padding:6px 10px; border-radius:7px; justify-content:center; }
    .user { display:flex; align-items:center; gap:9px; padding:8px; background:var(--panel); border:1px solid var(--line); border-radius:8px; }
    .avatar { width:30px; height:30px; border-radius:7px; background:var(--accent); color:#fff; display:grid; place-items:center; font-weight:700; font-size:14px; flex-shrink:0; }
    .user-info { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
    .user .email { font-size:11.5px; color:var(--dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ver-foot { text-align:center; font-size:10.5px; color:var(--faint); letter-spacing:.5px; }
    .main { flex:1; min-width:0; }
    .topbar { padding:26px 34px 18px; border-bottom:1px solid var(--line); background:var(--bg2); }
    .topbar h1 { font-family:'Oswald',sans-serif; font-weight:600; font-size:26px; letter-spacing:.5px; }
    .topbar p { color:var(--dim); font-size:13px; margin-top:4px; }
    .content { padding:26px 34px 60px; position:relative; }
    .tab { position:relative; }
    .toolbar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
    .search { display:flex; align-items:center; gap:8px; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:0 11px; flex:1; min-width:220px; color:var(--faint); }
    .search input { background:transparent; border:none; outline:none; color:var(--text); font-family:inherit; font-size:13px; padding:9px 0; width:100%; }
    .sort { display:flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:0 9px; color:var(--faint); }
    .sort select { background:transparent; border:none; outline:none; color:var(--text); font-family:inherit; font-size:12.5px; padding:9px 2px; cursor:pointer; }
    .sort select option { background:var(--panel2); }
    .sort .dir { background:var(--panel2); border:1px solid var(--line); color:var(--text); width:24px; height:24px; border-radius:6px; cursor:pointer; font-size:13px; }
    .spacer { flex:1; }
    button.primary { display:inline-flex; align-items:center; gap:6px; background:var(--accent); color:#fff; border:none; border-radius:8px; padding:9px 15px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:600; transition:background .15s; white-space:nowrap; }
    button.primary:hover { background:var(--accent-d); }
    button.primary:disabled { opacity:.45; cursor:not-allowed; }
    button.primary.big { width:100%; justify-content:center; padding:12px; font-size:14px; margin-top:4px; }
    button.primary.small { padding:6px 10px; font-size:12px; }
    button.ghost { display:inline-flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); color:var(--dim); border-radius:8px; padding:9px 13px; cursor:pointer; font-family:inherit; font-size:12.5px; transition:all .15s; }
    button.ghost:hover { color:var(--text); border-color:var(--line2); }
    button.ghost:disabled { opacity:.5; cursor:not-allowed; }
    button.ghost.small { padding:5px 8px; font-size:11px; }
    .menu-wrap { position:relative; }
    .menu-wrap .menu { display:none; position:absolute; right:0; top:110%; background:var(--panel2); border:1px solid var(--line2); border-radius:8px; overflow:hidden; z-index:20; min-width:150px; box-shadow:0 12px 30px rgba(0,0,0,0.4); }
    .menu-wrap:hover .menu { display:block; }
    .menu button { display:block; width:100%; text-align:left; background:transparent; border:none; color:var(--dim); padding:10px 13px; font-family:inherit; font-size:12.5px; cursor:pointer; }
    .menu button:hover { background:var(--panel); color:var(--text); }
    .icon-btn { background:var(--panel2); border:1px solid var(--line); color:var(--dim); width:30px; height:30px; border-radius:7px; cursor:pointer; display:grid; place-items:center; transition:all .15s; }
    .icon-btn:hover { color:var(--text); border-color:var(--line2); }
    .icon-btn:disabled { opacity:.5; cursor:not-allowed; }
    .icon-btn.danger:hover { color:#fff; background:var(--danger); border-color:var(--danger); }
    .three-dot-wrap { position:relative; }
    .three-dot-menu { position:absolute; right:0; top:36px; background:var(--panel2); border:1px solid var(--line2); border-radius:8px; padding:4px; z-index:30; min-width:180px; box-shadow:0 12px 30px rgba(0,0,0,0.4); }
    .three-dot-menu button { display:flex; align-items:center; gap:7px; width:100%; background:transparent; border:none; color:var(--text); padding:8px 10px; font-family:inherit; font-size:12.5px; cursor:pointer; border-radius:5px; text-align:left; }
    .three-dot-menu button:hover { background:var(--panel); }
    .three-dot-menu button.danger { color:var(--danger); }
    .cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:14px; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:16px; display:flex; flex-direction:column; gap:12px; transition:border-color .15s; }
    .card:hover { border-color:var(--line2); }
    .firearm-card { padding:0; overflow:hidden; }
    .firearm-card .card-inner { padding:16px; display:flex; flex-direction:column; gap:12px; }
    .firearm-photo { height:160px; overflow:hidden; background:var(--bg); border-bottom:1px solid var(--line); }
    .firearm-photo img { width:100%; height:100%; object-fit:cover; display:block; }
    .card-top { display:flex; align-items:flex-start; gap:11px; }
    .card-ico { width:38px; height:38px; border-radius:9px; display:grid; place-items:center; flex-shrink:0; }
    .card-ico.fire { background:rgba(200,100,60,0.15); color:var(--accent); }
    .card-ico.acc { background:rgba(122,134,184,0.15); color:#9aa3cc; }
    .card-ico.range { background:rgba(91,138,114,0.15); color:var(--green); }
    .card-title { flex:1; min-width:0; }
    .title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .card-title strong { display:block; font-size:14.5px; font-family:'Oswald',sans-serif; font-weight:600; letter-spacing:.3px; }
    .card-title span { font-size:12px; color:var(--dim); }
    .pill { font-size:10.5px; text-transform:uppercase; letter-spacing:.6px; background:var(--panel2); border:1px solid var(--line2); color:var(--dim); padding:3px 8px; border-radius:20px; flex-shrink:0; }
    .pill.small { padding:2px 6px; font-size:9.5px; }
    .pill.sold { background:rgba(91,138,114,0.15); color:var(--green); border-color:rgba(91,138,114,0.35); }
    .status-pill { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:2px 8px; border-radius:12px; border:1px solid; background:rgba(0,0,0,0.15); }
    .kv { display:grid; grid-template-columns:1fr 1fr; gap:9px 14px; }
    .kv > div { display:flex; flex-direction:column; gap:1px; }
    .kv label { font-size:10px; text-transform:uppercase; letter-spacing:.6px; color:var(--faint); }
    .kv span { font-size:13px; }
    .caliber-tooltip { display:inline-flex; align-items:center; gap:6px; cursor:help; }
    .ammo-pill { font-size:10px; background:rgba(184,154,74,0.15); color:var(--gold); border:1px solid rgba(184,154,74,0.35); padding:1px 6px; border-radius:10px; font-variant-numeric:tabular-nums; }
    .notes { font-size:12px; color:var(--dim); border-top:1px solid var(--line); padding-top:9px; line-height:1.45; }
    .card-actions { display:flex; gap:6px; justify-content:flex-end; align-items:center; }
    .fav-btn { background:transparent; border:none; color:var(--gold); cursor:pointer; padding:4px; }
    .thumbs { display:flex; gap:6px; flex-wrap:wrap; }
    .thumbs img { width:54px; height:54px; object-fit:cover; border-radius:6px; border:1px solid var(--line2); cursor:pointer; transition:transform .15s; }
    .thumbs img:hover { transform:scale(1.05); }
    .thumbs.edit { margin-top:8px; }
    .thumb { position:relative; }
    .thumb button { position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:50%; background:var(--danger); color:#fff; border:none; cursor:pointer; display:grid; place-items:center; padding:0; }
    .form-photo img { width:140px; height:90px; object-fit:cover; border-radius:8px; border:1px solid var(--line2); }
    .upload { display:inline-flex; align-items:center; gap:7px; background:var(--panel); border:1px dashed var(--line2); color:var(--dim); padding:9px 13px; border-radius:8px; cursor:pointer; font-size:12.5px; width:fit-content; transition:all .15s; }
    .upload:hover { color:var(--text); border-color:var(--accent); }
    .grid-table { width:100%; border-collapse:collapse; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; }
    .grid-table th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.7px; color:var(--faint); padding:11px 14px; background:var(--bg2); border-bottom:1px solid var(--line); }
    .grid-table td { padding:12px 14px; font-size:13px; border-bottom:1px solid var(--line); vertical-align:middle; }
    .grid-table tr:last-child td { border-bottom:none; }
    .grid-table tbody tr:hover { background:var(--panel2); }
    .grid-table tr.low { background:rgba(184,80,74,0.07); }
    .mono { font-variant-numeric:tabular-nums; color:var(--dim); }
    .dim { color:var(--dim); }
    .dim.small { font-size:11px; }
    .row-actions { display:flex; gap:6px; }
    .low-flag { display:inline-flex; align-items:center; gap:3px; margin-left:8px; font-size:10.5px; color:var(--danger); text-transform:uppercase; letter-spacing:.5px; }
    .empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:70px 20px; color:var(--faint); text-align:center; border:1px dashed var(--line2); border-radius:var(--radius); }
    .empty strong { font-size:15px; color:var(--dim); font-family:'Oswald',sans-serif; }
    .empty span { font-size:12.5px; }
    .dash-stats { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:13px; margin-bottom:16px; }
    .stat { display:flex; align-items:center; gap:13px; background:var(--panel); border:1px solid var(--line); border-left-width:3px; border-radius:var(--radius); padding:15px 16px; transition:all .15s; }
    .stat.clickable { cursor:pointer; }
    .stat.clickable:hover { transform:translateY(-2px); border-color:var(--line2); box-shadow:0 6px 16px rgba(0,0,0,0.2); }
    .stat-ico { color:var(--dim); }
    .stat-val { font-family:'Oswald',sans-serif; font-size:23px; font-weight:600; line-height:1; }
    .stat-lbl { font-size:11px; color:var(--dim); margin-top:4px; text-transform:uppercase; letter-spacing:.6px; }
    .dash-action-row { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:22px; }
    .action-card { display:flex; align-items:center; gap:13px; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:16px; cursor:pointer; transition:all .15s; position:relative; }
    .action-card:hover { border-color:var(--line2); transform:translateY(-2px); }
    .action-card.active { border-color:var(--danger); background:linear-gradient(135deg, rgba(184,80,74,0.08), var(--panel)); }
    .action-ico { width:42px; height:42px; border-radius:9px; display:grid; place-items:center; flex-shrink:0; }
    .action-ico.clean { background:rgba(200,100,60,0.15); color:var(--accent); }
    .action-ico.oil { background:rgba(91,138,114,0.15); color:var(--green); }
    .action-ico.maint { background:rgba(184,154,74,0.15); color:var(--gold); }
    .action-ico.low { background:rgba(184,80,74,0.15); color:var(--danger); }
    .action-val { font-family:'Oswald',sans-serif; font-size:26px; font-weight:700; line-height:1; }
    .action-lbl { font-size:12px; color:var(--dim); margin-top:3px; text-transform:uppercase; letter-spacing:.5px; }
    .action-badge { position:absolute; top:8px; right:10px; font-size:9px; font-weight:700; background:var(--danger); color:#fff; padding:3px 7px; border-radius:10px; text-transform:uppercase; letter-spacing:.5px; }
    .safe-audit-banner { display:flex; align-items:center; gap:10px; background:linear-gradient(135deg, rgba(184,154,74,0.1), var(--panel)); border:1px solid rgba(184,154,74,0.35); border-radius:8px; padding:13px 16px; margin-bottom:22px; cursor:pointer; color:var(--gold); font-size:13px; transition:all .15s; }
    .safe-audit-banner:hover { border-color:var(--gold); }
    .safe-audit-banner strong { color:var(--text); }
    .insurance-row { display:flex; align-items:center; gap:12px; padding:14px; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); margin-top:12px; }
    .dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:22px; }
    .panel { background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:18px; }
    .panel-head { display:flex; align-items:center; gap:8px; color:var(--accent); margin-bottom:14px; }
    .panel-head h3 { font-family:'Oswald',sans-serif; font-size:15px; font-weight:600; color:var(--text); letter-spacing:.4px; }
    .panel-empty { color:var(--faint); font-size:12.5px; padding:10px 0; }
    .alert-list { list-style:none; display:flex; flex-direction:column; gap:9px; }
    .alert-list li { display:flex; flex-direction:column; gap:2px; padding:10px 12px; background:rgba(184,80,74,0.08); border:1px solid rgba(184,80,74,0.25); border-radius:7px; transition:all .15s; }
    .alert-list li:hover { background:rgba(184,80,74,0.12); }
    .alert-list strong { font-size:12.5px; font-family:'Oswald',sans-serif; }
    .alert-list span { font-size:12px; color:var(--dim); }
    .activity-list { list-style:none; display:flex; flex-direction:column; }
    .activity-list li { display:grid; grid-template-columns:90px 1fr 1fr; gap:8px; padding:9px 0; border-bottom:1px solid var(--line); font-size:12.5px; transition:background .15s; padding-left:6px; padding-right:6px; border-radius:4px; }
    .activity-list li:hover { background:var(--panel2); }
    .activity-list li:last-child { border-bottom:none; }
    .maint-help { display:flex; flex-direction:column; gap:4px; background:rgba(91,138,114,0.06); border:1px solid rgba(91,138,114,0.2); border-radius:8px; padding:11px 14px; margin-bottom:14px; font-size:12px; color:var(--dim); }
    .maint-help span:first-child { display:flex; align-items:center; gap:6px; color:var(--green); font-weight:600; text-transform:uppercase; letter-spacing:.5px; font-size:11px; margin-bottom:4px; }
    .maint-help strong { color:var(--accent); }
    .maint-table-wrap { overflow-x:auto; }
    .maint-cell { display:flex; align-items:center; gap:6px; }
    .maint-cell input[type="date"] { background:var(--panel2); border:1px solid var(--line); color:var(--text); padding:6px 8px; border-radius:6px; font-family:inherit; font-size:12.5px; outline:none; }
    .maint-cell input[type="date"]:focus { border-color:var(--accent); }
    .ok-flag { color:var(--green); font-size:12px; font-weight:600; }
    .maint-flag { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:5px; font-size:11px; font-weight:600; margin-right:6px; margin-bottom:4px; }
    .maint-flag.sev-high { background:rgba(184,80,74,0.15); color:var(--danger); border:1px solid rgba(184,80,74,0.35); }
    .maint-flag.sev-medium { background:rgba(184,154,74,0.15); color:var(--gold); border:1px solid rgba(184,154,74,0.35); }
    .maint-flag.sev-low { background:rgba(91,138,114,0.15); color:var(--green); border:1px solid rgba(91,138,114,0.35); }
    .changelog { display:flex; flex-direction:column; }
    .release { display:grid; grid-template-columns:34px 1fr; }
    .release-rail { display:flex; justify-content:center; position:relative; }
    .release-rail::before { content:""; position:absolute; top:0; bottom:0; width:2px; background:var(--line); }
    .release:first-child .release-rail::before { top:10px; }
    .release:last-child .release-rail::before { bottom:auto; height:10px; }
    .release-dot { width:12px; height:12px; border-radius:50%; background:var(--panel2); border:2px solid var(--line2); margin-top:4px; z-index:1; }
    .release-dot.cur { background:var(--accent); border-color:var(--accent); box-shadow:0 0 0 4px rgba(200,100,60,0.15); }
    .release-body { padding:0 0 28px 16px; }
    .release-head { display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
    .release-head .ver { font-family:'Oswald',sans-serif; font-weight:700; font-size:13px; color:var(--accent); background:rgba(200,100,60,0.1); border:1px solid rgba(200,100,60,0.3); padding:2px 9px; border-radius:6px; }
    .release-head h3 { font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; }
    .cur-badge { font-size:10px; text-transform:uppercase; letter-spacing:.6px; background:var(--green); color:#fff; padding:3px 8px; border-radius:20px; }
    .rel-date { margin-left:auto; font-size:12px; color:var(--faint); font-variant-numeric:tabular-nums; }
    .change-list { list-style:none; display:flex; flex-direction:column; gap:8px; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:14px 16px; }
    .change-list li { display:flex; gap:10px; align-items:flex-start; font-size:13px; line-height:1.5; }
    .ct { font-size:9.5px; text-transform:uppercase; letter-spacing:.6px; font-weight:700; padding:3px 7px; border-radius:5px; flex-shrink:0; margin-top:1px; min-width:54px; text-align:center; }
    .ct-added { background:rgba(91,138,114,0.15); color:var(--green); border:1px solid rgba(91,138,114,0.35); }
    .ct-changed { background:rgba(184,154,74,0.15); color:var(--gold); border:1px solid rgba(184,154,74,0.35); }
    .ct-fixed { background:rgba(200,100,60,0.15); color:var(--accent); border:1px solid rgba(200,100,60,0.35); }
    .ct-removed { background:rgba(184,80,74,0.15); color:var(--danger); border:1px solid rgba(184,80,74,0.35); }
    .modal-back { position:fixed; inset:0; background:rgba(10,9,6,0.78); display:grid; place-items:center; z-index:100; padding:20px; backdrop-filter:blur(2px); }
    .modal { background:var(--bg2); border:1px solid var(--line2); border-radius:14px; width:100%; max-width:560px; max-height:90vh; overflow:auto; }
    .modal.wide { max-width:760px; }
    .modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg2); z-index:5; }
    .modal-head h3 { font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; }
    .modal-body { padding:20px; }
    .form { display:flex; flex-direction:column; gap:14px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .form-fld { display:flex; flex-direction:column; gap:5px; }
    .form-fld > span { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:var(--faint); }
    .form-fld input, .form-fld select, .form-fld textarea { background:var(--panel); border:1px solid var(--line); border-radius:7px; padding:9px 11px; color:var(--text); font-family:inherit; font-size:13px; outline:none; transition:border-color .15s; }
    .form-fld input:focus, .form-fld select:focus, .form-fld textarea:focus { border-color:var(--accent); }
    .form-fld select option { background:var(--panel2); }
    .form-fld textarea { resize:vertical; }
    .form-actions { display:flex; justify-content:flex-end; gap:9px; margin-top:4px; }
    .login-wrap { min-height:100vh; display:grid; place-items:center; position:relative; font-family:'Archivo',sans-serif; padding:20px; overflow:hidden; }
    .login-bg { position:absolute; inset:0; background:radial-gradient(700px 400px at 20% 20%, rgba(200,100,60,0.12), transparent 60%), radial-gradient(600px 400px at 90% 90%, rgba(91,138,114,0.10), transparent 60%), var(--bg); z-index:0; }
    .login-card { position:relative; z-index:1; background:var(--bg2); border:1px solid var(--line2); border-radius:16px; padding:34px 30px; width:100%; max-width:380px; box-shadow:0 30px 70px rgba(0,0,0,0.5); }
    .login-card .brand { justify-content:center; margin-bottom:6px; }
    .tagline { text-align:center; color:var(--dim); font-size:12.5px; margin-bottom:22px; }
    .seg { display:flex; background:var(--panel); border:1px solid var(--line); border-radius:9px; padding:3px; margin-bottom:18px; }
    .seg button { flex:1; background:transparent; border:none; color:var(--dim); padding:8px; border-radius:6px; cursor:pointer; font-family:inherit; font-size:12.5px; font-weight:600; transition:all .15s; }
    .seg button.on { background:var(--accent); color:#fff; }
    .fld { display:flex; flex-direction:column; gap:5px; margin-bottom:13px; }
    .fld span { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:var(--faint); }
    .fld input { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:10px 12px; color:var(--text); font-family:inherit; font-size:13.5px; outline:none; transition:border-color .15s; }
    .fld input:focus { border-color:var(--accent); }
    .err { display:flex; align-items:center; gap:6px; background:rgba(184,80,74,0.12); border:1px solid rgba(184,80,74,0.35); color:#d98a84; font-size:12px; padding:8px 11px; border-radius:7px; margin-bottom:12px; }
    .note { display:flex; align-items:flex-start; gap:6px; color:var(--faint); font-size:11px; margin-top:16px; line-height:1.45; }
    .help-fab { position:fixed; bottom:24px; right:24px; width:44px; height:44px; border-radius:50%; background:var(--accent); color:#fff; border:none; cursor:pointer; display:grid; place-items:center; box-shadow:0 8px 24px rgba(0,0,0,0.4); transition:all .2s; z-index:50; }
    .help-fab:hover { transform:scale(1.1); background:var(--accent-d); }
    .help-fab::after { content:"Do you need help, click here"; position:absolute; right:54px; top:50%; transform:translateY(-50%) translateX(8px); background:var(--bg2); border:1px solid var(--line2); color:var(--text); padding:8px 12px; border-radius:8px; font-size:12px; font-family:inherit; white-space:nowrap; opacity:0; pointer-events:none; transition:all .2s; }
    .help-fab:hover::after { opacity:1; transform:translateY(-50%) translateX(0); }
    .role-pill { display:inline-block; font-size:10px; text-transform:uppercase; letter-spacing:.6px; padding:3px 8px; border-radius:5px; font-weight:700; }
    .role-pill.admin { background:rgba(184,154,74,0.15); color:var(--gold); border:1px solid rgba(184,154,74,0.35); }
    .role-pill.user { background:rgba(91,138,114,0.15); color:var(--green); border:1px solid rgba(91,138,114,0.35); }
    .role-pill.small { font-size:9px; padding:1px 5px; }
    .loadout-items { display:flex; flex-direction:column; gap:5px; }
    .loadout-item { display:grid; grid-template-columns:1fr auto auto; gap:8px; padding:6px 9px; background:var(--panel2); border:1px solid var(--line); border-radius:6px; font-size:12.5px; }
    .lo-firearm { color:var(--text); }
    .lo-caliber { color:var(--gold); font-size:11px; font-variant-numeric:tabular-nums; }
    .lo-rounds { color:var(--dim); font-variant-numeric:tabular-nums; }
    .loadout-picker { display:flex; flex-direction:column; gap:6px; max-height:340px; overflow-y:auto; padding:4px; background:var(--bg); border:1px solid var(--line); border-radius:8px; }
    .pick-row { display:flex; align-items:center; gap:10px; padding:8px 10px; background:var(--panel); border:1px solid transparent; border-radius:7px; transition:all .15s; }
    .pick-row.on { border-color:var(--accent); background:rgba(200,100,60,0.06); }
    .pick-toggle { display:flex; align-items:center; gap:9px; flex:1; background:transparent; border:none; color:var(--text); cursor:pointer; font-family:inherit; font-size:13px; text-align:left; padding:0; }
    .pick-name { flex:1; }
    .pick-cal { color:var(--gold); font-size:11.5px; font-variant-numeric:tabular-nums; }
    .pick-rounds { display:flex; align-items:center; gap:6px; }
    .pick-rounds input { width:70px; background:var(--panel2); border:1px solid var(--line); color:var(--text); padding:5px 8px; border-radius:5px; font-family:inherit; font-size:12.5px; outline:none; text-align:right; }
    .pick-rounds span { font-size:11px; color:var(--dim); }
    .supplies-list { display:flex; flex-direction:column; gap:6px; }
    .supplies-list.dim-list { opacity:0.7; }
    .supply-row { display:flex; align-items:center; gap:12px; padding:11px 14px; background:var(--panel); border:1px solid var(--line); border-radius:8px; transition:all .15s; }
    .supply-row:hover { border-color:var(--line2); }
    .supply-row.done .supply-main strong { text-decoration:line-through; color:var(--dim); }
    .check-btn { background:transparent; border:none; color:var(--accent); cursor:pointer; padding:0; display:grid; place-items:center; }
    .supply-row.done .check-btn { color:var(--green); }
    .supply-main { flex:1; min-width:0; }
    .supply-main strong { display:block; font-size:13.5px; }
    .supply-meta { display:flex; align-items:center; gap:8px; margin-top:3px; flex-wrap:wrap; }
    .archive-section { margin-top:20px; }
    .archive-toggle { background:transparent; border:none; color:var(--dim); font-family:inherit; font-size:12.5px; cursor:pointer; padding:6px 0; display:flex; align-items:center; gap:6px; }
    .archive-toggle:hover { color:var(--text); }
    .sold-card { opacity:0.7; }
    .section-title { font-family:'Oswald',sans-serif; font-size:14px; font-weight:600; color:var(--dim); text-transform:uppercase; letter-spacing:1px; margin:20px 0 12px; }
    .section-title:first-child { margin-top:0; }
    .support-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:12px; }
    .support-card { display:flex; align-items:center; gap:13px; padding:16px; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); cursor:pointer; transition:all .15s; text-align:left; font-family:inherit; color:var(--text); width:100%; }
    .support-card:hover { border-color:var(--accent); transform:translateY(-2px); }
    .support-ico { width:42px; height:42px; border-radius:9px; background:rgba(200,100,60,0.12); color:var(--accent); display:grid; place-items:center; flex-shrink:0; }
    .support-card strong { display:block; font-family:'Oswald',sans-serif; font-size:14px; font-weight:600; }
    .support-card span { display:block; font-size:11.5px; color:var(--dim); margin-top:3px; }
    .support-card > div:nth-child(2) { flex:1; }
    .support-article { max-width:760px; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:30px 36px; }
    .support-article h2 { font-family:'Oswald',sans-serif; font-size:24px; font-weight:600; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid var(--line); }
    .support-article p { font-size:14px; line-height:1.65; color:var(--text); margin-bottom:14px; }
    .support-article strong { color:var(--accent); }
    @media (max-width:820px) {
      .app { flex-direction:column; }
      .sidebar { width:100%; height:auto; position:relative; }
      .sidebar nav { flex-direction:row; flex-wrap:wrap; }
      .dash-grid { grid-template-columns:1fr; }
      .grid2 { grid-template-columns:1fr; }
      .content, .topbar { padding-left:18px; padding-right:18px; }
    }
    `}</style>
  );
}
