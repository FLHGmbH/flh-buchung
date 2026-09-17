import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, useApi, type TenantRow } from "./api";

export function AdminList() {
  const rows = useApi<{ tenants: TenantRow[] }>("/api/admin/tenants");
  if (!rows) return <div className="page" />;
  return (
    <div className="page">
      <div className="toolbar">
        <h1>Mandanten</h1>
        <Link className="btn" to="/admin/neu">Neuer Mandant</Link>
      </div>
      {rows.tenants.length === 0 ? (
        <div className="empty">Noch kein Mandant. Leg den ersten an, dann kopierst du das iframe in die Homepage.</div>
      ) : (
        <table className="table">
          <thead><tr><th>Name</th><th>Slug</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.tenants.map((t) => (
              <tr key={t.id}>
                <td><Link to={`/admin/${t.id}`}>{t.name}</Link></td>
                <td>{t.slug}</td>
                <td>{t.active ? "Aktiv" : "Gesperrt"}</td>
                <td><Link to={`/admin/${t.id}`}>iframe</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function AdminNew() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", slug: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [err, setErr] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    api.createTenant(form).then((r) => nav(`/admin/${(r as { tenant: { id: string } }).tenant.id}`)).catch((ex) => setErr(ex.message));
  }
  return (
    <div className="page">
      <h1>Neuer Mandant</h1>
      <p className="lead">Account für den Betrieb plus Standard-Öffnungszeiten Mo–Sa.</p>
      {err ? <p className="err">{err}</p> : null}
      <form className="panel" style={{ maxWidth: 480 }} onSubmit={submit}>
        <label className="field"><span>Betriebsname</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label className="field"><span>Slug (URL)</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="salon-mueller" /></label>
        <label className="field"><span>Admin-Name</span><input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} /></label>
        <label className="field"><span>Admin-E-Mail</span><input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required /></label>
        <label className="field"><span>Passwort</span><input type="password" autoComplete="new-password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} minLength={8} required /></label>
        <button className="btn" type="submit">Anlegen</button>
      </form>
    </div>
  );
}

export function AdminDetail() {
  const { id } = useParams();
  const data = useApi<{ tenant: TenantRow; admins: { id: string; email: string; name: string }[]; bookUrl: string; iframe: string }>(id ? `/api/admin/tenants/${id}` : null);
  const [copied, setCopied] = useState(false);
  const [pw, setPw] = useState({ userId: "", password: "", err: "", ok: false });
  if (!data) return <div className="page" />;
  const adminId = pw.userId || data.admins[0]?.id || "";
  return (
    <div className="page">
      <h1>{data.tenant.name}</h1>
      <p className="lead">/{data.tenant.slug} · {data.tenant.active ? "aktiv" : "gesperrt"}</p>
      <p>Admin: {data.admins.map((a) => `${a.name} (${a.email})`).join(", ") || "—"}</p>
      <p>
        <button className="btn quiet" type="button" onClick={() => api.patchTenant(data.tenant.id, { active: !data.tenant.active })}>
          {data.tenant.active ? "Sperren" : "Aktivieren"}
        </button>
      </p>
      {data.admins.length ? (
        <form
          className="panel"
          style={{ maxWidth: 480, marginBottom: 24 }}
          onSubmit={(e) => {
            e.preventDefault();
            setPw((s) => ({ ...s, err: "", ok: false }));
            api.setTenantPassword(data.tenant.id, adminId, pw.password)
              .then(() => setPw({ userId: adminId, password: "", err: "", ok: true }))
              .catch((ex) => setPw((s) => ({ ...s, err: ex.message, ok: false })));
          }}
        >
          <h1 style={{ fontSize: "1.15rem" }}>KD-Passwort setzen</h1>
          {pw.err ? <p className="err">{pw.err}</p> : null}
          {pw.ok ? <p>Gesetzt. Der Mandant muss sich neu anmelden.</p> : null}
          {data.admins.length > 1 ? (
            <label className="field">
              <span>Admin</span>
              <select value={adminId} onChange={(e) => setPw((s) => ({ ...s, userId: e.target.value }))}>
                {data.admins.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span>Neues Passwort</span>
            <input type="password" autoComplete="new-password" minLength={8} required value={pw.password} onChange={(e) => setPw((s) => ({ ...s, password: e.target.value, ok: false }))} />
          </label>
          <button className="btn" type="submit">Setzen</button>
        </form>
      ) : null}
      <div className="panel" style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: "1.15rem" }}>iframe für die Homepage</h1>
        <p>In die Kunden-HP einsetzen:</p>
        <pre className="code">{data.iframe}</pre>
        <button
          className="btn amber"
          type="button"
          onClick={() => navigator.clipboard.writeText(data.iframe).then(() => setCopied(true))}
        >
          {copied ? "Kopiert" : "Snippet kopieren"}
        </button>
        <p style={{ marginTop: 16 }}>Vorschau:</p>
        <iframe title="Vorschau" src={data.bookUrl} style={{ width: "100%", minHeight: 560, border: 0 }} />
      </div>
    </div>
  );
}
