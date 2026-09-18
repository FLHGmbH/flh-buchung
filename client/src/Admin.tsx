import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, useApi, type TenantRow } from "./api";
import { Avatar, PageHead } from "./ui";

type TenantDetail = {
  tenant: TenantRow;
  admins: { id: string; email: string; name: string }[];
  bookUrl: string;
  iframe: string;
};

export function AdminList() {
  const rows = useApi<{ tenants: TenantRow[] }>("/api/admin/tenants");
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const tenants = rows?.tenants ?? [];
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tenants;
    return tenants.filter((t) => `${t.name} ${t.slug}`.toLowerCase().includes(s));
  }, [tenants, q]);
  if (!rows) return <div className="page"><p className="lead wait">Laden…</p></div>;
  const active = tenants.filter((t) => t.active).length;
  return (
    <div className="page">
      <header className="page-head">
        <div className="head-tools">
          <h1>Mandanten</h1>
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name oder Slug suchen" />
          </label>
        </div>
        <Link className="btn" to="/admin/neu">+ Neuer Mandant</Link>
      </header>
      {tenants.length ? (
        <div className="stat-row">
          <div className="stat">
            <strong>{tenants.length}</strong>
            <span>Betriebe</span>
          </div>
          <div className="stat">
            <strong>{active}</strong>
            <span>Aktiv</span>
          </div>
          <div className="stat">
            <strong>{tenants.length - active}</strong>
            <span>Gesperrt</span>
          </div>
        </div>
      ) : null}
      {tenants.length === 0 ? (
        <div className="empty">
          <p>Noch kein Mandant. Leg den ersten an, dann kommt das Buchungs-iframe auf die Homepage.</p>
          <Link className="btn" to="/admin/neu">+ Neuer Mandant</Link>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">
          <p>Kein Treffer für „{q.trim()}“.</p>
        </div>
      ) : (
        <div className="card-table">
          <table className="table quiet click">
            <thead>
              <tr>
                <th>Betrieb</th>
                <th>Buchung</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id} onClick={() => nav(`/admin/${t.id}`)}>
                  <td>
                    <div className="who-cell">
                      <Avatar name={t.name} size={32} />
                      <div>
                        <strong>{t.name}</strong>
                        <small>/{t.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mono-url">{t.bookUrl?.replace(/^https?:\/\//, "")}</span>
                  </td>
                  <td>
                    <span className={"status" + (t.active ? " is-ok" : " is-off")}>
                      <i />
                      {t.active ? "Aktiv" : "Gesperrt"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminNew() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", slug: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setPending(true);
    api
      .createTenant(form)
      .then((r) => nav(`/admin/${(r as { tenant: { id: string } }).tenant.id}`))
      .catch((ex) => {
        setErr(ex.message);
        setPending(false);
      });
  }
  return (
    <div className="page slim">
      <PageHead
        title="Neuer Mandant"
        lead="Betrieb anlegen und KD-Login in Supabase Auth setzen."
        aside={
          <Link className="btn outline" to="/admin">
            Zurück
          </Link>
        }
      />
      {err ? <p className="err" role="alert">{err}</p> : null}
      <form className="hours-card" onSubmit={submit} autoComplete="off">
        <div className="card-head">Betrieb</div>
        <div className="card-body">
          <div className="fields-2">
            <label className="field">
              <span>Betriebsname</span>
              <input name="tenant-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="organization" />
            </label>
            <label className="field">
              <span>Slug (URL)</span>
              <input name="tenant-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} autoComplete="off" spellCheck={false} inputMode="url" />
            </label>
          </div>
          <p className="hint-line">Slug leer lassen, dann wird er aus dem Namen gebaut — z. B. salon-mueller.</p>
        </div>
        <div className="card-head">KD-Login</div>
        <div className="card-body">
          <label className="field">
            <span>Name</span>
            <input name="admin-name" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} autoComplete="name" />
          </label>
          <p className="hint-line">Leer lassen, dann gilt der Betriebsname.</p>
          <div className="fields-2">
            <label className="field">
              <span>E-Mail</span>
              <input type="email" name="admin-email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required autoComplete="off" />
            </label>
            <label className="field">
              <span>Passwort</span>
              <input type="password" name="admin-password" autoComplete="new-password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} minLength={8} required />
            </label>
          </div>
          <p className="hint-line">Mindestens 8 Zeichen. Der KD loggt sich damit ins Mandanten-Panel ein.</p>
        </div>
        <div className="hours-foot">
          <button className="btn" type="submit" disabled={pending}>{pending ? "Anlegen…" : "Mandant anlegen"}</button>
        </div>
      </form>
    </div>
  );
}

export function AdminDetail() {
  const { id } = useParams();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [copied, setCopied] = useState<"iframe" | "url" | null>(null);
  const [frameOn, setFrameOn] = useState(false);
  const [pw, setPw] = useState({ userId: "", password: "", err: "", ok: false, pending: false });
  useEffect(() => {
    if (!id) return;
    let on = true;
    setData(null);
    setLoadErr("");
    setFrameOn(false);
    api.tenant(id).then(
      (d) => { if (on) setData(d); },
      (e) => { if (on) setLoadErr(e instanceof Error ? e.message : "Mandant nicht geladen."); },
    );
    return () => { on = false; };
  }, [id]);
  if (loadErr) {
    return (
      <div className="page">
        <PageHead
          title="Mandant"
          aside={<Link className="btn outline" to="/admin">Alle Mandanten</Link>}
        />
        <p className="err" role="alert">{loadErr}</p>
      </div>
    );
  }
  if (!data?.tenant) return <div className="page"><p className="lead wait">Laden…</p></div>;
  const admins = data.admins ?? [];
  const adminId = pw.userId || admins[0]?.id || "";
  const kd = admins[0];
  function mark(kind: "iframe" | "url", text: string) {
    navigator.clipboard.writeText(text).then(() => setCopied(kind));
  }
  return (
    <div className="page">
      <PageHead
        title={data.tenant.name}
        lead={`/${data.tenant.slug}`}
        aside={
          <div className="head-tools">
            <Link className="btn outline" to="/admin">
              Alle Mandanten
            </Link>
            <button
              className={data.tenant.active ? "btn outline" : "btn"}
              type="button"
              onClick={() => {
                const active = !data.tenant.active;
                api.patchTenant(data.tenant.id, { active }).then(() => {
                  setData((d) => (d ? { ...d, tenant: { ...d.tenant, active } } : d));
                });
              }}
            >
              {data.tenant.active ? "Sperren" : "Aktivieren"}
            </button>
          </div>
        }
      />
      <div className="admin-grid">
        <article className="hours-card">
          <div className="card-head">Betrieb</div>
          <div className="card-body">
            <div className="who-cell pad">
              <Avatar name={data.tenant.name} size={40} />
              <div>
                <strong>{data.tenant.name}</strong>
                <small>/{data.tenant.slug}</small>
              </div>
            </div>
            <span className={"status" + (data.tenant.active ? " is-ok" : " is-off")}>
              <i />
              {data.tenant.active ? "Aktiv" : "Gesperrt"}
            </span>
            <div className="field follow">
              <span>Buchungs-URL</span>
              <div className="copy-row">
                <input readOnly aria-label="Buchungs-URL" value={data.bookUrl} />
                <button className="btn outline" type="button" onClick={() => mark("url", data.bookUrl)}>
                  {copied === "url" ? "Kopiert" : "Kopieren"}
                </button>
              </div>
            </div>
          </div>
        </article>
        <article className="hours-card">
          <div className="card-head">KD-Login</div>
          <div className="card-body">
            {kd ? (
              <div className="who-cell pad">
                <Avatar name={kd.name || kd.email} size={40} />
                <div>
                  <strong>{kd.name || "KD"}</strong>
                  <small>{kd.email}</small>
                </div>
              </div>
            ) : (
              <p className="hint-line">Kein KD hinterlegt.</p>
            )}
            {admins.length ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPw((s) => ({ ...s, err: "", ok: false, pending: true }));
                  api
                    .setTenantPassword(data.tenant.id, adminId, pw.password)
                    .then(() => setPw({ userId: adminId, password: "", err: "", ok: true, pending: false }))
                    .catch((ex) => setPw((s) => ({ ...s, err: ex.message, ok: false, pending: false })));
                }}
              >
                {pw.err ? <p className="err" role="alert">{pw.err}</p> : null}
                {pw.ok ? <p className="ok" role="status">Passwort in Auth gespeichert. KD kann sich anmelden.</p> : null}
                {admins.length > 1 ? (
                  <label className="field">
                    <span>Admin</span>
                    <select value={adminId} onChange={(e) => setPw((s) => ({ ...s, userId: e.target.value }))}>
                      {admins.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="field">
                  <span>Neues Passwort</span>
                  <input type="password" autoComplete="new-password" minLength={8} required value={pw.password} onChange={(e) => setPw((s) => ({ ...s, password: e.target.value, ok: false }))} />
                </label>
                <button className="btn" type="submit" disabled={pw.pending}>{pw.pending ? "Speichern…" : "In Auth speichern"}</button>
              </form>
            ) : null}
          </div>
        </article>
      </div>
      <article className="hours-card">
        <div className="card-head">iframe für die Homepage</div>
        <div className="card-body">
          <p className="hint-line">Snippet in die Kunden-Website einsetzen.</p>
          <pre className="code">{data.iframe}</pre>
          <div className="head-tools card-actions">
            <button className="btn" type="button" onClick={() => mark("iframe", data.iframe)}>
              {copied === "iframe" ? "Kopiert" : "Snippet kopieren"}
            </button>
            <a className="btn outline" href={data.bookUrl} target="_blank" rel="noreferrer">
              Buchungsseite öffnen
            </a>
          </div>
          <div className="embed-preview">
            {!frameOn ? (
              <div className="preview-empty" aria-busy="true">
                <p>Vorschau wird geladen…</p>
                <a className="btn outline" href={data.bookUrl} target="_blank" rel="noreferrer">Buchungsseite öffnen</a>
              </div>
            ) : null}
            <iframe
              title="Buchungsvorschau"
              src={`/b/${encodeURIComponent(data.tenant.slug)}`}
              className={"preview-frame" + (frameOn ? "" : " is-wait")}
              loading="lazy"
              onLoad={() => setFrameOn(true)}
            />
          </div>
        </div>
      </article>
    </div>
  );
}
