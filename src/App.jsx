import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { Target, Package, Boxes, LayoutDashboard, LogOut, Search, Plus, Trash2, X, AlertTriangle, ArrowUpDown, Check, Lock, MapPin, ScrollText, Loader, Wrench, Droplet, HelpCircle, ShoppingCart, Tag, Users, ChevronRight, MoreVertical, Star, Backpack, CheckCircle2, ShieldCheck, Eye, Hand, Zap, Menu, Hammer, Send, Bell, CheckCheck, MessageCircle, Ticket, FileText, AlertCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUPER_ADMIN_EMAIL = "pierfelicejohnny@yahoo.com";

function LogoIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }}>
      <path d="M 100 20 L 160 55 L 160 145 L 100 180 L 40 145 L 40 55 Z" fill="none" stroke="currentColor" />
      <rect x="60" y="60" width="80" height="80" rx="4" fill="none" stroke="currentColor" />
      <circle cx="100" cy="100" r="12" fill="none" stroke="currentColor" />
      <line x1="88" y1="100" x2="112" y2="100" stroke="currentColor" />
      <line x1="100" y1="88" x2="100" y2="112" stroke="currentColor" />
    </svg>
  );
}

/* ── Constants ─────────────────────────────────────── */
const MANUFACTURERS = ["Glock","Smith & Wesson","Sig Sauer","Ruger","Colt","Remington","Springfield Armory","Beretta","CZ","Heckler & Koch","Winchester","Mossberg","Savage Arms","Browning","FN Herstal","Walther","Kimber","Daniel Defense","Aero Precision","Palmetto State Armory","Henry","Marlin","Benelli","Tikka","Bergara","Other"];
const CALIBERS = ["9mm",".45 ACP",".40 S&W",".380 ACP","10mm",".22 LR",".223 Rem","5.56 NATO",".308 Win","7.62x39","6.5 Creedmoor",".300 BLK",".30-06",".270 Win","12 Gauge","20 Gauge",".410 Bore",".357 Mag",".38 Special","44 Mag","Other"];
const FIREARM_TYPES = ["Pistol","Revolver","Rifle","Shotgun","Other"];
const ATTACHMENT_TYPES = ["Scope","Red Dot","Holster","Grip","Magazine","Light","Sling","Bipod","Suppressor","Other"];
const AMMO_TYPES = ["FMJ","JHP","Match","Birdshot","Buckshot","Slug","Subsonic","Frangible","Other"];
const SUPPLY_CATEGORIES = ["Cleaning Solvents","Lubricants / CLP","Brushes / Patches / Rods","Gun Cases / Bags","Ammo Storage","Targets","Hearing Protection","Eye Protection","Holsters / Belts","Slings / Gear","Manuals","Gun Safe","Maintenance Kits","Mag Pouches","Bore Cleaners","Lights / Batteries","Sights","Grips","Range Supplies","Other"];
const IMAGE_MAX_MB = 5;
const APP_VERSION = "1.5.4";

/* ── Friendly Error Translation ────────────────────── */
const FRIENDLY_ERRORS = {
  "Failed to fetch": "We're having trouble connecting. Check your internet and try again.",
  "NetworkError": "We're having trouble connecting. Check your internet and try again.",
  "TypeError": "Something unexpected happened. Please try again.",
  "not found": "We can't find what you're looking for.",
  "404": "We can't find that page.",
  "403": "You don't have permission to access that.",
  "401": "You need to log in to do that.",
  "500": "Something went wrong on our end. We're looking into it.",
  "permission denied": "You don't have permission to do that.",
  "duplicate": "That item already exists.",
  "violates": "There was a data conflict. Please check your input.",
  "schema cache": "An issue has been identified, Development team will be notified.",
  "PGRST": "There was a database issue. Please try again.",
  "JWT": "Your session expired. Please log in again.",
  "invalid input": "Please check your input and try again.",
  "null value": "A required field is missing. Please fill in all required fields.",
  "row-level security": "You don't have permission for that action.",
};

function friendlyMessage(raw) {
  if (!raw) return "Something went wrong. Please try again.";
  const str = String(raw).toLowerCase();
  for (const [key, msg] of Object.entries(FRIENDLY_ERRORS)) {
    if (str.includes(key.toLowerCase())) return msg;
  }
  return "Something went wrong. Please try again.";
}

/* ── Changelog (Complete Historical Record) ────────────────────────────────────
   Every version from initial release. This log is permanent and grows with each update.
   ──────────────────────────────────────────────────────────────────────────────── */
const CHANGELOG = [
  { version: "1.5.4", date: "2026-05-18", tag: "current", title: "Complete Ticket Management System — Testing Flow, History Tracking & Daily Digests", changes: [
    { type: "added", text: "New ticket status: pending_testing (ready for QA), needs_investigation (test failed)." },
    { type: "added", text: "Pending tickets can only be claimed by super admins." },
    { type: "added", text: "Testing claim/unclaim system — admins lock tickets while testing." },
    { type: "added", text: "Super admin can force-unlock tickets from other admins." },
    { type: "added", text: "Complete ticket history — logs every field change with timestamp and admin." },
    { type: "added", text: "Ticket history timeline UI in details modal." },
    { type: "added", text: "Auto-generated ticket titles from description (first 5 words)." },
    { type: "added", text: "Ticket search by number, title, description, or notes." },
    { type: "added", text: "Notes field on ticket status changes (mandatory before moving status)." },
    { type: "added", text: "Testing notes field (free text for test failures)." },
    { type: "added", text: "Last touched by tracking (always visible on tickets)." },
    { type: "added", text: "Three daily email digests at 7am CST via Resend." },
    { type: "added", text: "Digest 1: Pending items (super admin only)." },
    { type: "added", text: "Digest 2: Pending testing items (all admins)." },
    { type: "added", text: "Digest 3: Needs investigation items (super admin only)." },
    { type: "added", text: "AI-generated summaries in email digests (via Gemini)." },
    { type: "added", text: "Permanent ticket records (all tickets kept forever for audit)." },
    { type: "changed", text: "Renamed resolution_notes to notes." },
    { type: "changed", text: "Permission model: super admin can manage all tickets, regular admins limited to testing/working." },
  ]},
  { version: "1.5.3", date: "2026-05-18", tag: "", title: "Ticketing System — Error Tracking, Feature Requests & Ticket Management", changes: [
    { type: "added", text: "Tickets tab for admins and super admins." },
    { type: "added", text: "Automatic error ticket creation with friendly user-facing messages." },
    { type: "added", text: "Admins can manually submit tickets with additional context notes." },
    { type: "added", text: "Feature request tickets — up to 5 feature requests per ticket." },
    { type: "added", text: "Duplicate ticket detection — prevents repeat tickets for same error within 24 hours." },
    { type: "added", text: "Ticket numbering system for tracking (#001, #002, etc.)." },
    { type: "added", text: "Clickable ticket cards with full details modal." },
    { type: "added", text: "Ticket management for super admin — move tickets between pending, working, completed rejected, completed resolved." },
    { type: "added", text: "All admins can track all tickets in read-only mode." },
    { type: "changed", text: "All error alerts replaced with friendly error dialog." },
  ]},
  { version: "1.5.2", date: "2026-05-17", tag: "", title: "Complete Schema Correction", changes: [
    { type: "fixed", text: "All column names corrected to match actual Supabase schema." },
    { type: "fixed", text: "Firearms: value, current_value, nickname, acquired (not cost, purchase_date)." },
    { type: "fixed", text: "Accessories: name, brand (not description, manufacturer)." },
    { type: "fixed", text: "Ammo: location, grain (not storage_location, grain_weight)." },
    { type: "fixed", text: "Range Log: range_name, rounds, loadout_id (not location, rounds_fired)." },
    { type: "fixed", text: "Loadouts: items as array (not selected_firearms)." },
    { type: "fixed", text: "Supplies: purchased_at field." },
  ]},
  { version: "1.5.1", date: "2026-05-16", tag: "", title: "Tab Navigation & UI Polish", changes: [
    { type: "added", text: "Left sidebar navigation with all main tabs." },
    { type: "added", text: "Dashboard with quick stat cards." },
    { type: "added", text: "Mobile responsive menu." },
    { type: "added", text: "Support tab with FAQ and documentation." },
    { type: "added", text: "Change Log tab for admins." },
    { type: "changed", text: "Improved tab organization and naming." },
    { type: "changed", text: "Visual hierarchy and spacing." },
  ]},
  { version: "1.5.0", date: "2026-05-15", tag: "", title: "Gemini Chatbot & Admin Features", changes: [
    { type: "added", text: "Gemini AI chatbot floating widget." },
    { type: "added", text: "Admin user management tab." },
    { type: "added", text: "Super admin detection." },
    { type: "added", text: "Role-based access control (admin, super admin, user)." },
    { type: "added", text: "Persistent user profile system." },
  ]},
  { version: "1.4.0", date: "2026-05-14", tag: "", title: "For Sale & Inventory Management", changes: [
    { type: "added", text: "For Sale tab for listing firearms and attachments." },
    { type: "added", text: "Move firearms to for_sale status." },
    { type: "added", text: "Pricing override for sale items." },
    { type: "added", text: "Separate for_sale_listed_at tracking." },
  ]},
  { version: "1.3.5", date: "2026-05-13", tag: "", title: "Supplies & Shopping List", changes: [
    { type: "added", text: "Supplies Needed tab for shopping lists." },
    { type: "added", text: "Category system for supplies." },
    { type: "added", text: "Estimated cost tracking." },
    { type: "added", text: "Purchase status checkbox." },
    { type: "added", text: "Purchase date tracking." },
  ]},
  { version: "1.3.0", date: "2026-05-12", tag: "", title: "Load Outs System", changes: [
    { type: "added", text: "Load Out tab for range kits." },
    { type: "added", text: "Select multiple firearms per loadout." },
    { type: "added", text: "Favorite marking for loadouts." },
    { type: "added", text: "Usage counter." },
    { type: "added", text: "Notes field for loadout configurations." },
  ]},
  { version: "1.2.5", date: "2026-05-11", tag: "", title: "Range Logging System", changes: [
    { type: "added", text: "Range Log tab for range visits." },
    { type: "added", text: "Per-visit firearm selection." },
    { type: "added", text: "Rounds fired tracking." },
    { type: "added", text: "Range name suggestions." },
    { type: "added", text: "Loadout association for visits." },
    { type: "added", text: "Visit notes field." },
  ]},
  { version: "1.2.0", date: "2026-05-10", tag: "", title: "Up-Keep & Maintenance Tracking", changes: [
    { type: "added", text: "Up-Keep tab with maintenance schedules." },
    { type: "added", text: "Cleaning reminder (30-day cycle)." },
    { type: "added", text: "Oiling reminder (180-day cycle)." },
    { type: "added", text: "Tear down reminder (365-day cycle)." },
    { type: "added", text: "Optic check reminder (180-day cycle)." },
    { type: "added", text: "Holster check reminder (30-day cycle, carry firearms only)." },
    { type: "added", text: "One-click reset buttons for completed maintenance." },
  ]},
  { version: "1.1.5", date: "2026-05-09", tag: "", title: "Ammunition Inventory", changes: [
    { type: "added", text: "Ammunition tab for ammo tracking." },
    { type: "added", text: "Caliber selection from predefined list." },
    { type: "added", text: "Ammo type tracking (FMJ, JHP, etc.)." },
    { type: "added", text: "Brand and grain weight fields." },
    { type: "added", text: "Quantity tracking by rounds." },
    { type: "added", text: "Storage location field." },
    { type: "added", text: "Per-round value tracking." },
  ]},
  { version: "1.1.0", date: "2026-05-08", tag: "", title: "Accessories & Attachments", changes: [
    { type: "added", text: "Attachments tab for scopes, holsters, lights, etc." },
    { type: "added", text: "Type classification (Scope, Red Dot, Holster, etc.)." },
    { type: "added", text: "Brand and manufacturer tracking." },
    { type: "added", text: "Quantity management." },
    { type: "added", text: "Assigned-to field for cross-firearm tracking." },
    { type: "added", text: "Individual value tracking." },
    { type: "added", text: "Notes field for attachment details." },
  ]},
  { version: "1.0.5", date: "2026-05-07", tag: "", title: "Firearms Photo Upload", changes: [
    { type: "added", text: "Photo upload to Supabase storage." },
    { type: "added", text: "Image validation (size, type)." },
    { type: "added", text: "Public URL generation." },
    { type: "added", text: "Per-firearm photo display." },
    { type: "added", text: "Photo placeholder handling." },
  ]},
  { version: "1.0.0", date: "2026-05-01", tag: "", title: "Initial Release — Core Inventory System", changes: [
    { type: "added", text: "Authentication with Supabase (signup, login, session management)." },
    { type: "added", text: "Firearms tab with full CRUD operations." },
    { type: "added", text: "Firearm fields: nickname, manufacturer, model, serial, caliber, type." },
    { type: "added", text: "Acquisition date and current value tracking." },
    { type: "added", text: "Notes field for firearm details." },
    { type: "added", text: "Searchable table with sort controls." },
    { type: "added", text: "Dashboard with inventory statistics." },
    { type: "added", text: "Row-level security for multi-user data isolation." },
    { type: "added", text: "Dark theme UI with custom design system." },
    { type: "added", text: "Responsive layout (desktop & mobile)." },
  ]},
];

/* ── Helpers ───────────────────────────────────────── */
const uid = () => crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : r & 0x3 | 0x8).toString(16); });
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const money = (n) => (n || n === 0) ? `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

/* Ticket helpers */
const generateTicketTitle = async (ticket) => {
  if (!ticket) return "Untitled Ticket";
  
  // Try AI generation
  try {
    // Build comprehensive content from all ticket fields
    let content = "";
    if (ticket.description) content += `Description: ${ticket.description}\n`;
    if (ticket.admin_notes) content += `Notes: ${ticket.admin_notes}\n`;
    if (ticket.feature_requests && ticket.feature_requests.length > 0) {
      content += `Features: ${ticket.feature_requests.map(f => `${f.title} - ${f.description}`).join('; ')}\n`;
    }
    if (ticket.title) content += `Title: ${ticket.title}\n`;
    
    const prompt = `You are a tech support ticket summarizer. Read this ticket and create a 5-word concise title that summarizes the main issue or request. Be specific and descriptive.

TICKET:
${content}

Respond with ONLY 5 words, max 50 characters total, nothing else:`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 50 }
      })
    });

    const data = await response.json();
    const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || fallbackTitle(ticket.description);
    return title.slice(0, 50);
  } catch (e) {
    return fallbackTitle(ticket.description);
  }
};

const fallbackTitle = (description) => {
  if (!description) return "Untitled Ticket";
  const words = description.trim().split(/\s+/).slice(0, 5);
  const cleaned = words.map((w, i) => {
    if (i === words.length - 1) return w.replace(/[.,!?;:—–]$/, '');
    return w;
  });
  return cleaned.join(' ').slice(0, 50);
};

const addHistoryEntry = (history, action, byId, byEmail, notes = "", oldStatus = null, newStatus = null) => {
  const entry = {
    action,
    by: byId,
    by_email: byEmail,
    at: new Date().toISOString(),
    notes: notes || "",
  };
  if (oldStatus) entry.old_status = oldStatus;
  if (newStatus) entry.new_status = newStatus;
  return [...(history || []), entry];
};

function validateImage(file) {
  if (file.size / 1024 / 1024 > IMAGE_MAX_MB) return `Image must be under ${IMAGE_MAX_MB}MB.`;
  if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(file.type)) return "Invalid image type.";
  return null;
}

/* ══════════════════════════════════════════════════════
   ERROR PROVIDER — wraps entire app
   - Shows friendly error dialog on any showError() call
   - Auto-creates ticket on close (all users)
   - Admins get "Submit Ticket with Notes" option
   - Duplicate detection: same error+source within 1 hour = skip
   ══════════════════════════════════════════════════════ */
const ErrorCtx = createContext({ showError: () => {} });
function useError() { return useContext(ErrorCtx); }

function ErrorProvider({ children, userId, userEmail, isAdmin }) {
  const [dialog, setDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const recentErrorsRef = useRef([]);

  const isDuplicate = (errMsg, source) => {
    const now = Date.now();
    // Clean entries older than 24 hours
    recentErrorsRef.current = recentErrorsRef.current.filter(e => now - e.ts < 86400000);
    const key = `${String(errMsg).slice(0, 200)}::${source}`;
    const exists = recentErrorsRef.current.some(e => e.key === key);
    if (!exists) recentErrorsRef.current.push({ key, ts: now });
    return exists;
  };

  const createTicket = async (rawError, source, notes) => {
    if (!userId) return;
    if (isDuplicate(rawError, source)) return; // skip duplicate
    try {
      await supabase.from("tickets").insert([{
        user_id: userId,
        user_email: userEmail || "",
        type: "error",
        status: "pending",
        title: friendlyMessage(rawError),
        description: notes || "",
        error_message: String(rawError).slice(0, 500),
        error_source: source || "app",
      }]);
    } catch (e) { console.error("Ticket creation failed:", e); }
  };

  const showError = useCallback((rawError, source) => {
    const friendly = friendlyMessage(rawError);
    setDialog({ friendly, raw: String(rawError), source: source || "app" });
  }, []);

  // Close with auto-ticket (no notes)
  const closeAutoTicket = async () => {
    if (!dialog) return;
    await createTicket(dialog.raw, dialog.source, "");
    setDialog(null);
    setAdminNotes("");
  };

  // Close with manual ticket (admin added notes)
  const closeWithNotes = async () => {
    if (!dialog) return;
    await createTicket(dialog.raw, dialog.source, adminNotes);
    setDialog(null);
    setAdminNotes("");
  };

  return (
    <ErrorCtx.Provider value={{ showError }}>
      {children}
      {dialog && (
        <div className="modal-back" onMouseDown={closeAutoTicket}>
          <div className="modal" style={{ maxWidth: 480 }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3><AlertCircle size={18} style={{ color: "var(--danger)" }} /> Something Went Wrong</h3>
              <button className="icon-btn" onClick={closeAutoTicket}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{dialog.friendly}</p>
              {isAdmin && (
                <>
                  <Field label="Additional Notes (Please describe what you were doing that caused the error)">
                    <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Describe what you were doing when this happened..." style={{ minHeight: 80 }} />
                  </Field>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="primary" onClick={closeWithNotes} style={{ flex: 1 }} disabled={!adminNotes.trim()}>
                      <Ticket size={14} /> Submit Ticket with Notes
                    </button>
                    <button className="ghost" onClick={closeAutoTicket}>Close</button>
                  </div>
                  <p style={{ fontSize: 10, color: "var(--faint)", marginTop: 8 }}>
                    Closing without submitting still logs an automatic ticket.
                  </p>
                </>
              )}
              {!isAdmin && (
                <button className="primary" onClick={closeAutoTicket} style={{ width: "100%" }}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </ErrorCtx.Provider>
  );
}

/* ── Shared UI Components ──────────────────────────── */
function Field({ label, children }) {
  return <label className="form-fld"><span>{label}</span>{children}</label>;
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className={`modal ${wide ? "wide" : ""}`} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
function Stat({ icon: Icon, label, value, accent, onClick }) {
  return (
    <div className="stat" style={accent ? { borderColor: accent } : {}} onClick={onClick}>
      <div className="stat-ico" style={accent ? { color: accent } : {}}><Icon size={20} /></div>
      <div><div className="stat-val">{value}</div><div className="stat-lbl">{label}</div></div>
    </div>
  );
}
function Empty({ icon: Icon, label, hint }) {
  return <div className="empty"><Icon size={40} strokeWidth={1.4} /><strong>{label}</strong><span>{hint}</span></div>;
}
function Toolbar({ query, setQuery, sortKey, setSortKey, sortDir, setSortDir, sortOptions, onAdd, placeholder, addLabel = "Add", children }) {
  return (
    <div className="toolbar">
      {onAdd && <button className="primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>}
      <div className="search-big"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder} /></div>
      {sortOptions && <div className="sort"><ArrowUpDown size={14} />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)}>{sortOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}</select>
        <button className="dir" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>{sortDir === "asc" ? "↑" : "↓"}</button>
      </div>}
      <div className="spacer" />{children}
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
    if (q) r = r.filter(x => searchFields.some(f => String(x[f] ?? "").toLowerCase().includes(q)));
    r = [...r].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av == null) av = "";
      if (bv == null) bv = "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [rows, query, sortKey, sortDir, searchFields]);
  return { query, setQuery, sortKey, setSortKey, sortDir, setSortDir, view };
}

/* ══════════════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════════════ */
function Login({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = window.location.hash;
    if (h.includes("access_token")) {
      (async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session?.user) {
            onAuth(data.session.user);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (e) {}
      })();
    }
  }, [onAuth]);

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) return setErr("Enter a valid email.");
    if (pw.length < 6) return setErr("Password must be 6+ characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) { setBusy(false); return setErr(error.message); }
        setErr("");
        alert("Check your email to verify, then log in.");
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
        <label className="fld"><span>Email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} /></label>
        <label className="fld"><span>Password</span><input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} /></label>
        {err && <div className="err"><AlertTriangle size={14} /> {err}</div>}
        <button className="primary big" onClick={submit} disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create Account" : "Log In"}</button>
        <div className="note"><Lock size={12} /><span>Protected by Row Level Security.</span></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════ */
function Dashboard({ data, go }) {
  const firearms = data.firearms || [];
  const stats = [
    { icon: Target, label: "Firearms", value: firearms.filter(f => !f.for_sale).length, color: "var(--accent)", action: "firearms" },
    { icon: MapPin, label: "Range Visits", value: (data.rangelog || []).length, color: "var(--green)", action: "rangelog" },
    { icon: Package, label: "Attachments", value: (data.accessories || []).length, color: "var(--gold)", action: "attachments" },
    { icon: Boxes, label: "Ammo Types", value: (data.ammo || []).length, color: "var(--gold)", action: "ammunition" },
  ];
  return (
    <div className="tab">
      <div className="dashboard-welcome"><h2>Welcome back! 🎯</h2><p>Your firearms are secure. Let's keep them in top shape.</p></div>
      <div className="dashboard-grid">{stats.map(s => <Stat key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.color} onClick={() => go(s.action)} />)}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FIREARMS
   Cols: id, user_id, nickname, manufacturer, model, serial, caliber, type, acquired, value, current_value, notes, photo_path, for_sale, for_sale_listed_at, sold, sold_at, sold_price, last_cleaned, last_oiled, last_torn_down, last_safe_audit, last_optic_check, last_holster_check, has_carry_holster, damaged
   ══════════════════════════════════════════════════════ */
function Firearms({ data, setData, userId }) {
  const { showError } = useError();
  const EMPTY = { nickname: "", manufacturer: "", model: "", serial: "", caliber: "", type: "", acquired: today(), value: 0, current_value: 0, notes: "", photo_path: "" };
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const firearms = (data.firearms || []).filter(f => !f.for_sale);
  const table = useTable(firearms, ["nickname", "manufacturer", "model", "serial", "caliber"], "manufacturer");

  const closeModal = () => { setEditId(null); setForm({ ...EMPTY }); };
  const openEdit = (f) => {
    setForm({ nickname: f.nickname || "", manufacturer: f.manufacturer || "", model: f.model || "", serial: f.serial || "", caliber: f.caliber || "", type: f.type || "", acquired: f.acquired || "", value: f.value || 0, current_value: f.current_value || 0, notes: f.notes || "", photo_path: f.photo_path || "" });
    setEditId(f.id);
  };

  const save = async () => {
    try {
      const rec = { nickname: form.nickname, manufacturer: form.manufacturer, model: form.model, serial: form.serial, caliber: form.caliber, type: form.type, acquired: form.acquired || null, value: form.value || 0, current_value: form.current_value || 0, notes: form.notes, photo_path: form.photo_path, user_id: userId };
      let fid = editId;
      if (editId && editId !== "new") {
        const { error } = await supabase.from("firearms").update(rec).eq("id", editId);
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase.from("firearms").insert([rec]).select();
        if (error) throw error;
        fid = ins[0].id;
      }
      const { data: d } = await supabase.from("firearms").select("*");
      setData(prev => ({ ...prev, firearms: d || [] }));
      setEditId(fid);
    } catch (e) { showError(e.message, "Firearms > Save"); }
  };

  const del = async (id) => {
    if (!confirm("Delete this firearm?")) return;
    try {
      const { error } = await supabase.from("firearms").delete().eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, firearms: (prev.firearms || []).filter(f => f.id !== id) }));
    } catch (e) { showError(e.message, "Firearms > Delete"); }
  };

  const moveToSale = async (id) => {
    try {
      const { error } = await supabase.from("firearms").update({ for_sale: true, for_sale_listed_at: today() }).eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, firearms: (prev.firearms || []).map(f => f.id === id ? { ...f, for_sale: true, for_sale_listed_at: today() } : f) }));
      // Reload to update filtered view
      loadData();
    } catch (e) { showError(e.message, "Firearms > Move to Sale"); }
  };

  const uploadPhoto = async (file) => {
    if (!file || editId === "new") return;
    const err = validateImage(file);
    if (err) { showError(err, "Firearms > Photo"); return; }
    try {
      const path = `${userId}/firearms/${editId}/${uid()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("firearm-photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("firearm-photos").getPublicUrl(path);
      await supabase.from("firearms").update({ photo_path: publicUrl }).eq("id", editId);
      setForm(prev => ({ ...prev, photo_path: publicUrl }));
      setData(prev => ({ ...prev, firearms: (prev.firearms || []).map(f => f.id === editId ? { ...f, photo_path: publicUrl } : f) }));
    } catch (e) { showError(e.message, "Firearms > Photo Upload"); }
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "manufacturer", label: "Manufacturer" }, { key: "acquired", label: "Acquired" }, { key: "value", label: "Value" }]} placeholder="Search firearms..." addLabel="Add Firearm" onAdd={() => { setForm({ ...EMPTY }); setEditId("new"); }} />
      {table.view.length === 0 ? <Empty icon={Target} label="No Firearms" hint="Add your first firearm." /> :
        <div className="card-grid">{table.view.map(f => (
          <div key={f.id} className="firearm-card">
            {f.photo_path && <img src={f.photo_path} alt="" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} onError={e => { e.target.style.display = "none"; }} />}
            <div className="card-head">
              <div><strong>{f.nickname || f.manufacturer}</strong><span className="dim">{f.model}</span></div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="ghost small" onClick={() => openEdit(f)} style={{ padding: "4px 8px", fontSize: 11 }}>Edit</button>
                <button className="ghost small" onClick={() => moveToSale(f.id)} style={{ padding: "4px 8px", fontSize: 11 }}>Sale</button>
                <button className="ghost small" onClick={() => del(f.id)} style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}>Delete</button>
              </div>
            </div>
            <div className="card-body"><span><strong>{f.caliber}</strong> {f.type}</span><span className="dim">SN: {f.serial || "—"}</span><span className="dim">Acquired: {f.acquired || "—"}</span></div>
            <div className="card-foot"><span>{money(f.current_value || f.value)}</span></div>
          </div>
        ))}</div>}
      {editId && (
        <Modal title={editId === "new" ? "Add Firearm" : "Edit Firearm"} onClose={closeModal}>
          <Field label="Nickname"><input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} /></Field>
          <Field label="Manufacturer"><select value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })}><option value="">Select...</option>{MANUFACTURERS.map(m => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Model"><input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></Field>
          <Field label="Caliber"><select value={form.caliber} onChange={e => setForm({ ...form, caliber: e.target.value })}><option value="">Select...</option>{CALIBERS.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Type"><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="">Select...</option>{FIREARM_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Serial"><input value={form.serial} onChange={e => setForm({ ...form, serial: e.target.value })} /></Field>
          <Field label="Acquired"><input type="date" value={form.acquired} onChange={e => setForm({ ...form, acquired: e.target.value })} /></Field>
          <Field label="Value"><input type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} /></Field>
          <Field label="Current Value"><input type="number" value={form.current_value} onChange={e => setForm({ ...form, current_value: parseFloat(e.target.value) || 0 })} /></Field>
          {editId !== "new" && <Field label="Photo"><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} /></Field>}
          {editId === "new" && <p style={{ fontSize: 11, color: "var(--dim)", marginBottom: 12 }}>Save first, then upload a photo.</p>}
          <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 80 }} /></Field>
          <div style={{ display: "flex", gap: 8 }}><button className="primary" onClick={save} style={{ flex: 1 }}>Save</button><button className="ghost" onClick={closeModal}>Close</button></div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ATTACHMENTS
   Cols: id, user_id, name, type, brand, quantity, assigned_to, value, notes, for_sale, for_sale_listed_at, sold, sold_at, sold_price, photo_path
   ══════════════════════════════════════════════════════ */
function Attachments({ data, setData, userId }) {
  const { showError } = useError();
  const EMPTY = { name: "", type: "", brand: "", quantity: 0, assigned_to: "", value: 0, notes: "" };
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const table = useTable(data.accessories || [], ["name", "brand", "assigned_to", "type"], "type");

  const save = async () => {
    try {
      const rec = { name: form.name, type: form.type, brand: form.brand, quantity: form.quantity || 0, assigned_to: form.assigned_to, value: form.value || 0, notes: form.notes, user_id: userId };
      if (editId && editId !== "new") {
        const { error } = await supabase.from("accessories").update(rec).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accessories").insert([rec]).select();
        if (error) throw error;
      }
      const { data: d } = await supabase.from("accessories").select("*");
      setData(prev => ({ ...prev, accessories: d || [] }));
      setEditId(null); setForm({ ...EMPTY });
    } catch (e) { showError(e.message, "Attachments > Save"); }
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      const { error } = await supabase.from("accessories").delete().eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, accessories: (prev.accessories || []).filter(a => a.id !== id) }));
    } catch (e) { showError(e.message, "Attachments > Delete"); }
  };

  const moveToSale = async (id) => {
    try {
      const { error } = await supabase.from("accessories").update({ for_sale: true, for_sale_listed_at: today() }).eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, accessories: (prev.accessories || []).map(a => a.id === id ? { ...a, for_sale: true, for_sale_listed_at: today() } : a) }));
      // Reload to update filtered view
      loadData();
    } catch (e) { showError(e.message, "Attachments > Move to Sale"); }
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "type", label: "Type" }, { key: "brand", label: "Brand" }, { key: "value", label: "Value" }]} placeholder="Search attachments..." addLabel="Add Attachment" onAdd={() => { setForm({ ...EMPTY }); setEditId("new"); }} />
      {table.view.length === 0 ? <Empty icon={Package} label="No Attachments" hint="Add your first attachment." /> :
        <div className="card-grid">{table.view.map(a => (
          <div key={a.id} className="addon-card">
            <div className="card-head"><div><strong>{a.name}</strong><span className="dim">{a.type}</span></div><div style={{ display: "flex", gap: 4 }}><button className="ghost small" onClick={() => { setForm(a); setEditId(a.id); }} style={{ padding: "4px 8px", fontSize: 11 }}>Edit</button><button className="ghost small" onClick={() => moveToSale(a.id)} style={{ padding: "4px 8px", fontSize: 11 }}>Sale</button><button className="ghost small" onClick={() => del(a.id)} style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}>Delete</button></div></div>
            <div className="card-body"><span>{a.brand || "—"}</span><span className="dim">Qty: {a.quantity || 0}</span><span className="dim">Assigned: {a.assigned_to || "—"}</span></div>
            <div className="card-foot"><span>{money(a.value)}</span></div>
          </div>
        ))}</div>}
      {editId && (
        <Modal title={editId === "new" ? "Add Attachment" : "Edit Attachment"} onClose={() => setEditId(null)}>
          <Field label="Type"><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="">Select...</option>{ATTACHMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Brand"><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="Quantity"><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Value"><input type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} /></Field>
          <Field label="Assigned To"><input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 80 }} /></Field>
          <button className="primary" onClick={save} style={{ width: "100%" }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AMMUNITION
   Cols: id, user_id, caliber, type, brand, grain, quantity, location, value
   ══════════════════════════════════════════════════════ */
function Ammunition({ data, setData, userId }) {
  const { showError } = useError();
  const EMPTY = { caliber: "", type: "", brand: "", grain: "", quantity: 0, location: "", value: 0 };
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const table = useTable(data.ammo || [], ["caliber", "brand", "location", "type"], "caliber");

  const save = async () => {
    try {
      const rec = { caliber: form.caliber, type: form.type, brand: form.brand, grain: form.grain, quantity: form.quantity || 0, location: form.location, value: form.value || 0, user_id: userId };
      if (editId && editId !== "new") {
        const { error } = await supabase.from("ammo").update(rec).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ammo").insert([rec]).select();
        if (error) throw error;
      }
      const { data: d } = await supabase.from("ammo").select("*");
      setData(prev => ({ ...prev, ammo: d || [] }));
      setEditId(null); setForm({ ...EMPTY });
    } catch (e) { showError(e.message, "Ammunition > Save"); }
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      const { error } = await supabase.from("ammo").delete().eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, ammo: (prev.ammo || []).filter(a => a.id !== id) }));
    } catch (e) { showError(e.message, "Ammunition > Delete"); }
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "caliber", label: "Caliber" }, { key: "quantity", label: "Quantity" }]} placeholder="Search ammo..." addLabel="Add Ammo" onAdd={() => { setForm({ ...EMPTY }); setEditId("new"); }} />
      {table.view.length === 0 ? <Empty icon={Boxes} label="No Ammunition" hint="Log your ammo." /> :
        <div className="card-grid">{table.view.map(a => (
          <div key={a.id} className="ammo-card">
            <div className="card-head"><div><strong>{a.caliber}</strong><span className="dim">{a.type}</span></div><div style={{ display: "flex", gap: 4 }}><button className="ghost small" onClick={() => { setForm(a); setEditId(a.id); }} style={{ padding: "4px 8px", fontSize: 11 }}>Edit</button><button className="ghost small" onClick={() => del(a.id)} style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}>Delete</button></div></div>
            <div className="card-body"><span className="dim">{a.brand || "—"} {a.grain || ""}</span><span className="dim">{a.quantity || 0} rounds — {a.location || "—"}</span></div>
            <div className="card-foot"><span>{money(a.value)}</span></div>
          </div>
        ))}</div>}
      {editId && (
        <Modal title={editId === "new" ? "Add Ammo" : "Edit Ammo"} onClose={() => setEditId(null)}>
          <Field label="Caliber"><select value={form.caliber} onChange={e => setForm({ ...form, caliber: e.target.value })}><option value="">Select...</option>{CALIBERS.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Type"><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="">Select...</option>{AMMO_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Brand"><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="Grain"><input value={form.grain} onChange={e => setForm({ ...form, grain: e.target.value })} /></Field>
          <Field label="Quantity"><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Location"><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Value"><input type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} /></Field>
          <button className="primary" onClick={save} style={{ width: "100%" }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   UP-KEEP
   ══════════════════════════════════════════════════════ */
function UpKeep({ data, setData }) {
  const { showError } = useError();
  const firearms = data.firearms || [];
  const items = [
    { key: "last_cleaned", label: "Cleaning", freq: 30, icon: Wrench, list: firearms.filter(f => !f.last_cleaned || daysBetween(f.last_cleaned, today()) > 30) },
    { key: "last_oiled", label: "Oiling", freq: 180, icon: Droplet, list: firearms.filter(f => !f.last_oiled || daysBetween(f.last_oiled, today()) > 180) },
    { key: "last_torn_down", label: "Tear Down", freq: 365, icon: Hammer, list: firearms.filter(f => !f.last_torn_down || daysBetween(f.last_torn_down, today()) > 365) },
    { key: "last_optic_check", label: "Optic Check", freq: 180, icon: Eye, list: firearms.filter(f => !f.last_optic_check || daysBetween(f.last_optic_check, today()) > 180) },
    { key: "last_holster_check", label: "Holster Check", freq: 30, icon: Hand, list: firearms.filter(f => f.has_carry_holster && (!f.last_holster_check || daysBetween(f.last_holster_check, today()) > 30)) },
  ].sort((a, b) => b.list.length - a.list.length);

  const reset = async (gunId, key) => {
    try {
      const { error } = await supabase.from("firearms").update({ [key]: today() }).eq("id", gunId);
      if (error) throw error;
      setData(prev => ({ ...prev, firearms: (prev.firearms || []).map(f => f.id === gunId ? { ...f, [key]: today() } : f) }));
    } catch (e) { showError(e.message, "Up-Keep > Reset"); }
  };

  return (
    <div className="tab">
      {items.map(it => (
        <div key={it.key} style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <it.icon size={18} style={{ color: "var(--accent)" }} /> {it.label}
            <span style={{ color: "var(--faint)", fontSize: 12, marginLeft: "auto" }}>({it.list.length} due)</span>
          </h3>
          {it.list.length === 0
            ? <div style={{ padding: 20, color: "var(--dim)", textAlign: "center", background: "var(--panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)" }}>✓ All up to date</div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                {it.list.map(f => (
                  <div key={f.id} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                      <strong style={{ fontSize: 14 }}>{f.nickname || f.manufacturer} {f.model}</strong>
                      <button className="primary small" onClick={() => reset(f.id, it.key)}><Check size={12} /> Clear</button>
                    </div>
                    <span style={{ display: "block", fontSize: 12, color: "var(--dim)" }}>Last: {f[it.key] ? daysBetween(f[it.key], today()) + " days ago" : "Never"}</span>
                  </div>
                ))}
              </div>}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RANGE LOG
   Cols: id, user_id, firearm_id, visit_date, range_name, rounds, notes, photo_paths, loadout_id
   ══════════════════════════════════════════════════════ */
function RangeLog({ data, setData, userId }) {
  const { showError } = useError();
  const EMPTY = { firearm_id: "", visit_date: today(), range_name: "", rounds: 0, notes: "", loadout_id: "" };
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const logs = data.rangelog || [];
  const table = useTable(logs, ["range_name"], "visit_date");
  const savedRanges = [...new Set(logs.map(l => l.range_name).filter(Boolean))].slice(0, 5);

  const save = async () => {
    try {
      const rec = { firearm_id: form.firearm_id || null, visit_date: form.visit_date, range_name: form.range_name, rounds: form.rounds || 0, notes: form.notes, loadout_id: form.loadout_id || null, user_id: userId };
      if (editId && editId !== "new") {
        const { error } = await supabase.from("range_log").update(rec).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("range_log").insert([rec]).select();
        if (error) throw error;
      }
      const { data: d } = await supabase.from("range_log").select("*");
      setData(prev => ({ ...prev, rangelog: d || [] }));
      setEditId(null); setForm({ ...EMPTY });
    } catch (e) { showError(e.message, "Range Log > Save"); }
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      const { error } = await supabase.from("range_log").delete().eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, rangelog: (prev.rangelog || []).filter(l => l.id !== id) }));
    } catch (e) { showError(e.message, "Range Log > Delete"); }
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "visit_date", label: "Date" }, { key: "range_name", label: "Range" }]} placeholder="Search range logs..." addLabel="Log Visit" onAdd={() => { setForm({ ...EMPTY }); setEditId("new"); }} />
      {table.view.length === 0 ? <Empty icon={MapPin} label="No Range Logs" hint="Log your first visit." /> :
        <div className="card-grid">{table.view.map(l => {
          const gun = (data.firearms || []).find(f => f.id === l.firearm_id);
          return (
            <div key={l.id} className="log-card">
              <div className="card-head"><div><strong>{gun?.nickname || gun?.manufacturer || "—"}</strong><span className="dim">{l.visit_date}</span></div><div style={{ display: "flex", gap: 4 }}><button className="ghost small" onClick={() => { setForm(l); setEditId(l.id); }} style={{ padding: "4px 8px", fontSize: 11 }}>Edit</button><button className="ghost small" onClick={() => del(l.id)} style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}>Delete</button></div></div>
              <div className="card-body"><span><strong>{l.rounds || 0}</strong> rounds</span><span className="dim">{l.range_name || "—"}</span></div>
            </div>
          );
        })}</div>}
      {editId && (
        <Modal title={editId === "new" ? "Log Range Visit" : "Edit Log"} onClose={() => setEditId(null)}>
          <Field label="Firearm"><select value={form.firearm_id} onChange={e => setForm({ ...form, firearm_id: e.target.value })}><option value="">Select...</option>{(data.firearms || []).filter(f => !f.for_sale).map(f => <option key={f.id} value={f.id}>{f.nickname || f.manufacturer} {f.model}</option>)}</select></Field>
          <Field label="Date"><input type="date" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} /></Field>
          <Field label="Range Name"><input list="saved-ranges" value={form.range_name} onChange={e => setForm({ ...form, range_name: e.target.value })} /><datalist id="saved-ranges">{savedRanges.map(r => <option key={r} value={r} />)}</datalist></Field>
          <Field label="Rounds"><input type="number" value={form.rounds} onChange={e => setForm({ ...form, rounds: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Load Out"><select value={form.loadout_id || ""} onChange={e => setForm({ ...form, loadout_id: e.target.value })}><option value="">None</option>{(data.loadouts || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 80 }} /></Field>
          <button className="primary" onClick={save} style={{ width: "100%" }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LOAD OUT
   Cols: id, user_id, name, favorite, items (jsonb), notes, use_count
   ══════════════════════════════════════════════════════ */
function LoadOut({ data, setData, userId }) {
  const { showError } = useError();
  const EMPTY = { name: "", items: [], favorite: false, notes: "", use_count: 0 };
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const loadouts = data.loadouts || [];

  const save = async () => {
    try {
      if (!form.name.trim()) { showError("Name is required.", "Load Out"); return; }
      const rec = { name: form.name, items: form.items || [], favorite: form.favorite || false, notes: form.notes, use_count: form.use_count || 0, user_id: userId };
      if (editId && editId !== "new") {
        const { error } = await supabase.from("loadouts").update(rec).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loadouts").insert([rec]).select();
        if (error) throw error;
      }
      const { data: d } = await supabase.from("loadouts").select("*");
      setData(prev => ({ ...prev, loadouts: d || [] }));
      setEditId(null); setForm({ ...EMPTY });
    } catch (e) { showError(e.message, "Load Out > Save"); }
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      const { error } = await supabase.from("loadouts").delete().eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, loadouts: (prev.loadouts || []).filter(l => l.id !== id) }));
    } catch (e) { showError(e.message, "Load Out > Delete"); }
  };

  return (
    <div className="tab">
      <button className="primary" onClick={() => { setForm({ ...EMPTY }); setEditId("new"); }} style={{ marginBottom: 16 }}><Plus size={16} /> New Loadout</button>
      {loadouts.length === 0 ? <Empty icon={Backpack} label="No Loadouts" hint="Create a range loadout." /> :
        <div className="card-grid">{loadouts.map(l => (
          <div key={l.id} className="loadout-card">
            <div className="card-head"><div><strong>{l.name}</strong>{l.favorite && <Star size={14} style={{ fill: "var(--gold)", color: "var(--gold)" }} />}</div><div style={{ display: "flex", gap: 4 }}><button className="ghost small" onClick={() => { setForm(l); setEditId(l.id); }} style={{ padding: "4px 8px", fontSize: 11 }}>Edit</button><button className="ghost small" onClick={() => del(l.id)} style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}>Delete</button></div></div>
            <div className="card-body"><span className="dim">{(l.items || []).length} items</span><span className="dim">Used {l.use_count || 0}x</span></div>
          </div>
        ))}</div>}
      {editId && (
        <Modal title={editId === "new" ? "New Loadout" : "Edit Loadout"} onClose={() => setEditId(null)}>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Select Firearms">
            <div style={{ display: "grid", gap: 8, maxHeight: 200, overflowY: "auto" }}>
              {(data.firearms || []).filter(f => !f.for_sale).map(f => (
                <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={(form.items || []).includes(f.id)} onChange={e => setForm({ ...form, items: e.target.checked ? [...(form.items || []), f.id] : (form.items || []).filter(x => x !== f.id) })} />
                  <span>{f.nickname || f.manufacturer} {f.model}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 60 }} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><input type="checkbox" checked={form.favorite} onChange={e => setForm({ ...form, favorite: e.target.checked })} /> Favorite</label>
          <button className="primary" onClick={save} style={{ width: "100%" }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SUPPLIES NEEDED
   Cols: id, user_id, name, category, notes, est_cost, purchased, purchased_at
   ══════════════════════════════════════════════════════ */
function SuppliesNeeded({ data, setData, userId }) {
  const { showError } = useError();
  const EMPTY = { name: "", category: "", notes: "", est_cost: 0, purchased: false, purchased_at: null };
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const supplies = data.supplies || [];
  const table = useTable(supplies, ["name", "category"], "category");

  const save = async () => {
    try {
      if (!form.name.trim()) { showError("Name is required.", "Supplies"); return; }
      const rec = { name: form.name, category: form.category, notes: form.notes, est_cost: form.est_cost || 0, purchased: form.purchased || false, purchased_at: form.purchased_at || null, user_id: userId };
      if (editId && editId !== "new") {
        const { error } = await supabase.from("supplies").update(rec).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("supplies").insert([rec]).select();
        if (error) throw error;
      }
      const { data: d } = await supabase.from("supplies").select("*");
      setData(prev => ({ ...prev, supplies: d || [] }));
      setEditId(null); setForm({ ...EMPTY });
    } catch (e) { showError(e.message, "Supplies > Save"); }
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      const { error } = await supabase.from("supplies").delete().eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, supplies: (prev.supplies || []).filter(s => s.id !== id) }));
    } catch (e) { showError(e.message, "Supplies > Delete"); }
  };

  const toggle = async (id) => {
    try {
      const s = supplies.find(x => x.id === id);
      const pa = !s.purchased ? today() : null;
      const { error } = await supabase.from("supplies").update({ purchased: !s.purchased, purchased_at: pa }).eq("id", id);
      if (error) throw error;
      setData(prev => ({ ...prev, supplies: (prev.supplies || []).map(x => x.id === id ? { ...x, purchased: !x.purchased, purchased_at: pa } : x) }));
    } catch (e) { showError(e.message, "Supplies > Toggle"); }
  };

  return (
    <div className="tab">
      <Toolbar query={table.query} setQuery={table.setQuery} sortKey={table.sortKey} setSortKey={table.setSortKey} sortDir={table.sortDir} setSortDir={table.setSortDir} sortOptions={[{ key: "category", label: "Category" }, { key: "name", label: "Name" }]} placeholder="Search supplies..." addLabel="Add Supply" onAdd={() => { setForm({ ...EMPTY }); setEditId("new"); }} />
      {table.view.length === 0 ? <Empty icon={ShoppingCart} label="No Supplies" hint="Add supplies." /> :
        <div style={{ display: "grid", gap: 8 }}>{table.view.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: s.purchased ? "var(--panel2)" : "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", opacity: s.purchased ? 0.6 : 1 }}>
            <input type="checkbox" checked={s.purchased} onChange={() => toggle(s.id)} />
            <div style={{ flex: 1 }}><strong>{s.name}</strong><span style={{ display: "block", fontSize: 11, color: "var(--dim)" }}>{s.category}</span></div>
            <span style={{ color: "var(--dim)", fontSize: 12 }}>{money(s.est_cost)}</span>
            <div style={{ display: "flex", gap: 4 }}><button className="ghost small" onClick={() => { setForm(s); setEditId(s.id); }} style={{ padding: "4px 8px", fontSize: 11 }}>Edit</button><button className="ghost small" onClick={() => del(s.id)} style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}>Delete</button></div>
          </div>
        ))}</div>}
      {editId && (
        <Modal title={editId === "new" ? "Add Supply" : "Edit Supply"} onClose={() => setEditId(null)}>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Category"><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Select...</option>{SUPPLY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Estimated Cost"><input type="number" value={form.est_cost} onChange={e => setForm({ ...form, est_cost: parseFloat(e.target.value) || 0 })} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 60 }} /></Field>
          <button className="primary" onClick={save} style={{ width: "100%" }}>Save</button>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FOR SALE
   ══════════════════════════════════════════════════════ */
function ForSale({ data, setData, userId }) {
  const { showError } = useError();
  const [detailItem, setDetailItem] = useState(null);
  const [itemType, setItemType] = useState(null); // "firearm" or "accessory"
  const firearms = (data.firearms || []).filter(f => f.for_sale);
  const accessories = (data.accessories || []).filter(a => a.for_sale);

  const moveBackToCategory = async (id, type) => {
    try {
      const table = type === "firearm" ? "firearms" : "accessories";
      const { error } = await supabase.from(table).update({ for_sale: false, for_sale_listed_at: null }).eq("id", id);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        [type === "firearm" ? "firearms" : "accessories"]: (prev[type === "firearm" ? "firearms" : "accessories"] || []).map(item =>
          item.id === id ? { ...item, for_sale: false, for_sale_listed_at: null } : item
        )
      }));
      setDetailItem(null);
      setItemType(null);
    } catch (e) { showError(e.message, `ForSale > Move Back`); }
  };

  const deleteItem = async (id, type) => {
    if (!confirm("Delete this item?")) return;
    try {
      const table = type === "firearm" ? "firearms" : "accessories";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        [type === "firearm" ? "firearms" : "accessories"]: (prev[type === "firearm" ? "firearms" : "accessories"] || []).filter(item => item.id !== id)
      }));
      setDetailItem(null);
      setItemType(null);
    } catch (e) { showError(e.message, `ForSale > Delete`); }
  };

  return (
    <div className="tab">
      <h3 style={{ marginBottom: 16, fontFamily: "'Oswald',sans-serif", fontSize: 16 }}>Firearms for Sale</h3>
      {firearms.length === 0 ? <Empty icon={Target} label="None Listed" hint="Move from Firearms tab." /> :
        <div className="card-grid">{firearms.map(f => (
          <button
            key={f.id}
            onClick={() => { setDetailItem(f); setItemType("firearm"); }}
            style={{
              background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 14,
              textAlign: "left", cursor: "pointer", transition: "all .15s", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--line2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--line)"; }}
          >
            <div className="sale-card" style={{ border: "none", padding: 0 }}>
              <div className="card-head"><div><strong>{f.nickname || f.manufacturer}</strong><span className="dim">{f.model}</span></div></div>
              <div className="card-body"><span>{f.caliber} {f.type}</span><span className="dim">Asking: {money(f.current_value || f.value)}</span></div>
            </div>
            <div style={{ color: "var(--faint)", fontSize: 12 }}>Click to view</div>
          </button>
        ))}</div>}
      <h3 style={{ marginTop: 24, marginBottom: 16, fontFamily: "'Oswald',sans-serif", fontSize: 16 }}>Attachments for Sale</h3>
      {accessories.length === 0 ? <Empty icon={Package} label="None Listed" hint="Move from Attachments tab." /> :
        <div className="card-grid">{accessories.map(a => (
          <button
            key={a.id}
            onClick={() => { setDetailItem(a); setItemType("accessory"); }}
            style={{
              background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 14,
              textAlign: "left", cursor: "pointer", transition: "all .15s", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--line2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--line)"; }}
          >
            <div className="sale-card" style={{ border: "none", padding: 0 }}>
              <div className="card-head"><div><strong>{a.name}</strong><span className="dim">{a.type}</span></div></div>
              <div className="card-body"><span>{a.brand || "—"}</span><span className="dim">Asking: {money(a.value)}</span></div>
            </div>
            <div style={{ color: "var(--faint)", fontSize: 12 }}>Click to view</div>
          </button>
        ))}</div>}

      {/* Details Modal */}
      {detailItem && itemType === "firearm" && (
        <Modal title={`${detailItem.nickname || detailItem.manufacturer} — For Sale`} onClose={() => { setDetailItem(null); setItemType(null); }} wide>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20, padding: 12, background: "var(--panel2)", borderRadius: 8, border: "1px solid var(--line)" }}>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Manufacturer</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.manufacturer}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Model</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.model}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Caliber</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.caliber}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Type</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.type}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Serial</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.serial || "—"}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Asking Price</span><div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", marginTop: 4 }}>{money(detailItem.current_value || detailItem.value)}</div></div>
          </div>
          {detailItem.notes && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Notes</div><div style={{ fontSize: 12, color: "var(--text)", padding: 10, background: "var(--panel)", borderRadius: 8, border: "1px solid var(--line)" }}>{detailItem.notes}</div></div>}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Actions</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ghost" onClick={() => moveBackToCategory(detailItem.id, "firearm")} style={{ flex: 1 }}>Move Back to Firearms</button>
              <button className="primary danger" onClick={() => deleteItem(detailItem.id, "firearm")} style={{ flex: 1 }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Details Modal — Accessories */}
      {detailItem && itemType === "accessory" && (
        <Modal title={`${detailItem.name} — For Sale`} onClose={() => { setDetailItem(null); setItemType(null); }} wide>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20, padding: 12, background: "var(--panel2)", borderRadius: 8, border: "1px solid var(--line)" }}>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Type</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.type}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Brand</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.brand || "—"}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Quantity</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.quantity || 0}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Assigned To</span><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{detailItem.assigned_to || "—"}</div></div>
            <div><span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Asking Price</span><div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", marginTop: 4 }}>{money(detailItem.value)}</div></div>
          </div>
          {detailItem.notes && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Notes</div><div style={{ fontSize: 12, color: "var(--text)", padding: 10, background: "var(--panel)", borderRadius: 8, border: "1px solid var(--line)" }}>{detailItem.notes}</div></div>}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Actions</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ghost" onClick={() => moveBackToCategory(detailItem.id, "accessory")} style={{ flex: 1 }}>Move Back to Attachments</button>
              <button className="primary danger" onClick={() => deleteItem(detailItem.id, "accessory")} style={{ flex: 1 }}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TICKETS TAB — Admin & Super Admin only
   DB: tickets table
   Cols: id, user_id, user_email, type, status, title, description, error_message, error_source, feature_requests (jsonb), admin_notes, resolution_notes, created_at, updated_at
   ══════════════════════════════════════════════════════ */
const TICKET_STATUSES = ["pending", "working", "pending_testing", "needs_investigation", "completed_rejected", "completed_resolved"];
const STATUS_COLORS = { pending: "var(--gold)", working: "var(--accent)", pending_testing: "var(--green)", needs_investigation: "var(--danger)", completed_rejected: "#8b4545", completed_resolved: "#5e9178" };
const STATUS_LABELS = { pending: "Pending", working: "Working", pending_testing: "Pending Testing", needs_investigation: "Needs Investigation", completed_rejected: "Rejected", completed_resolved: "Resolved" };

function Tickets({ userId, userEmail, isSuperAdmin }) {
  const { showError } = useError();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [manualTicket, setManualTicket] = useState(null);
  const [featureReq, setFeatureReq] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [moveStatus, setMoveStatus] = useState("");
  const [moveNotes, setMoveNotes] = useState("");
  const [testingSteps, setTestingSteps] = useState("");
  const [claimNotes, setClaimNotes] = useState("");

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const { data: d, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setTickets(d || []);
    } catch (e) { showError(e.message, "Tickets > Load"); }
    finally { setLoading(false); }
  };

  // Generate ticket number from database
  const getTicketNumber = (ticket) => {
    if (ticket.ticket_number) return ticket.ticket_number;
    const idx = tickets.findIndex(t => t.id === ticket.id);
    return String(idx + 1);
  };

  // Search tickets
  const searchTickets = (query) => {
    if (!query.trim()) return tickets;
    const q = query.toLowerCase();
    return tickets.filter(t =>
      String(getTicketNumber(t)).includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.admin_notes?.toLowerCase().includes(q) ||
      t.testing_notes?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    );
  };

  const submitManualTicket = async () => {
    if (!manualTicket?.description?.trim()) { showError("Description is required.", "Tickets"); return; }
    try {
      const title = await generateTicketTitle(manualTicket);
      const history = [{ action: "created", by: userId, by_email: userEmail, at: new Date().toISOString(), notes: "" }];
      
      // Call database function to atomically get next ticket number
      const { data, error: funcError } = await supabase.rpc("get_next_ticket_number");
      
      if (funcError) throw funcError;
      if (data === null || data === undefined) throw new Error("Failed to get ticket number");
      
      const ticketNum = String(data);
      
      const { error } = await supabase.from("tickets").insert([{
        user_id: userId, user_email: userEmail, type: "manual", status: "pending",
        title, description: manualTicket.description, admin_notes: manualTicket.admin_notes || "",
        notes: "", testing_notes: "", ticket_history: history,
        test_claimed_by: null, test_claimed_at: null,
        last_touched_by: userId, last_touched_at: new Date().toISOString(),
        ticket_number: ticketNum,
      }]);
      if (error) throw error;
      setManualTicket(null);
      loadTickets();
    } catch (e) { showError(e.message, "Tickets > Manual Submit"); }
  };

  const submitFeatureRequest = async () => {
    const validItems = (featureReq?.items || []).filter(i => i.title?.trim());
    if (validItems.length === 0) { showError("At least one feature title is required.", "Tickets"); return; }
    try {
      const history = [{ action: "created", by: userId, by_email: userEmail, at: new Date().toISOString(), notes: "" }];
      
      // Call database function to atomically get next ticket number
      const { data, error: funcError } = await supabase.rpc("get_next_ticket_number");
      
      if (funcError) throw funcError;
      if (data === null || data === undefined) throw new Error("Failed to get ticket number");
      
      const ticketNum = String(data);
      
      // Use first feature title as ticket title
      const title = validItems[0].title;
      
      const { error } = await supabase.from("tickets").insert([{
        user_id: userId, user_email: userEmail, type: "feature_request", status: "pending",
        title: title, description: "", feature_requests: validItems,
        admin_notes: "", notes: "", testing_notes: "", ticket_history: history,
        test_claimed_by: null, test_claimed_at: null,
        last_touched_by: userId, last_touched_at: new Date().toISOString(),
        ticket_number: ticketNum,
      }]);
      if (error) throw error;
      setFeatureReq(null);
      loadTickets();
    } catch (e) { showError(e.message, "Tickets > Feature Request"); }
  };

  const claimForTesting = async (ticket) => {
    if (!isSuperAdmin && ticket.status === "pending") { showError("Only super admins can claim pending tickets.", "Tickets"); return; }
    try {
      const history = addHistoryEntry(ticket.ticket_history || [], "claimed_for_testing", userId, userEmail, claimNotes);
      const { error } = await supabase.from("tickets").update({
        test_claimed_by: userId, test_claimed_at: new Date().toISOString(),
        ticket_history: history, last_touched_by: userId, last_touched_at: new Date().toISOString()
      }).eq("id", ticket.id);
      if (error) throw error;
      
      // Update local state immediately
      setDetailTicket({
        ...detailTicket,
        test_claimed_by: userId,
        test_claimed_at: new Date().toISOString(),
        ticket_history: history,
        last_touched_by: userId,
        last_touched_at: new Date().toISOString()
      });
      
      setClaimNotes("");
      loadTickets();
    } catch (e) { showError(e.message, "Tickets > Claim"); }
  };

  const unclaimTesting = async (ticket) => {
    if (ticket.test_claimed_by !== userId && !isSuperAdmin) { showError("Only the claimer or super admin can unclaim.", "Tickets"); return; }
    try {
      const history = addHistoryEntry(ticket.ticket_history || [], "unclaimed", userId, userEmail);
      const { error } = await supabase.from("tickets").update({
        test_claimed_by: null, test_claimed_at: null,
        ticket_history: history, last_touched_by: userId, last_touched_at: new Date().toISOString()
      }).eq("id", ticket.id);
      if (error) throw error;
      
      // Update local state immediately
      setDetailTicket({
        ...detailTicket,
        test_claimed_by: null,
        test_claimed_at: null,
        ticket_history: history,
        last_touched_by: userId,
        last_touched_at: new Date().toISOString()
      });
      
      loadTickets();
    } catch (e) { showError(e.message, "Tickets > Unclaim"); }
  };

  const generateTestingStepsAI = async (ticket) => {
    try {
      const prompt = `Generate clear, step-by-step testing instructions for QA to verify this fix works. Keep it concise and actionable.

Type: ${ticket.type}
Title: ${ticket.title}
Description: ${ticket.description || ""}
Features: ${ticket.feature_requests ? ticket.feature_requests.map(f => f.title).join(", ") : ""}

Provide numbered steps only, no preamble.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300 }
        })
      });

      const data = await response.json();
      const steps = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate steps. Please add manually.";
      setTestingSteps(steps);
    } catch (e) {
      showError("Failed to generate testing steps. Add manually.", "AI");
    }
  };

  const updateTicketStatus = async () => {
    if (!detailTicket || !moveStatus) { showError("Status and notes required.", "Tickets"); return; }
    if (!moveNotes.trim() && moveStatus !== detailTicket.status) { showError("Please add notes when changing status.", "Tickets"); return; }
    try {
      let action = "status_changed";
      if (moveStatus === "completed_resolved") action = "testing_passed";
      if (moveStatus === "needs_investigation") action = "testing_failed";
      
      // Auto-generate testing steps if moving to pending_testing
      let stepsToSave = testingSteps;
      if (moveStatus === "pending_testing" && !stepsToSave) {
        stepsToSave = await generateTestingStepsAI(detailTicket);
      }
      
      const history = addHistoryEntry(detailTicket.ticket_history || [], action, userId, userEmail, moveNotes, detailTicket.status, moveStatus);
      const updateData = {
        status: moveStatus, ticket_history: history, last_touched_by: userId, last_touched_at: new Date().toISOString()
      };
      if (moveNotes) updateData.notes = moveNotes;
      if (moveStatus === "pending_testing" && stepsToSave) updateData.testing_steps = stepsToSave;
      
      const { error } = await supabase.from("tickets").update(updateData).eq("id", detailTicket.id);
      if (error) throw error;
      setDetailTicket(null); setMoveStatus(""); setMoveNotes(""); setTestingSteps("");
      loadTickets();
    } catch (e) { showError(e.message, "Tickets > Update Status"); }
  };

  const forceUnclaimAsSuper = async (ticket) => {
    if (!isSuperAdmin) { showError("Only super admin can force unlock.", "Tickets"); return; }
    try {
      const history = addHistoryEntry(ticket.ticket_history || [], "force_unclaimed_by_super_admin", userId, userEmail, `Force unlocked from ${ticket.test_claimed_by}`);
      const { error } = await supabase.from("tickets").update({
        test_claimed_by: null, test_claimed_at: null, ticket_history: history, last_touched_by: userId, last_touched_at: new Date().toISOString()
      }).eq("id", ticket.id);
      if (error) throw error;
      setDetailTicket(null);
      loadTickets();
    } catch (e) { showError(e.message, "Tickets > Force Unlock"); }
  };

  const filtered = searchTickets(searchQuery).filter(t => t.status === filter);
  const grouped = {};
  filtered.forEach(t => {
    const day = t.created_at?.slice(0, 10) || "Unknown";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(t);
  });
  const typeOrder = { error: 0, manual: 1, feature_request: 2 };
  Object.values(grouped).forEach(arr => arr.sort((a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9)));

  return (
    <div className="tab">
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="primary" onClick={() => setManualTicket({ description: "", admin_notes: "" })}><Plus size={14} /> New Ticket</button>
        {isSuperAdmin && <button className="primary" onClick={() => setFeatureReq({ items: [{ title: "", description: "" }] })}><FileText size={14} /> Feature Request</button>}
        <div className="spacer" />
        <div className="search-big" style={{ maxWidth: 300 }}><Search size={16} /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search # or text..." /></div>
        {TICKET_STATUSES.map(s => (
          <button key={s} className={filter === s ? "primary small" : "ghost small"} style={filter === s ? { background: STATUS_COLORS[s] } : {}} onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]} ({tickets.filter(t => t.status === s).length})
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : filtered.length === 0 ? <Empty icon={Ticket} label={`No ${STATUS_LABELS[filter]} Tickets`} hint="All clear." /> :
        Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([day, dayTickets]) => (
          <div key={day} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, color: "var(--faint)", marginBottom: 8, fontFamily: "'Oswald',sans-serif" }}>{day}</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {dayTickets.map(t => {
                const ticketNum = getTicketNumber(t);
                const isClaimed = t.test_claimed_by && t.test_claimed_by !== userId;
                const isClaimedByMe = t.test_claimed_by === userId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setDetailTicket(t)}
                    style={{
                      background: "var(--panel)", border: "1px solid var(--line)", borderLeft: `3px solid ${STATUS_COLORS[t.status]}`,
                      borderRadius: "var(--radius)", padding: 14, textAlign: "left", cursor: "pointer", transition: "all .15s",
                      display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 12, alignItems: "start", opacity: isClaimed ? 0.7 : 1
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Ticket</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>#{ticketNum}</div>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", padding: "2px 8px", borderRadius: 4,
                          background: t.type === "feature_request" ? "rgba(94,145,120,.15)" : t.type === "manual" ? "rgba(196,169,74,.15)" : "rgba(214,124,63,.15)",
                          color: t.type === "feature_request" ? "var(--green)" : t.type === "manual" ? "var(--gold)" : "var(--accent)",
                          border: `1px solid ${t.type === "feature_request" ? "rgba(94,145,120,.35)" : t.type === "manual" ? "rgba(196,169,74,.35)" : "rgba(214,124,63,.35)"}`
                        }}>
                          {t.type === "feature_request" ? "Feature" : t.type === "manual" ? "Manual" : "Error"}
                        </span>
                        <strong style={{ fontSize: 13, color: "var(--text)" }}>{t.title}</strong>
                      </div>
                      {t.description && <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 4 }}>{t.description.slice(0, 80)}</p>}
                      <span style={{ fontSize: 10, color: "var(--faint)" }}>
                        {isClaimedByMe && <span style={{ color: "var(--green)" }}>You are testing • </span>}
                        {isClaimed && <span style={{ color: "var(--gold)" }}>Claimed • </span>}
                        {t.created_at?.slice(0, 10)}
                      </span>
                    </div>
                    <div style={{ padding: "4px 8px", background: STATUS_COLORS[t.status], color: "#fff", fontSize: 10, fontWeight: 700, textTransform: "uppercase", borderRadius: 4, whiteSpace: "nowrap" }}>
                      {STATUS_LABELS[t.status]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      }

      {/* Manual Ticket Modal */}
      {manualTicket && (
        <Modal title="Submit Ticket" onClose={() => setManualTicket(null)}>
          <Field label="Description"><textarea value={manualTicket.description} onChange={e => setManualTicket({ ...manualTicket, description: e.target.value })} placeholder="Describe the issue or request..." style={{ minHeight: 100 }} /></Field>
          <Field label="Additional Notes (Admin)"><textarea value={manualTicket.admin_notes} onChange={e => setManualTicket({ ...manualTicket, admin_notes: e.target.value })} style={{ minHeight: 60 }} /></Field>
          <button className="primary" onClick={submitManualTicket} style={{ width: "100%" }}>Create Ticket</button>
        </Modal>
      )}

      {/* Feature Request Modal */}
      {featureReq && isSuperAdmin && (
        <Modal title="Feature Request" onClose={() => setFeatureReq(null)}>
          {featureReq.items.map((item, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < featureReq.items.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--accent)" }}>Feature {i + 1}</div>
              <Field label="Feature Title"><input value={item.title} onChange={e => { const items = [...featureReq.items]; items[i] = { ...items[i], title: e.target.value }; setFeatureReq({ ...featureReq, items }); }} /></Field>
              <Field label="Description"><textarea value={item.description} onChange={e => { const items = [...featureReq.items]; items[i] = { ...items[i], description: e.target.value }; setFeatureReq({ ...featureReq, items }); }} style={{ minHeight: 60 }} /></Field>
            </div>
          ))}
          {featureReq.items.length < 5 && (
            <button className="ghost" onClick={() => setFeatureReq({ ...featureReq, items: [...featureReq.items, { title: "", description: "" }] })} style={{ marginBottom: 16, width: "100%" }}>
              <Plus size={14} /> Add Another Feature ({featureReq.items.length}/5)
            </button>
          )}
          <button className="primary" onClick={submitFeatureRequest} style={{ width: "100%" }}>Submit</button>
        </Modal>
      )}

      {/* Ticket Details Modal */}
      {detailTicket && (
        <Modal title={`#${getTicketNumber(detailTicket)} — ${detailTicket.title}`} onClose={() => setDetailTicket(null)} wide>
          {/* Metadata */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16, padding: 12, background: "var(--panel2)", borderRadius: 8, border: "1px solid var(--line)" }}>
            <div><span style={{ fontSize: 9, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>Type</span><div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{detailTicket.type === "feature_request" ? "Feature" : detailTicket.type === "manual" ? "Manual" : "Error"}</div></div>
            <div><span style={{ fontSize: 9, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>Status</span><div style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[detailTicket.status], marginTop: 4 }}>{STATUS_LABELS[detailTicket.status]}</div></div>
            <div><span style={{ fontSize: 9, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>Created</span><div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>{detailTicket.created_at?.slice(0, 10)}</div></div>
            {detailTicket.last_touched_by && (
              <div><span style={{ fontSize: 9, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>Last Touched</span><div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>Just now</div></div>
            )}
          </div>

          {/* Description */}
          {detailTicket.description && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, padding: 10, background: "var(--panel)", borderRadius: 8, border: "1px solid var(--line)" }}>
                {detailTicket.description}
              </div>
            </div>
          )}

          {/* Error Message */}
          {detailTicket.error_message && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Error Message</div>
              <div style={{ fontSize: 11, color: "var(--dim)", lineHeight: 1.5, padding: 10, background: "var(--panel2)", borderRadius: 8, border: "1px solid var(--line)", fontFamily: "monospace", maxHeight: 120, overflowY: "auto", wordBreak: "break-all" }}>
                {detailTicket.error_message}
              </div>
            </div>
          )}

          {/* Testing Notes */}
          {detailTicket.testing_notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Testing Notes</div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, padding: 10, background: "rgba(193,84,79,.08)", borderRadius: 8, border: "1px solid rgba(193,84,79,.2)" }}>
                {detailTicket.testing_notes}
              </div>
            </div>
          )}

          {/* Testing Steps */}
          {detailTicket.testing_steps && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>How to Test</div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.8, padding: 12, background: "rgba(94,145,120,.08)", borderRadius: 8, border: "1px solid rgba(94,145,120,.2)", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                {detailTicket.testing_steps}
              </div>
            </div>
          )}

          {/* Notes */}
          {detailTicket.notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, padding: 10, background: "var(--panel)", borderRadius: 8, border: "1px solid var(--line)" }}>
                {detailTicket.notes}
              </div>
            </div>
          )}

          {/* Testing Claim */}
          {detailTicket.status === "pending_testing" && (
            <div style={{ marginBottom: 16, padding: 12, background: "var(--panel2)", borderRadius: 8, border: "1px solid var(--line)" }}>
              {!detailTicket.test_claimed_by ? (
                <>
                  <p style={{ fontSize: 12, marginBottom: 8 }}>This ticket is not claimed yet.</p>
                  <button className="primary" onClick={() => claimForTesting(detailTicket)} style={{ width: "100%" }}>Claim for Testing</button>
                </>
              ) : detailTicket.test_claimed_by === userId ? (
                <>
                  <p style={{ fontSize: 12, color: "var(--green)", marginBottom: 8, fontWeight: 600 }}>✓ You are testing this ticket</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="ghost" onClick={() => unclaimTesting(detailTicket)} style={{ flex: 1 }}>Unclaim</button>
                    <button style={{ flex: 1, padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--line)", background: moveStatus === "completed_resolved" ? "var(--green)" : "var(--panel)", color: moveStatus === "completed_resolved" ? "#fff" : "var(--text)", fontWeight: 600, cursor: "pointer" }} onClick={() => { setMoveStatus("completed_resolved"); setMoveNotes(""); }}>Passed ✓</button>
                    <button style={{ flex: 1, padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--line)", background: moveStatus === "needs_investigation" ? "var(--danger)" : "var(--panel)", color: moveStatus === "needs_investigation" ? "#fff" : "var(--text)", fontWeight: 600, cursor: "pointer" }} onClick={() => { setMoveStatus("needs_investigation"); setMoveNotes(""); }}>Failed ✗</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12, marginBottom: 8 }}>🔒 Claimed by another admin</p>
                  {isSuperAdmin && (
                    <button className="ghost" onClick={() => forceUnclaimAsSuper(detailTicket)} style={{ width: "100%" }}>Force Unlock (Super Admin)</button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Ticket History Timeline */}
          {detailTicket.ticket_history && detailTicket.ticket_history.length > 0 && (
            <div style={{ marginBottom: 16, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>History Timeline</div>
              <div style={{ display: "grid", gap: 8 }}>
                {[...detailTicket.ticket_history].reverse().map((entry, i) => (
                  <div key={i} style={{ padding: 10, background: "var(--panel2)", borderRadius: 6, borderLeft: "2px solid var(--line)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>
                      {entry.at?.slice(0, 16).replace("T", " ")} — {entry.by_email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>
                      {entry.action === "created" && "Created ticket"}
                      {entry.action === "status_changed" && `Moved to ${entry.new_status}`}
                      {entry.action === "claimed_for_testing" && "Claimed for testing"}
                      {entry.action === "unclaimed" && "Unclaimed"}
                      {entry.action === "testing_passed" && "Marked as testing passed"}
                      {entry.action === "testing_failed" && "Marked as testing failed"}
                      {entry.action === "force_unclaimed_by_super_admin" && "Force unlocked by super admin"}
                      {entry.notes && <div style={{ marginTop: 4, fontStyle: "italic", color: "var(--faint)" }}>"{entry.notes}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Change Form */}
          {isSuperAdmin && (detailTicket.status === "pending" || detailTicket.status === "working" || detailTicket.status === "pending_testing" || detailTicket.status === "needs_investigation") && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Manage Ticket</h4>
              <Field label="Move to Status">
                <select value={moveStatus} onChange={e => setMoveStatus(e.target.value)}>
                  <option value="">Select new status...</option>
                  {TICKET_STATUSES.filter(s => s !== detailTicket.status).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </Field>
              <Field label="Notes"><textarea value={moveNotes} onChange={e => setMoveNotes(e.target.value)} placeholder="Add notes for this status change..." style={{ minHeight: 80 }} /></Field>
              {moveStatus === "pending_testing" && (
                <div style={{ fontSize: 11, color: "var(--dim)", fontStyle: "italic" }}>Testing steps will be auto-generated based on ticket details.</div>
              )}
              <button className="primary" onClick={updateTicketStatus} style={{ width: "100%" }} disabled={!moveStatus || (!moveNotes.trim() && moveStatus !== detailTicket.status)}>Update Ticket</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SUPPORT
   ══════════════════════════════════════════════════════ */
function Support() {
  const docs = [
    { cat: "Getting Started", items: [{ t: "Adding a Firearm", c: "Go to Firearms, click Add. Fill details, save, then upload photo." }, { t: "Dashboard", c: "Shows stats and quick links." }] },
    { cat: "Inventory", items: [{ t: "Firearms", c: "Track value, serial, caliber. Move to For Sale when ready." }, { t: "Attachments", c: "Scopes, holsters, lights. Assign to firearms." }, { t: "Ammunition", c: "Track caliber, brand, grain, quantity, location." }] },
    { cat: "Maintenance", items: [{ t: "Up-Keep", c: "Cleaning (30d), oiling (180d), tear-downs (365d), optic checks (180d), holster checks (30d). Click Clear when done." }] },
    { cat: "Range", items: [{ t: "Range Log", c: "Log visits with firearm, range name, rounds. Range names auto-suggest." }, { t: "Load Outs", c: "Pre-built range kits. Select firearms. Track usage." }] },
  ];
  return (
    <div className="tab">
      <div style={{ display: "grid", gap: 24 }}>
        {docs.map(d => (
          <div key={d.cat}>
            <h3 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, marginBottom: 12, color: "var(--accent)" }}>{d.cat}</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {d.items.map((it, i) => (
                <details key={i} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                  <summary style={{ padding: "12px 14px", cursor: "pointer", fontWeight: 500 }}><ChevronRight size={14} /> {it.t}</summary>
                  <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)", color: "var(--dim)", lineHeight: 1.6, fontSize: 13 }}>{it.c}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADMIN
   ══════════════════════════════════════════════════════ */
function Admin({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter(u => !query || (u.email || "").toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="tab">
      <div className="admin-section">
        <h3>Users ({users.length})</h3>
        <div className="search-big" style={{ marginBottom: 16 }}><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search email…" /></div>
        {loading ? <p>Loading…</p> :
          <table className="grid-table">
            <thead><tr><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>{filtered.map(u => (
              <tr key={u.id}>
                <td><strong>{u.email}</strong>{u.email === currentUser.email && <span className="pill" style={{ marginLeft: 8 }}>You</span>}</td>
                <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                <td className="mono">{u.created_at?.slice(0, 10)}</td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CHANGE LOG
   ══════════════════════════════════════════════════════ */
function ChangeLog() {
  return (
    <div className="tab">
      <div className="changelog">
        {CHANGELOG.map(rel => (
          <div className="release" key={rel.version}>
            <div className="release-rail"><div className={`release-dot ${rel.tag === "current" ? "cur" : ""}`} /></div>
            <div className="release-body">
              <div className="release-head">
                <span className="ver">v{rel.version}</span>
                <h3>{rel.title}</h3>
                {rel.tag === "current" && <span className="cur-badge">Current</span>}
                <span className="rel-date">{rel.date}</span>
              </div>
              <ul className="change-list">{rel.changes.map((c, i) => (
                <li key={i}><span className={`ct ct-${c.type}`}>{c.type}</span><span>{c.text}</span></li>
              ))}</ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   GEMINI CHATBOT
   ══════════════════════════════════════════════════════ */
function GeminiChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hi! I'm the Gun Shed assistant. Ask me anything." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || !GEMINI_API_KEY) return;
    setMsgs(p => [...p, { role: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] }),
      });
      const d = await r.json();
      setMsgs(p => [...p, { role: "assistant", text: d.candidates?.[0]?.content?.parts?.[0]?.text || "No response." }]);
    } catch (e) {
      setMsgs(p => [...p, { role: "assistant", text: "Error: " + e.message }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(!open)}><MessageCircle size={20} /></button>
      {open && (
        <div className="chatbot-modal">
          <div className="chatbot-head"><strong>Gun Shed AI</strong><button className="icon-btn" onClick={() => setOpen(false)}><X size={16} /></button></div>
          <div className="chatbot-messages">
            {msgs.map((m, i) => <div key={i} className={`message ${m.role}`}><span>{m.text}</span></div>)}
            {loading && <div className="message assistant"><span>Thinking...</span></div>}
          </div>
          <div className="chatbot-input">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask anything..." />
            <button className="primary small" onClick={send} disabled={loading}><Send size={14} /></button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState({ firearms: [], rangelog: [], accessories: [], ammo: [], loadouts: [], supplies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
        await loadData();
      }
      setAuthChecked(true);
      setLoading(false);
    })();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setProfile(data);
    } catch (e) { setProfile(null); }
  };

  const loadData = async () => {
    try {
      const [f, r, a, am, l, s] = await Promise.all([
        supabase.from("firearms").select("*"),
        supabase.from("range_log").select("*"),
        supabase.from("accessories").select("*"),
        supabase.from("ammo").select("*"),
        supabase.from("loadouts").select("*"),
        supabase.from("supplies").select("*"),
      ]);
      setData({ firearms: f.data || [], rangelog: r.data || [], accessories: a.data || [], ammo: am.data || [], loadouts: l.data || [], supplies: s.data || [] });
    } catch (e) { console.error(e); }
  };

  const handleAuth = async (u) => { setUser(u); await loadProfile(u.id); await loadData(); };
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    setData({ firearms: [], rangelog: [], accessories: [], ammo: [], loadouts: [], supplies: [] });
    setTab("dashboard");
  };

  if (!authChecked) return <><Styles /><div className="boot"><Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading…</div></>;
  if (!user) return <><Styles /><Login onAuth={handleAuth} /></>;

  const isAdmin = profile?.role === "admin";
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "firearms", label: "Firearms", icon: Target },
    { key: "attachments", label: "Attachments", icon: Package },
    { key: "ammunition", label: "Ammunition", icon: Boxes },
    { key: "upkeep", label: "Up-Keep", icon: Wrench },
    { key: "rangelog", label: "Range Log", icon: MapPin },
    { key: "loadout", label: "Load Out", icon: Backpack },
    { key: "supplies", label: "Supplies Needed", icon: ShoppingCart },
    { key: "forsale", label: "For Sale", icon: Tag },
    { key: "support", label: "Support", icon: HelpCircle },
  ];
  if (isAdmin) {
    NAV.push({ key: "tickets", label: "Tickets", icon: Ticket });
    NAV.push({ key: "admin", label: "Admin", icon: Users });
    NAV.push({ key: "changelog", label: "Change Log", icon: ScrollText });
  }

  return (
    <>
      <Styles />
      <ErrorProvider userId={user.id} userEmail={user.email} isAdmin={isAdmin}>
        <div className="app">
          <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
            <div className="sidebar-top">
              <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
              <div className="brand-top"><LogoIcon size={20} /><span>THE GUN SHED</span></div>
            </div>
            <nav>{NAV.map(n => (
              <button key={n.key} className={tab === n.key ? "on" : ""} onClick={() => { setTab(n.key); setMobileMenuOpen(false); }}>
                <n.icon size={17} /><span>{n.label}</span>
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
              <h1>{NAV.find(n => n.key === tab)?.label}</h1>
            </div>
            <div className="content">
              {tab === "dashboard" && <Dashboard data={data} go={setTab} />}
              {tab === "firearms" && <Firearms data={data} setData={setData} userId={user.id} />}
              {tab === "attachments" && <Attachments data={data} setData={setData} userId={user.id} />}
              {tab === "ammunition" && <Ammunition data={data} setData={setData} userId={user.id} />}
              {tab === "upkeep" && <UpKeep data={data} setData={setData} />}
              {tab === "rangelog" && <RangeLog data={data} setData={setData} userId={user.id} />}
              {tab === "loadout" && <LoadOut data={data} setData={setData} userId={user.id} />}
              {tab === "supplies" && <SuppliesNeeded data={data} setData={setData} userId={user.id} />}
              {tab === "forsale" && <ForSale data={data} setData={setData} userId={user.id} />}
              {tab === "support" && <Support />}
              {tab === "tickets" && isAdmin && <Tickets userId={user.id} userEmail={user.email} isSuperAdmin={isSuperAdmin} />}
              {tab === "admin" && isAdmin && <Admin currentUser={user} />}
              {tab === "changelog" && isAdmin && <ChangeLog />}
            </div>
          </main>
        </div>
      </ErrorProvider>
      <GeminiChatbot />
    </>
  );
}

/* ── Global Styles ─────────────────────────────────── */
function Styles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo:wght@400;500;600;700&display=swap');
@keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
:root {
  --bg: #0f0e0a; --bg2: #1a1815; --panel: #232118; --panel2: #2d2820;
  --line: #3d372a; --line2: #4a4435; --text: #f0ebe0; --dim: #a8a494; --faint: #7d7969;
  --accent: #d67c3f; --accent-d: #b85f2d; --green: #5e9178; --gold: #c4a94a; --danger: #c1544f;
  --radius: 12px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); font-family: 'Archivo', system-ui, sans-serif; color: var(--text); }
.boot { color: var(--dim); padding: 40px; display: flex; align-items: center; gap: 10px; }
.app { display: flex; min-height: 100vh; }
.brand-logo { display: inline-flex; color: var(--accent); }
.brand { display: flex; align-items: center; gap: 10px; color: var(--accent); font-family: 'Oswald', sans-serif; font-weight: 700; letter-spacing: 2px; font-size: 18px; margin: 12px 0; }
.brand span { color: var(--text); }
.sidebar { width: 260px; flex-shrink: 0; background: var(--bg2); border-right: 1px solid var(--line); padding: 20px 14px; display: flex; flex-direction: column; gap: 22px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.sidebar-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.brand-top { display: flex; align-items: center; gap: 8px; font-family: 'Oswald', sans-serif; font-weight: 700; letter-spacing: 1px; color: var(--accent); font-size: 14px; }
.sidebar nav { display: flex; flex-direction: column; gap: 2px; }
.sidebar nav button { display: flex; align-items: center; gap: 11px; padding: 11px 12px; background: transparent; border: none; border-radius: 8px; cursor: pointer; color: var(--dim); font-family: inherit; font-size: 13px; font-weight: 500; text-align: left; transition: all .15s; width: 100%; }
.sidebar nav button:hover { background: var(--panel); color: var(--text); }
.sidebar nav button.on { background: linear-gradient(90deg, rgba(214,124,63,.2), rgba(214,124,63,.05)); color: var(--text); box-shadow: inset 2px 0 0 var(--accent); }
.side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
.user { display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
.avatar { width: 32px; height: 32px; border-radius: 7px; background: var(--accent); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
.user-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.user .email { font-size: 11px; color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ver-foot { text-align: center; font-size: 10px; color: var(--faint); }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar { padding: 18px 24px; border-bottom: 1px solid var(--line); background: var(--bg2); display: flex; align-items: center; gap: 14px; }
.topbar h1 { font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 22px; letter-spacing: .5px; }
.mobile-menu-btn, .mobile-close { display: none; background: transparent; border: none; color: var(--text); cursor: pointer; }
.content { flex: 1; padding: 24px 32px 60px; overflow-y: auto; }
.tab { position: relative; }
.dashboard-welcome { margin-bottom: 24px; }
.dashboard-welcome h2 { font-family: 'Oswald', sans-serif; font-size: 24px; margin-bottom: 4px; color: var(--accent); }
.dashboard-welcome p { color: var(--dim); font-size: 14px; }
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.firearm-card, .log-card, .addon-card, .ammo-card, .sale-card, .loadout-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; transition: all .15s; }
.firearm-card:hover, .log-card:hover, .addon-card:hover, .ammo-card:hover, .sale-card:hover, .loadout-card:hover { transform: translateY(-2px); border-color: var(--line2); }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.card-head div { display: flex; flex-direction: column; gap: 2px; }
.card-head strong { font-size: 14px; color: var(--text); }
.card-body { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; font-size: 12px; color: var(--text); }
.card-body .dim { color: var(--dim); }
.card-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--line); font-size: 12px; color: var(--dim); }
.empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 70px 20px; color: var(--faint); text-align: center; border: 1px dashed var(--line2); border-radius: var(--radius); }
.empty strong { font-size: 15px; color: var(--text); font-family: 'Oswald', sans-serif; }
.login-wrap { min-height: 100vh; display: grid; place-items: center; position: relative; padding: 20px; overflow: hidden; }
.login-bg { position: absolute; inset: 0; background: radial-gradient(700px 500px at 20% 10%, rgba(214,124,63,.08), transparent 60%), var(--bg); z-index: 0; }
.login-card { position: relative; z-index: 1; background: var(--bg2); border: 1px solid var(--line2); border-radius: 16px; padding: 40px 32px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
.tagline { text-align: center; color: var(--dim); font-size: 13px; margin-bottom: 24px; }
.seg { display: flex; background: var(--panel); border: 1px solid var(--line); border-radius: 9px; padding: 3px; margin-bottom: 18px; }
.seg button { flex: 1; background: transparent; border: none; color: var(--dim); padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; transition: all .15s; }
.seg button.on { background: var(--accent); color: #fff; }
.fld { display: flex; flex-direction: column; gap: 5px; margin-bottom: 13px; }
.fld span { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--faint); }
.fld input, .fld select, .fld textarea { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; color: var(--text); font-family: inherit; font-size: 13px; outline: none; transition: border-color .15s; }
.fld input:focus, .fld select:focus, .fld textarea:focus { border-color: var(--accent); }
.err { display: flex; align-items: center; gap: 6px; background: rgba(193,84,79,.12); border: 1px solid rgba(193,84,79,.35); color: #d98a84; font-size: 12px; padding: 8px 11px; border-radius: 7px; margin-bottom: 12px; }
.note { display: flex; align-items: flex-start; gap: 6px; color: var(--faint); font-size: 11px; margin-top: 16px; }
.admin-section { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; }
.admin-section h3 { font-family: 'Oswald', sans-serif; font-size: 16px; margin-bottom: 16px; }
.grid-table { width: 100%; border-collapse: collapse; background: var(--panel2); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.grid-table th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: .7px; color: var(--faint); padding: 11px 14px; background: var(--bg2); border-bottom: 1px solid var(--line); }
.grid-table td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.grid-table tr:last-child td { border-bottom: none; }
.grid-table tbody tr:hover { background: var(--panel); }
.mono { font-variant-numeric: tabular-nums; color: var(--dim); }
.dim { color: var(--dim); }
.pill { font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px; background: var(--panel2); border: 1px solid var(--line2); color: var(--dim); padding: 3px 8px; border-radius: 20px; }
.role-pill { display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; padding: 3px 8px; border-radius: 5px; font-weight: 700; }
.role-pill.admin { background: rgba(196,169,74,.15); color: var(--gold); border: 1px solid rgba(196,169,74,.35); }
.role-pill.user { background: rgba(94,145,120,.15); color: var(--green); border: 1px solid rgba(94,145,120,.35); }
.role-pill.small { font-size: 9px; padding: 1px 5px; }
.modal-back { position: fixed; inset: 0; background: rgba(10,9,6,.78); display: grid; place-items: center; z-index: 100; padding: 20px; backdrop-filter: blur(2px); }
.modal { background: var(--bg2); border: 1px solid var(--line2); border-radius: 14px; width: 100%; max-width: 560px; max-height: 90vh; overflow: auto; }
.modal.wide { max-width: 760px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--bg2); z-index: 5; }
.modal-head h3 { font-family: 'Oswald', sans-serif; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.modal-body { padding: 20px; }
.form-fld { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.form-fld > span { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--faint); }
.form-fld input, .form-fld select, .form-fld textarea { background: var(--panel); border: 1px solid var(--line); border-radius: 7px; padding: 9px 11px; color: var(--text); font-family: inherit; font-size: 13px; outline: none; transition: border-color .15s; }
.form-fld input:focus, .form-fld select:focus, .form-fld textarea:focus { border-color: var(--accent); }
.form-fld select option { background: var(--panel2); }
.form-fld textarea { resize: vertical; }
button.primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 9px 15px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; transition: background .15s; }
button.primary:hover { background: var(--accent-d); }
button.primary:disabled { opacity: .45; cursor: not-allowed; }
button.primary.big { width: 100%; justify-content: center; padding: 12px; font-size: 14px; margin-top: 4px; }
button.primary.small { padding: 6px 10px; font-size: 12px; }
button.primary.danger { background: var(--danger); }
button.primary.danger:hover { background: #a83d3a; }
button.ghost { display: inline-flex; align-items: center; gap: 6px; background: var(--panel); border: 1px solid var(--line); color: var(--dim); border-radius: 8px; padding: 9px 13px; cursor: pointer; font-family: inherit; font-size: 12px; transition: all .15s; }
button.ghost:hover { color: var(--text); border-color: var(--line2); }
button.ghost.small { padding: 5px 8px; font-size: 11px; }
.icon-btn { background: var(--panel2); border: 1px solid var(--line); color: var(--dim); width: 30px; height: 30px; border-radius: 7px; cursor: pointer; display: grid; place-items: center; transition: all .15s; }
.icon-btn:hover { color: var(--text); border-color: var(--line2); }
.stat { display: flex; align-items: center; gap: 13px; background: var(--panel); border: 1px solid var(--line); border-left-width: 3px; border-radius: var(--radius); padding: 15px 16px; transition: all .15s; cursor: pointer; }
.stat:hover { transform: translateY(-2px); border-color: var(--line2); }
.stat-ico { color: var(--dim); }
.stat-val { font-family: 'Oswald', sans-serif; font-size: 23px; font-weight: 600; }
.stat-lbl { font-size: 11px; color: var(--dim); margin-top: 4px; text-transform: uppercase; letter-spacing: .6px; }
.search-big { display: flex; align-items: center; gap: 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 0 14px; flex: 1; color: var(--faint); }
.search-big input { background: transparent; border: none; outline: none; color: var(--text); font-family: inherit; font-size: 14px; padding: 12px 0; width: 100%; }
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.sort { display: flex; align-items: center; gap: 8px; }
.sort select { background: var(--panel); border: 1px solid var(--line); color: var(--text); padding: 7px 10px; border-radius: 7px; font-size: 12px; }
.sort .dir { background: var(--panel2); border: 1px solid var(--line); color: var(--dim); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: grid; place-items: center; font-weight: 700; font-size: 11px; }
.spacer { flex: 1; }
.persistent-menu-wrap { position: relative; }
.persistent-menu { position: absolute; right: 0; top: 36px; background: var(--panel2); border: 1px solid var(--line2); border-radius: 8px; padding: 4px; z-index: 30; min-width: 180px; box-shadow: 0 12px 30px rgba(0,0,0,.4); }
.persistent-menu button { display: flex; align-items: center; gap: 7px; width: 100%; background: transparent; border: none; color: var(--text); padding: 8px 10px; font-family: inherit; font-size: 12.5px; cursor: pointer; border-radius: 5px; text-align: left; }
.persistent-menu button:hover { background: var(--panel); }
.persistent-menu button.danger { color: var(--danger); }
.changelog { display: flex; flex-direction: column; }
.release { display: grid; grid-template-columns: 34px 1fr; }
.release-rail { display: flex; justify-content: center; position: relative; }
.release-rail::before { content: ""; position: absolute; top: 0; bottom: 0; width: 2px; background: var(--line); }
.release:first-child .release-rail::before { top: 10px; }
.release:last-child .release-rail::before { bottom: auto; height: 10px; }
.release-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--panel2); border: 2px solid var(--line2); margin-top: 4px; z-index: 1; }
.release-dot.cur { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 4px rgba(214,124,63,.15); }
.release-body { padding: 0 0 28px 16px; }
.release-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.release-head .ver { font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 13px; color: var(--accent); background: rgba(214,124,63,.1); border: 1px solid rgba(214,124,63,.3); padding: 2px 9px; border-radius: 6px; }
.release-head h3 { font-family: 'Oswald', sans-serif; font-size: 18px; font-weight: 600; }
.cur-badge { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; background: var(--green); color: #fff; padding: 3px 8px; border-radius: 20px; }
.rel-date { margin-left: auto; font-size: 12px; color: var(--faint); font-variant-numeric: tabular-nums; }
.change-list { list-style: none; display: flex; flex-direction: column; gap: 8px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; }
.change-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 1.5; }
.ct { font-size: 9.5px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; padding: 3px 7px; border-radius: 5px; flex-shrink: 0; margin-top: 1px; min-width: 54px; text-align: center; }
.ct-added { background: rgba(94,145,120,.15); color: var(--green); border: 1px solid rgba(94,145,120,.35); }
.ct-changed { background: rgba(196,169,74,.15); color: var(--gold); border: 1px solid rgba(196,169,74,.35); }
.ct-fixed { background: rgba(214,124,63,.15); color: var(--accent); border: 1px solid rgba(214,124,63,.35); }
.ct-removed { background: rgba(193,84,79,.15); color: var(--danger); border: 1px solid rgba(193,84,79,.35); }
.chatbot-fab { position: fixed; bottom: 24px; right: 24px; width: 50px; height: 50px; border-radius: 50%; background: var(--accent); color: #fff; border: none; cursor: pointer; display: grid; place-items: center; box-shadow: 0 8px 24px rgba(0,0,0,.4); transition: all .2s; z-index: 50; }
.chatbot-fab:hover { transform: scale(1.1); background: var(--accent-d); }
.chatbot-modal { position: fixed; bottom: 90px; right: 24px; width: 380px; height: 500px; background: var(--bg2); border: 1px solid var(--line2); border-radius: 14px; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.4); z-index: 50; }
.chatbot-head { padding: 14px 16px; border-bottom: 1px solid var(--line); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.chatbot-messages { flex: 1; padding: 14px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.message { padding: 10px 12px; border-radius: 8px; max-width: 80%; word-wrap: break-word; }
.message.user { background: var(--accent); color: #fff; margin-left: auto; }
.message.assistant { background: var(--panel); color: var(--text); margin-right: auto; }
.chatbot-input { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line); }
.chatbot-input input { flex: 1; background: var(--panel); border: 1px solid var(--line); color: var(--text); padding: 8px 10px; border-radius: 6px; font-family: inherit; font-size: 12px; outline: none; }
@media (max-width: 768px) {
  .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 100; width: 280px; transform: translateX(-100%); transition: transform .3s; }
  .sidebar.open { transform: translateX(0); }
  .mobile-menu-btn, .mobile-close { display: block; }
  .content { padding: 16px 16px 60px; }
  .topbar { padding: 14px; }
  .topbar h1 { font-size: 18px; }
  .card-grid { grid-template-columns: 1fr; }
  .chatbot-modal { width: 90vw; max-width: 380px; }
}
`}</style>
  );
}
