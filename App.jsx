import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Target, Crosshair, Package, Boxes, LayoutDashboard, LogOut, Search,
  Plus, Download, Trash2, Edit3, X, ChevronDown, AlertTriangle,
  Calendar, ArrowUpDown, Check, Lock, MapPin, Image as ImageIcon,
  ScrollText, Warehouse, Loader, Wrench, Droplet, Sparkles
} from "lucide-react";

/* ============================================================
   THE GUN SHED v1.3
   - Firearms with photo upload
   - Range Log with target photos
   - Accessories
   - Ammunition (with low-stock flag)
   - Maintenance tab (last cleaned / last oiled per firearm,
     auto-flagging based on rules)
   - Dashboard with clickable stats + maintenance alerts
   - Changelog
   - Email auth + cloud sync via Supabase
   ============================================================ */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MANUFACTURERS = ["Glock","Smith & Wesson","Sig Sauer","Ruger","Colt","Remington","Springfield Armory","Beretta","CZ","Heckler & Koch","Winchester","Mossberg","Savage Arms","Browning","FN Herstal","Walther","Kimber","Daniel Defense","Aero Precision","Palmetto State Armory","Henry","Marlin","Benelli","Tikka","Bergara","Other"];
const CALIBERS = ["9mm",".45 ACP",".40 S&W",".380 ACP","10mm",".22 LR",".223 Rem","5.56 NATO",".308 Win","7.62x39","6.5 Creedmoor",".300 BLK",".30-06",".270 Win","12 Gauge","20 Gauge",".410 Bore",".357 Mag",".38 Special","44 Mag","Other"];
const FIREARM_TYPES = ["Pistol","Revolver","Rifle","Shotgun","Other"];
const ACCESSORY_TYPES = ["Scope","Red Dot","Holster","Grip","Magazine","Light","Sling","Bipod","Suppressor","Other"];
const AMMO_TYPES = ["FMJ","JHP","Match","Birdshot","Buckshot","Slug","Subsonic","Frangible","Other"];

const CHANGELOG = [
  { version:"1.3.0", date:"2026-05-15", tag:"current", title:"Maintenance, photos & smart dashboard", changes:[
    { type:"added", text:"Maintenance tab — track last cleaned and last oiled per firearm with auto-flagging." },
    { type:"added", text:"Firearm photo uploads — attach an image to every firearm." },
    { type:"added", text:"Dashboard stats are now clickable — jump straight to the relevant tab." },
    { type:"added", text:"Maintenance alerts on the dashboard show which guns need cleaning or oiling." },
    { type:"added", text:"Hover the caliber on a firearm card to see how many rounds of that caliber you have on hand." },
    { type:"changed", text:"Removed the quick-action buttons; clickable stats replace them." },
  ]},
  { version:"1.2.0", date:"2026-05-15", tag:"", title:"Live Supabase backend", changes:[
    { type:"added", text:"Real email authentication with verification." },
    { type:"added", text:"Multi-device sync via Postgres + Row Level Security." },
    { type:"added", text:"Target photos upload to Supabase Storage." },
  ]},
  { version:"1.1.0", date:"2026-05-14", tag:"", title:"The Gun Shed redesign", changes:[
    { type:"added", text:"Renamed application to The Gun Shed." },
    { type:"added", text:"Changelog tab." },
    { type:"changed", text:"Maintenance & Usage reworked into Range Log with target photos." },
    { type:"changed", text:"Add buttons moved to the left of every toolbar." },
  ]},
  { version:"1.0.0", date:"2026-05-13", tag:"", title:"Initial build", changes:[
    { type:"added", text:"Firearms, Maintenance, Accessories and Ammunition tabs." },
    { type:"added", text:"Dashboard with collection stats." },
    { type:"added", text:"Per-tab search, sorting, and CSV/JSON export." },
  ]},
];
const APP_VERSION = CHANGELOG[0].version;

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const money = (n) => (n || n === 0) ? `$${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—";

function toCSV(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]).filter((c) => !["photos","photo_paths","photo_path"].includes(c));
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

// MAINTENANCE LOGIC
// Cleaning: any firearm fired more than 90 days ago without being cleaned since.
// Oiling: any firearm cleaned more than 180 days ago without being fired since
//         (and not oiled since the cleaning).
function getMaintenanceFlags(firearm, rangelog) {
  const flags = [];
  const logs = (rangelog || []).filter(m => m.firearm_id === firearm.id)
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
  const lastFire = logs[0];

  if (lastFire) {
    const firedDate = new Date(lastFire.visit_date);
    const cleanedDate = firearm.last_cleaned ? new Date(firearm.last_cleaned) : null;
    const daysSinceFire = daysBetween(lastFire.visit_date, today());
    if ((!cleanedDate || cleanedDate < firedDate) && daysSinceFire > 90) {
      flags.push("Needs Cleaning");
    }
  }

  if (firearm.last_cleaned) {
    const cleanedDate = new Date(firearm.last_cleaned);
    const oiledDate = firearm.last_oiled ? new Date(firearm.last_oiled) : null;
    const firedSinceClean = lastFire && new Date(lastFire.visit_date) > cleanedDate;
    const daysSinceClean = daysBetween(firearm.last_cleaned, today());
    if (!firedSinceClean && daysSinceClean > 180 && (!oiledDate || oiledDate < cleanedDate)) {
      flags.push("Needs Oiling");
    }
  }

  return flags;
}

// =================================================================
// LOGIN
// =================================================================
function Login({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) return setErr("Enter a valid email address.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) { setBusy(false); return setErr(error.message); }
        setEmail(""); setPw("");
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
        <label className="fld"><span>Email</span><input type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></label>
        <label className="fld"><span>Password</span><input type="password" value={pw} placeholder="••••••••" onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></label>
        {err && <div className="err"><AlertTriangle size={14} /> {err}</div>}
        <button className="primary big" onClick={submit} disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create Account" : "Log In"}</button>
        <div className="note"><Lock size={12} /><span>Protected by Row Level Security. Only you can access your inventory.</span></div>
      </div>
    </div>
  );
}

// =================================================================
// SHARED UI
// =================================================================
function Stat({ icon: Icon, label, value, accent, onClick }) {
  return (
    <div className={`stat ${onClick ? "clickable" : ""}`} style={accent ? { borderColor: accent } : {}} onClick={onClick}>
      <div className="stat-ico" style={accent ? { color: accent } : {}}><Icon size={20} /></div>
      <div><div className="stat-val">{value}</div><div className="stat-lbl">{label}</div></div>
    </div>
  );
}
function Field({ label, children }) { return <label className="form-fld"><span>{label}</span>{children}</label>; }
function Modal({ title, onClose, children }) {
  return <div className="modal-back" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="modal-body">{children}</div></div></div>;
}
function Toolbar({ query, setQuery, sortKey, setSortKey, sortDir, setSortDir, sortOptions, onAdd, onExportCSV, onExportJSON, placeholder, addLabel = "Add" }) {
  return (
    <div className="toolbar">
      <button className="primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>
      <div className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} /></div>
      <div className="sort"><ArrowUpDown size={14} /><select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>{sortOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select><button className="dir" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>{sortDir === "asc" ? "↑" : "↓"}</button></div>
      <div className="spacer" />
      <div className="menu-wrap"><button className="ghost"><Download size={15} /> Export <ChevronDown size={13} /></button><div className="menu"><button onClick={onExportCSV}>Export CSV</button><button onClick={onExportJSON}>Export JSON</button></div></div>
    </div>
  );
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
function Empty({ icon: Icon, label, hint }) {
  return <div className="empty"><Icon size={40} strokeWidth={1.4} /><strong>{label}</strong><span>{hint}</span></div>;
}

// =================================================================
// FIREARMS
// =================================================================
function Firearms({ data, setData, userId }) {
  const rows = data.firearms || [];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const t = useTable(rows, ["manufacturer","model","serial","caliber","type","nickname"], "manufacturer");
  const blank = { nickname:"", manufacturer:"Glock", model:"", serial:"", caliber:"9mm", type:"Pistol", acquired:today(), value:"", notes:"", photo_path:"" };

  const ammoByCaliber = useMemo(() => {
    const map = {};
    (data.ammo || []).forEach(a => {
      if (!a.caliber) return;
      map[a.caliber] = (map[a.caliber] || 0) + (Number(a.quantity) || 0);
    });
    return map;
  }, [data.ammo]);

  const save = async (rec) => {
    setSaving(true);
    try {
      if (rec.id && rec.id.length > 20) {
        const { nickname, manufacturer, model, serial, caliber, type, acquired, value, notes, photo_path } = rec;
        await supabase.from("firearms").update({ nickname, manufacturer, model, serial, caliber, type, acquired, value: value ? parseFloat(value) : null, notes, photo_path }).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("firearms").insert([{
          nickname: rec.nickname, manufacturer: rec.manufacturer, model: rec.model,
          serial: rec.serial, caliber: rec.caliber, type: rec.type, acquired: rec.acquired,
          value: rec.value ? parseFloat(rec.value) : null, notes: rec.notes,
          photo_path: rec.photo_path, user_id: userId
        }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.firearms.some((x) => x.id === rec.id);
        return { ...d, firearms: exists ? d.firearms.map((x) => (x.id === rec.id ? rec : x)) : [...d.firearms, rec] };
      });
      setEditing(null);
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this firearm?")) return;
    try {
      await supabase.from("firearms").delete().eq("id", id);
      setData((d) => ({ ...d, firearms: d.firearms.filter((x) => x.id !== id), rangelog: d.rangelog.filter((m) => m.firearm_id !== id) }));
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
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
            return (
              <div className="card firearm-card" key={f.id}>
                {photoUrl && <div className="firearm-photo"><img src={photoUrl} alt={f.model} /></div>}
                <div className="card-top">
                  <div className="card-ico fire"><Crosshair size={18} /></div>
                  <div className="card-title"><strong>{f.nickname || f.model || "Unnamed"}</strong><span>{f.manufacturer} {f.model}</span></div>
                  <span className="pill">{f.type}</span>
                </div>
                <div className="kv">
                  <div><label>Serial</label><span>{f.serial || "—"}</span></div>
                  <div>
                    <label>Caliber</label>
                    <span className="caliber-tooltip" title={`${ammoOnHand.toLocaleString()} rounds of ${f.caliber} on hand`}>
                      {f.caliber}
                      <span className="ammo-pill">{ammoOnHand.toLocaleString()}</span>
                    </span>
                  </div>
                  <div><label>Rounds fired</label><span>{roundCount(f.id).toLocaleString()}</span></div>
                  <div><label>Acquired</label><span>{f.acquired || "—"}</span></div>
                  <div><label>Est. value</label><span>{money(f.value)}</span></div>
                </div>
                {f.notes && <p className="notes">{f.notes}</p>}
                <div className="card-actions">
                  <button className="icon-btn" onClick={() => setEditing(f)}><Edit3 size={15} /></button>
                  <button className="icon-btn danger" onClick={() => remove(f.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editing && (
        <Modal title={rows.some((x) => x.id === editing.id) ? "Edit Firearm" : "Add Firearm"} onClose={() => setEditing(null)}>
          <FirearmForm rec={editing} userId={userId} onSave={save} onCancel={() => setEditing(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

function FirearmForm({ rec, userId, onSave, onCancel, saving }) {
  const [f, setF] = useState(rec);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (file.size > 3_000_000) { alert("Image must be under 3 MB."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${userId}/${f.id}/${filename}`;
      const { error } = await supabase.storage.from("firearm-photos").upload(path, file);
      if (error) throw error;
      // remove old photo if present
      if (f.photo_path) {
        await supabase.storage.from("firearm-photos").remove([f.photo_path]).catch(() => {});
      }
      set("photo_path", path);
    } catch (e) {
      alert("Upload failed: " + e.message);
    }
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
        <Field label="Estimated value ($)"><input type="number" value={f.value} onChange={(e) => set("value", e.target.value)} placeholder="650" /></Field>
      </div>
      <Field label="Notes"><textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Condition, included items, etc." /></Field>
      <div className="form-fld">
        <span>Firearm photo</span>
        {photoUrl ? (
          <div className="thumb form-photo">
            <img src={photoUrl} alt="Firearm" />
            <button onClick={removePhoto} type="button"><X size={12} /></button>
          </div>
        ) : (
          <label className="upload">
            <ImageIcon size={15} />
            <span>{uploading ? "Uploading…" : "Add a photo"}</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} disabled={uploading} />
          </label>
        )}
      </div>
      <div className="form-actions">
        <button className="ghost" onClick={onCancel} disabled={saving || uploading}>Cancel</button>
        <button className="primary" onClick={() => onSave(f)} disabled={saving || uploading || (!f.model && !f.nickname)}><Check size={15} /> {saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

// =================================================================
// RANGE LOG
// =================================================================
function RangeLog({ data, setData, userId }) {
  const rows = data.rangelog || [];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const fireName = (id) => {
    const f = (data.firearms || []).find((x) => x.id === id);
    return f ? (f.nickname || `${f.manufacturer} ${f.model}`) : "— deleted —";
  };
  const enriched = useMemo(() => rows.map((m) => ({ ...m, firearm: fireName(m.firearm_id) })), [rows, data.firearms]);
  const t = useTable(enriched, ["firearm","range_name","notes"], "visit_date");
  const blank = { firearm_id:(data.firearms?.[0]?.id || ""), visit_date:today(), range_name:"", rounds:"", notes:"", photo_paths:[] };

  const save = async (rec) => {
    setSaving(true);
    try {
      const payload = { firearm_id: rec.firearm_id, visit_date: rec.visit_date, range_name: rec.range_name, rounds: rec.rounds ? parseInt(rec.rounds) : null, notes: rec.notes, photo_paths: rec.photo_paths || [] };
      if (rec.id && rec.id.length > 20) {
        const { visit_date, range_name, rounds, notes, photo_paths } = payload;
        await supabase.from("range_log").update({ visit_date, range_name, rounds, notes, photo_paths }).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("range_log").insert([{ ...payload, user_id: userId }]).select();
        if (error) throw error;
        if (inserted?.length) rec.id = inserted[0].id;
      }
      setData((d) => {
        const exists = d.rangelog.some((x) => x.id === rec.id);
        return { ...d, rangelog: exists ? d.rangelog.map((x) => (x.id === rec.id ? { ...payload, id: rec.id, user_id: rec.user_id || userId } : x)) : [...d.rangelog, { ...payload, id: rec.id, user_id: userId }] };
      });
      setEditing(null);
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this range visit?")) return;
    try {
      await supabase.from("range_log").delete().eq("id", id);
      setData((d) => ({ ...d, rangelog: d.rangelog.filter((x) => x.id !== id) }));
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search range log…" addLabel="Add Range Visit" sortOptions={[{key:"visit_date",label:"Date"},{key:"firearm",label:"Firearm"},{key:"range_name",label:"Range"},{key:"rounds",label:"Rounds"}]} onAdd={() => data.firearms?.length ? setEditing({ ...blank, id: uid() }) : alert("Add a firearm first.")} onExportCSV={() => download("rangelog.csv", toCSV(enriched), "text/csv")} onExportJSON={() => download("rangelog.json", JSON.stringify(enriched, null, 2), "application/json")} />
      {t.view.length === 0 ? <Empty icon={MapPin} label="No range visits logged" hint="Log each range trip — location, rounds fired, and target photos." /> : (
        <div className="cards">{t.view.map((m) => (
          <div className="card" key={m.id}>
            <div className="card-top"><div className="card-ico range"><MapPin size={18} /></div><div className="card-title"><strong>{m.range_name || "Range visit"}</strong><span>{m.firearm}</span></div><span className="pill">{m.visit_date}</span></div>
            <div className="kv"><div><label>Rounds fired</label><span>{m.rounds ? Number(m.rounds).toLocaleString() : "—"}</span></div><div><label>Targets</label><span>{m.photo_paths?.length || 0} photo{(m.photo_paths?.length || 0) === 1 ? "" : "s"}</span></div></div>
            {m.photo_paths?.length > 0 && <div className="thumbs">{m.photo_paths.map((path, i) => {
              const url = supabase.storage.from("target-photos").getPublicUrl(path).data.publicUrl;
              return <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Target ${i + 1}`} /></a>;
            })}</div>}
            {m.notes && <p className="notes">{m.notes}</p>}
            <div className="card-actions"><button className="icon-btn" onClick={() => setEditing(rows.find((x) => x.id === m.id))}><Edit3 size={15} /></button><button className="icon-btn danger" onClick={() => remove(m.id)}><Trash2 size={15} /></button></div>
          </div>
        ))}</div>
      )}
      {editing && (
        <Modal title={rows.some((x) => x.id === editing.id) ? "Edit Range Visit" : "Add Range Visit"} onClose={() => setEditing(null)}>
          <RangeForm rec={editing} firearms={data.firearms || []} userId={userId} onSave={save} onCancel={() => setEditing(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

function RangeForm({ rec, firearms, userId, onSave, onCancel, saving }) {
  const [m, setM] = useState(rec);
  const set = (k, v) => setM((s) => ({ ...s, [k]: v }));
  const [uploadingImg, setUploadingImg] = useState(false);

  const addPhotos = async (files) => {
    setUploadingImg(true);
    const paths = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > 2_500_000) { alert(`"${file.name}" is over 2.5 MB and was skipped.`); continue; }
        const ext = file.name.split(".").pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${userId}/${m.id}/${filename}`;
        const { error } = await supabase.storage.from("target-photos").upload(path, file);
        if (error) { alert(`Upload failed: ${error.message}`); continue; }
        paths.push(path);
      }
      setM((s) => ({ ...s, photo_paths: [...(s.photo_paths || []), ...paths] }));
    } catch (e) {
      alert("Upload error: " + e.message);
    }
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
      </div>
      <Field label="Notes"><textarea rows={2} value={m.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Drills run, zero, malfunctions, how it shot…" /></Field>
      <div className="form-fld">
        <span>Target photos</span>
        <label className="upload"><ImageIcon size={15} /><span>{uploadingImg ? "Uploading…" : "Add target photos"}</span><input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files && addPhotos(e.target.files)} disabled={uploadingImg} /></label>
        {m.photo_paths?.length > 0 && (
          <div className="thumbs edit">{m.photo_paths.map((path, i) => {
            const url = supabase.storage.from("target-photos").getPublicUrl(path).data.publicUrl;
            return <div className="thumb" key={i}><img src={url} alt={`Target ${i + 1}`} /><button onClick={() => removePhoto(i)} type="button"><X size={12} /></button></div>;
          })}</div>
        )}
      </div>
      <div className="form-actions">
        <button className="ghost" onClick={onCancel} disabled={saving || uploadingImg}>Cancel</button>
        <button className="primary" onClick={() => onSave(m)} disabled={saving || uploadingImg}><Check size={15} /> {saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

// =================================================================
// ACCESSORIES
// =================================================================
function Accessories({ data, setData, userId }) {
  const rows = data.accessories || [];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const t = useTable(rows, ["name","type","brand","assigned_to"], "type");
  const blank = { name:"", type:"Scope", brand:"", quantity:1, assigned_to:"", value:"", notes:"" };

  const save = async (rec) => {
    setSaving(true);
    try {
      if (rec.id && rec.id.length > 20) {
        const { name, type, brand, quantity, assigned_to, value, notes } = rec;
        await supabase.from("accessories").update({ name, type, brand, quantity: parseInt(quantity) || 1, assigned_to, value: value ? parseFloat(value) : null, notes }).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("accessories").insert([{
          name: rec.name, type: rec.type, brand: rec.brand,
          quantity: parseInt(rec.quantity) || 1, assigned_to: rec.assigned_to,
          value: rec.value ? parseFloat(rec.value) : null, notes: rec.notes,
          user_id: userId
        }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.accessories.some((x) => x.id === rec.id);
        return { ...d, accessories: exists ? d.accessories.map((x) => (x.id === rec.id ? rec : x)) : [...d.accessories, rec] };
      });
      setEditing(null);
    } catch (e) { alert("Failed to save: " + e.message); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this accessory?")) return;
    try {
      await supabase.from("accessories").delete().eq("id", id);
      setData((d) => ({ ...d, accessories: d.accessories.filter((x) => x.id !== id) }));
    } catch (e) { alert("Failed to delete: " + e.message); }
  };

  return (
    <div className="tab">
      <Toolbar {...t} placeholder="Search accessories…" addLabel="Add Accessory" sortOptions={[{key:"type",label:"Type"},{key:"name",label:"Name"},{key:"brand",label:"Brand"},{key:"quantity",label:"Quantity"}]} onAdd={() => setEditing({ ...blank, id: uid() })} onExportCSV={() => download("accessories.csv", toCSV(rows), "text/csv")} onExportJSON={() => download("accessories.json", JSON.stringify(rows, null, 2), "application/json")} />
      {t.view.length === 0 ? <Empty icon={Package} label="No accessories yet" hint="Scopes, holsters, grips, magazines and more." /> : (
        <div className="cards">{t.view.map((a) => (
          <div className="card" key={a.id}>
            <div className="card-top"><div className="card-ico acc"><Package size={18} /></div><div className="card-title"><strong>{a.name || a.type}</strong><span>{a.brand || "—"}</span></div><span className="pill">{a.type}</span></div>
            <div className="kv"><div><label>Quantity</label><span>{a.quantity}</span></div><div><label>Assigned to</label><span>{a.assigned_to || "Unassigned"}</span></div><div><label>Est. value</label><span>{money(a.value)}</span></div></div>
            {a.notes && <p className="notes">{a.notes}</p>}
            <div className="card-actions"><button className="icon-btn" onClick={() => setEditing(a)}><Edit3 size={15} /></button><button className="icon-btn danger" onClick={() => remove(a.id)}><Trash2 size={15} /></button></div>
          </div>
        ))}</div>
      )}
      {editing && (
        <Modal title={rows.some((x) => x.id === editing.id) ? "Edit Accessory" : "Add Accessory"} onClose={() => setEditing(null)}>
          <div className="form">
            <div className="grid2">
              <Field label="Name"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Vortex Venom" /></Field>
              <Field label="Type"><select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>{ACCESSORY_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="Brand"><input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} placeholder="Vortex" /></Field>
              <Field label="Quantity"><input type="number" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: e.target.value })} /></Field>
              <Field label="Assigned to firearm"><select value={editing.assigned_to} onChange={(e) => setEditing({ ...editing, assigned_to: e.target.value })}><option value="">Unassigned</option>{(data.firearms || []).map((f) => <option key={f.id} value={f.nickname || `${f.manufacturer} ${f.model}`}>{f.nickname || `${f.manufacturer} ${f.model}`}</option>)}</select></Field>
              <Field label="Estimated value ($)"><input type="number" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></Field>
            </div>
            <Field label="Notes"><textarea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            <div className="form-actions"><button className="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="primary" onClick={() => save(editing)} disabled={saving}><Check size={15} /> {saving ? "Saving…" : "Save"}</button></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =================================================================
// AMMUNITION
// =================================================================
function Ammo({ data, setData, userId }) {
  const rows = data.ammo || [];
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const t = useTable(rows, ["caliber","type","brand","location"], "caliber");
  const LOW = 100;
  const blank = { caliber:"9mm", type:"FMJ", brand:"", grain:"", quantity:0, location:"", value:"" };

  const save = async (rec) => {
    setSaving(true);
    try {
      if (rec.id && rec.id.length > 20) {
        await supabase.from("ammo").update({
          caliber: rec.caliber, type: rec.type, brand: rec.brand, grain: rec.grain,
          quantity: parseInt(rec.quantity) || 0, location: rec.location,
          value: rec.value ? parseFloat(rec.value) : null
        }).eq("id", rec.id);
      } else {
        const { data: inserted, error } = await supabase.from("ammo").insert([{
          caliber: rec.caliber, type: rec.type, brand: rec.brand, grain: rec.grain,
          quantity: parseInt(rec.quantity) || 0, location: rec.location,
          value: rec.value ? parseFloat(rec.value) : null, user_id: userId
        }]).select();
        if (error) throw error;
        if (inserted?.length) rec = inserted[0];
      }
      setData((d) => {
        const exists = d.ammo.some((x) => x.id === rec.id);
        return { ...d, ammo: exists ? d.ammo.map((x) => (x.id === rec.id ? rec : x)) : [...d.ammo, rec] };
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
      <Toolbar {...t} placeholder="Search ammo…" addLabel="Add Ammunition" sortOptions={[{key:"caliber",label:"Caliber"},{key:"type",label:"Type"},{key:"quantity",label:"Quantity"},{key:"location",label:"Location"}]} onAdd={() => setEditing({ ...blank, id: uid() })} onExportCSV={() => download("ammo.csv", toCSV(rows), "text/csv")} onExportJSON={() => download("ammo.json", JSON.stringify(rows, null, 2), "application/json")} />
      {t.view.length === 0 ? <Empty icon={Boxes} label="No ammunition logged" hint="Track type, quantity and storage location." /> : (
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
    </div>
  );
}

// =================================================================
// MAINTENANCE
// =================================================================
function Maintenance({ data, setData }) {
  const rows = data.firearms || [];
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

  if (rows.length === 0) return <div className="tab"><Empty icon={Wrench} label="No firearms yet" hint="Add firearms first to track maintenance." /></div>;

  return (
    <div className="tab">
      <div className="maint-help">
        <span><Sparkles size={13} /> Auto-flag rules</span>
        <span>• Fired more than 90 days ago without cleaning → <strong>Needs Cleaning</strong></span>
        <span>• Cleaned more than 180 days ago without being fired or oiled since → <strong>Needs Oiling</strong></span>
      </div>
      <table className="grid-table maint-table">
        <thead><tr><th>Firearm</th><th>Last Cleaned</th><th>Last Oiled</th><th>Status</th></tr></thead>
        <tbody>{rows.map((f) => {
          const flags = getMaintenanceFlags(f, data.rangelog);
          const saving = savingId === f.id;
          return (
            <tr key={f.id}>
              <td><strong>{f.nickname || `${f.manufacturer} ${f.model}`}</strong><div className="dim" style={{fontSize:"11px"}}>{f.manufacturer} {f.model}</div></td>
              <td>
                <div className="maint-cell">
                  <input type="date" value={f.last_cleaned || ""} onChange={(e) => updateField(f, "last_cleaned", e.target.value)} disabled={saving} />
                  <button className="ghost small" onClick={() => setToday(f, "last_cleaned")} disabled={saving} title="Mark cleaned today"><Wrench size={12} /></button>
                </div>
              </td>
              <td>
                <div className="maint-cell">
                  <input type="date" value={f.last_oiled || ""} onChange={(e) => updateField(f, "last_oiled", e.target.value)} disabled={saving} />
                  <button className="ghost small" onClick={() => setToday(f, "last_oiled")} disabled={saving} title="Mark oiled today"><Droplet size={12} /></button>
                </div>
              </td>
              <td>{flags.length === 0 ? <span className="ok-flag">✓ Good</span> : flags.map((flag) => (
                <span key={flag} className={`maint-flag ${flag === "Needs Cleaning" ? "cleaning" : "oiling"}`}>
                  <AlertTriangle size={11} /> {flag}
                </span>
              ))}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

// =================================================================
// CHANGELOG
// =================================================================
function Changelog() {
  return (
    <div className="tab">
      <div className="changelog">{CHANGELOG.map((rel) => (
        <div className="release" key={rel.version}>
          <div className="release-rail"><div className={`release-dot ${rel.tag === "current" ? "cur" : ""}`} /></div>
          <div className="release-body">
            <div className="release-head"><span className="ver">v{rel.version}</span><h3>{rel.title}</h3>{rel.tag === "current" && <span className="cur-badge">Current</span>}<span className="rel-date">{rel.date}</span></div>
            <ul className="change-list">{rel.changes.map((c, i) => (<li key={i}><span className={`ct ct-${c.type}`}>{c.type}</span><span>{c.text}</span></li>))}</ul>
          </div>
        </div>
      ))}</div>
    </div>
  );
}

// =================================================================
// DASHBOARD
// =================================================================
function Dashboard({ data, go }) {
  const totalRounds = (data.rangelog || []).reduce((s, m) => s + (Number(m.rounds) || 0), 0);
  const totalAmmo = (data.ammo || []).reduce((s, a) => s + (Number(a.quantity) || 0), 0);
  const collectionValue = (data.firearms || []).reduce((s, f) => s + (Number(f.value) || 0), 0) + (data.accessories || []).reduce((s, a) => s + (Number(a.value) || 0) * (Number(a.quantity) || 1), 0);

  const maintenance = useMemo(() => {
    const needsClean = [];
    const needsOil = [];
    (data.firearms || []).forEach((f) => {
      const flags = getMaintenanceFlags(f, data.rangelog);
      if (flags.includes("Needs Cleaning")) needsClean.push(f);
      if (flags.includes("Needs Oiling")) needsOil.push(f);
    });
    return { needsClean, needsOil };
  }, [data]);

  const lowAmmo = (data.ammo || []).filter((a) => Number(a.quantity) < 100);

  return (
    <div className="tab">
      <div className="dash-stats">
        <Stat icon={Target} label="Firearms" value={(data.firearms || []).length} accent="#c8643c" onClick={() => go("firearms")} />
        <Stat icon={MapPin} label="Range visits" value={(data.rangelog || []).length} accent="#5b8a72" onClick={() => go("rangelog")} />
        <Stat icon={Package} label="Accessories" value={(data.accessories || []).reduce((s, a) => s + (Number(a.quantity) || 1), 0)} accent="#7a86b8" onClick={() => go("accessories")} />
        <Stat icon={Boxes} label="Rounds on hand" value={totalAmmo.toLocaleString()} accent="#b89a4a" onClick={() => go("ammo")} />
        <Stat icon={Crosshair} label="Rounds fired" value={totalRounds.toLocaleString()} accent="#9c5a5a" onClick={() => go("rangelog")} />
        <Stat icon={Warehouse} label="Collection value" value={money(collectionValue)} accent="#6f9bb5" onClick={() => go("firearms")} />
      </div>

      <div className="dash-action-row">
        <div className={`action-card ${maintenance.needsClean.length > 0 ? "active" : ""}`} onClick={() => go("maintenance")}>
          <div className="action-ico clean"><Wrench size={20} /></div>
          <div>
            <div className="action-val">{maintenance.needsClean.length}</div>
            <div className="action-lbl">Need Cleaning</div>
          </div>
          {maintenance.needsClean.length > 0 && <span className="action-badge">Action Required</span>}
        </div>
        <div className={`action-card ${maintenance.needsOil.length > 0 ? "active" : ""}`} onClick={() => go("maintenance")}>
          <div className="action-ico oil"><Droplet size={20} /></div>
          <div>
            <div className="action-val">{maintenance.needsOil.length}</div>
            <div className="action-lbl">Need Oiling</div>
          </div>
          {maintenance.needsOil.length > 0 && <span className="action-badge">Action Required</span>}
        </div>
        <div className={`action-card ${lowAmmo.length > 0 ? "active" : ""}`} onClick={() => go("ammo")}>
          <div className="action-ico low"><AlertTriangle size={20} /></div>
          <div>
            <div className="action-val">{lowAmmo.length}</div>
            <div className="action-lbl">Low Ammo Calibers</div>
          </div>
          {lowAmmo.length > 0 && <span className="action-badge">Action Required</span>}
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head"><AlertTriangle size={16} /><h3>Maintenance Alerts</h3></div>
          {maintenance.needsClean.length === 0 && maintenance.needsOil.length === 0 && lowAmmo.length === 0 ? (
            <p className="panel-empty">Everything looks good. No alerts right now.</p>
          ) : (
            <ul className="alert-list">
              {maintenance.needsClean.map((f) => (
                <li key={`c-${f.id}`} onClick={() => go("maintenance")} style={{cursor:"pointer"}}>
                  <strong>{f.nickname || `${f.manufacturer} ${f.model}`}</strong>
                  <span>Needs cleaning — fired more than 90 days ago without cleaning.</span>
                </li>
              ))}
              {maintenance.needsOil.map((f) => (
                <li key={`o-${f.id}`} onClick={() => go("maintenance")} style={{cursor:"pointer"}}>
                  <strong>{f.nickname || `${f.manufacturer} ${f.model}`}</strong>
                  <span>Needs oiling — cleaned more than 6 months ago, not fired since.</span>
                </li>
              ))}
              {lowAmmo.map((a) => (
                <li key={`l-${a.id}`} onClick={() => go("ammo")} style={{cursor:"pointer"}}>
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
              const f = (data.firearms || []).find((x) => x.id === m.firearm_id);
              return <li key={m.id} onClick={() => go("rangelog")} style={{cursor:"pointer"}}>
                <span className="mono">{m.visit_date}</span>
                <span>{m.range_name || "Range visit"}</span>
                <span className="dim">{f ? (f.nickname || `${f.manufacturer} ${f.model}`) : "—"}</span>
              </li>;
            })}</ul>
          )}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// ROOT
// =================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState({ firearms: [], rangelog: [], accessories: [], ammo: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { setUser(session.user); await loadData(); }
      setAuthChecked(true); setLoading(false);
    })();
  }, []);

  const loadData = async () => {
    try {
      const [firearmsRes, rangeRes, accessoriesRes, ammoRes] = await Promise.all([
        supabase.from("firearms").select("*"),
        supabase.from("range_log").select("*"),
        supabase.from("accessories").select("*"),
        supabase.from("ammo").select("*"),
      ]);
      setData({
        firearms: firearmsRes.data || [],
        rangelog: rangeRes.data || [],
        accessories: accessoriesRes.data || [],
        ammo: ammoRes.data || [],
      });
    } catch (e) { console.error("Load error:", e); }
  };

  const handleAuth = (u) => { setUser(u); loadData(); };
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setData({ firearms: [], rangelog: [], accessories: [], ammo: [] });
    setTab("dashboard");
  };

  if (!authChecked) return <><Styles /><div className="boot"><Loader size={20} style={{animation:"spin 1s linear infinite"}} /> Loading…</div></>;
  if (!user) return <><Styles /><Login onAuth={handleAuth} /></>;

  const NAV = [
    { key:"dashboard", label:"Dashboard", icon: LayoutDashboard },
    { key:"firearms", label:"Firearms", icon: Target },
    { key:"rangelog", label:"Range Log", icon: MapPin },
    { key:"maintenance", label:"Maintenance", icon: Wrench },
    { key:"accessories", label:"Accessories", icon: Package },
    { key:"ammo", label:"Ammunition", icon: Boxes },
    { key:"changelog", label:"Changelog", icon: ScrollText },
  ];
  const SUB = {
    dashboard:"Overview of your collection, alerts and recent activity.",
    firearms:"Identification, photos, caliber, value and round count.",
    rangelog:"Log every range visit — location, rounds fired and target photos.",
    maintenance:"Track when each firearm was last cleaned and oiled.",
    accessories:"Scopes, holsters, grips, magazines and other gear.",
    ammo:"Type, quantity and storage location for your ammunition.",
    changelog:"Version history — every revision and edit to the app.",
  };

  return (
    <>
      <Styles />
      <div className="app">
        <aside className="sidebar">
          <div className="brand sm"><Warehouse size={20} strokeWidth={2.2} /><span>THE GUN SHED</span></div>
          <nav>{NAV.map((n) => (
            <button key={n.key} className={tab === n.key ? "on" : ""} onClick={() => setTab(n.key)}>
              <n.icon size={17} /><span>{n.label}</span>
            </button>
          ))}</nav>
          <div className="side-foot">
            <div className="lock-badge"><Lock size={12} /> Cloud synced</div>
            <div className="user">
              <div className="avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <span className="email">{user?.email}</span>
              <button className="icon-btn" onClick={logout} title="Log out"><LogOut size={15} /></button>
            </div>
            <div className="ver-foot">v{APP_VERSION}</div>
          </div>
        </aside>
        <main className="main">
          <header className="topbar">
            <h1>{NAV.find((n) => n.key === tab)?.label}</h1>
            <p>{SUB[tab]}</p>
          </header>
          <div className="content">
            {loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"400px",color:"var(--dim)"}}><Loader size={20} style={{animation:"spin 1s linear infinite",marginRight:"10px"}} />Loading your data…</div> : (
              <>
                {tab === "dashboard" && <Dashboard data={data} go={setTab} />}
                {tab === "firearms" && <Firearms data={data} setData={setData} userId={user.id} />}
                {tab === "rangelog" && <RangeLog data={data} setData={setData} userId={user.id} />}
                {tab === "maintenance" && <Maintenance data={data} setData={setData} />}
                {tab === "accessories" && <Accessories data={data} setData={setData} userId={user.id} />}
                {tab === "ammo" && <Ammo data={data} setData={setData} userId={user.id} />}
                {tab === "changelog" && <Changelog />}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// =================================================================
// STYLES
// =================================================================
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
    .sidebar { width:248px; flex-shrink:0; background:var(--bg2); border-right:1px solid var(--line); padding:22px 16px; display:flex; flex-direction:column; gap:24px; position:sticky; top:0; height:100vh; }
    .sidebar nav { display:flex; flex-direction:column; gap:3px; }
    .sidebar nav button { display:flex; align-items:center; gap:11px; padding:11px 12px; background:transparent; border:none; border-radius:8px; cursor:pointer; color:var(--dim); font-family:inherit; font-size:13.5px; font-weight:500; text-align:left; transition:all .15s; width:100%; }
    .sidebar nav button:hover { background:var(--panel); color:var(--text); }
    .sidebar nav button.on { background:linear-gradient(90deg, rgba(200,100,60,0.16), rgba(200,100,60,0.04)); color:var(--text); box-shadow:inset 2px 0 0 var(--accent); }
    .side-foot { margin-top:auto; display:flex; flex-direction:column; gap:10px; }
    .lock-badge { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--green); background:rgba(91,138,114,0.1); border:1px solid rgba(91,138,114,0.3); padding:6px 10px; border-radius:7px; justify-content:center; }
    .user { display:flex; align-items:center; gap:9px; padding:8px; background:var(--panel); border:1px solid var(--line); border-radius:8px; }
    .avatar { width:30px; height:30px; border-radius:7px; background:var(--accent); color:#fff; display:grid; place-items:center; font-weight:700; font-size:14px; flex-shrink:0; }
    .user .email { font-size:11.5px; color:var(--dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
    .ver-foot { text-align:center; font-size:10.5px; color:var(--faint); letter-spacing:.5px; }
    .main { flex:1; min-width:0; }
    .topbar { padding:26px 34px 18px; border-bottom:1px solid var(--line); background:var(--bg2); }
    .topbar h1 { font-family:'Oswald',sans-serif; font-weight:600; font-size:26px; letter-spacing:.5px; }
    .topbar p { color:var(--dim); font-size:13px; margin-top:4px; }
    .content { padding:26px 34px 60px; }
    .toolbar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
    .search { display:flex; align-items:center; gap:8px; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:0 11px; flex:1; min-width:220px; color:var(--faint); }
    .search input { background:transparent; border:none; outline:none; color:var(--text); font-family:inherit; font-size:13px; padding:9px 0; width:100%; }
    .sort { display:flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:0 9px; color:var(--faint); }
    .sort select { background:transparent; border:none; outline:none; color:var(--text); font-family:inherit; font-size:12.5px; padding:9px 2px; cursor:pointer; }
    .sort select option { background:var(--panel2); }
    .sort .dir { background:var(--panel2); border:1px solid var(--line); color:var(--text); width:24px; height:24px; border-radius:6px; cursor:pointer; font-size:13px; }
    .spacer { flex:1; }
    button.primary { display:flex; align-items:center; gap:6px; background:var(--accent); color:#fff; border:none; border-radius:8px; padding:9px 15px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:600; transition:background .15s; white-space:nowrap; }
    button.primary:hover { background:var(--accent-d); }
    button.primary:disabled { opacity:.45; cursor:not-allowed; }
    button.primary.big { width:100%; justify-content:center; padding:12px; font-size:14px; margin-top:4px; }
    button.ghost { display:flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); color:var(--dim); border-radius:8px; padding:9px 13px; cursor:pointer; font-family:inherit; font-size:12.5px; transition:all .15s; }
    button.ghost:hover { color:var(--text); border-color:var(--line2); }
    button.ghost:disabled { opacity:.5; cursor:not-allowed; }
    button.ghost.small { padding:6px 8px; font-size:11px; }
    .menu-wrap { position:relative; }
    .menu-wrap .menu { display:none; position:absolute; right:0; top:110%; background:var(--panel2); border:1px solid var(--line2); border-radius:8px; overflow:hidden; z-index:20; min-width:150px; box-shadow:0 12px 30px rgba(0,0,0,0.4); }
    .menu-wrap:hover .menu { display:block; }
    .menu button { display:block; width:100%; text-align:left; background:transparent; border:none; color:var(--dim); padding:10px 13px; font-family:inherit; font-size:12.5px; cursor:pointer; }
    .menu button:hover { background:var(--panel); color:var(--text); }
    .icon-btn { background:var(--panel2); border:1px solid var(--line); color:var(--dim); width:30px; height:30px; border-radius:7px; cursor:pointer; display:grid; place-items:center; transition:all .15s; }
    .icon-btn:hover { color:var(--text); border-color:var(--line2); }
    .icon-btn:disabled { opacity:.5; cursor:not-allowed; }
    .icon-btn.danger:hover { color:#fff; background:var(--danger); border-color:var(--danger); }
    .cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:14px; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:16px; display:flex; flex-direction:column; gap:12px; transition:border-color .15s; }
    .card:hover { border-color:var(--line2); }
    .firearm-card { padding-top:0; overflow:hidden; }
    .firearm-card .card-top, .firearm-card .kv, .firearm-card .notes, .firearm-card .card-actions { padding-left:16px; padding-right:16px; }
    .firearm-card .card-top { padding-top:16px; }
    .firearm-card .card-actions { padding-bottom:16px; }
    .firearm-photo { height:160px; overflow:hidden; background:var(--bg); margin:0 -16px; border-bottom:1px solid var(--line); }
    .firearm-photo img { width:100%; height:100%; object-fit:cover; display:block; }
    .firearm-card { padding:0; }
    .card-top { display:flex; align-items:flex-start; gap:11px; }
    .card-ico { width:38px; height:38px; border-radius:9px; display:grid; place-items:center; flex-shrink:0; }
    .card-ico.fire { background:rgba(200,100,60,0.15); color:var(--accent); }
    .card-ico.acc { background:rgba(122,134,184,0.15); color:#9aa3cc; }
    .card-ico.range { background:rgba(91,138,114,0.15); color:var(--green); }
    .card-title { flex:1; min-width:0; }
    .card-title strong { display:block; font-size:14.5px; font-family:'Oswald',sans-serif; font-weight:600; letter-spacing:.3px; }
    .card-title span { font-size:12px; color:var(--dim); }
    .pill { font-size:10.5px; text-transform:uppercase; letter-spacing:.6px; background:var(--panel2); border:1px solid var(--line2); color:var(--dim); padding:3px 8px; border-radius:20px; flex-shrink:0; }
    .kv { display:grid; grid-template-columns:1fr 1fr; gap:9px 14px; }
    .kv > div { display:flex; flex-direction:column; gap:1px; }
    .kv label { font-size:10px; text-transform:uppercase; letter-spacing:.6px; color:var(--faint); }
    .kv span { font-size:13px; }
    .caliber-tooltip { display:inline-flex; align-items:center; gap:6px; cursor:help; }
    .ammo-pill { font-size:10px; background:rgba(184,154,74,0.15); color:var(--gold); border:1px solid rgba(184,154,74,0.35); padding:1px 6px; border-radius:10px; font-variant-numeric:tabular-nums; }
    .notes { font-size:12px; color:var(--dim); border-top:1px solid var(--line); padding-top:9px; line-height:1.45; }
    .card-actions { display:flex; gap:6px; justify-content:flex-end; }
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
    .action-ico.low { background:rgba(184,80,74,0.15); color:var(--danger); }
    .action-val { font-family:'Oswald',sans-serif; font-size:26px; font-weight:700; line-height:1; }
    .action-lbl { font-size:12px; color:var(--dim); margin-top:3px; text-transform:uppercase; letter-spacing:.5px; }
    .action-badge { position:absolute; top:8px; right:10px; font-size:9px; font-weight:700; background:var(--danger); color:#fff; padding:3px 7px; border-radius:10px; text-transform:uppercase; letter-spacing:.5px; }
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
    .maint-cell { display:flex; align-items:center; gap:6px; }
    .maint-cell input[type="date"] { background:var(--panel2); border:1px solid var(--line); color:var(--text); padding:6px 8px; border-radius:6px; font-family:inherit; font-size:12.5px; outline:none; }
    .maint-cell input[type="date"]:focus { border-color:var(--accent); }
    .ok-flag { color:var(--green); font-size:12px; font-weight:600; }
    .maint-flag { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:5px; font-size:11px; font-weight:600; margin-right:6px; }
    .maint-flag.cleaning { background:rgba(200,100,60,0.15); color:var(--accent); border:1px solid rgba(200,100,60,0.35); }
    .maint-flag.oiling { background:rgba(91,138,114,0.15); color:var(--green); border:1px solid rgba(91,138,114,0.35); }
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
    .modal-back { position:fixed; inset:0; background:rgba(10,9,6,0.78); display:grid; place-items:center; z-index:100; padding:20px; backdrop-filter:blur(2px); }
    .modal { background:var(--bg2); border:1px solid var(--line2); border-radius:14px; width:100%; max-width:560px; max-height:90vh; overflow:auto; }
    .modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg2); }
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
