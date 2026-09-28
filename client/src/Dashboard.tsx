import { useApi, type Dashboard } from "./api";
import { euro, PageHead } from "./ui";

const SLICE = ["#006478", "#408b9a", "#ff9600", "#253239", "#80b1bb", "#ffb040"];

function vsLast(n: number, money = false) {
  if (n === 0) return "wie im Vormonat";
  const abs = money ? euro(Math.abs(n)) : String(Math.abs(n));
  return n > 0 ? `${abs} mehr als im Vormonat` : `${abs} weniger als im Vormonat`;
}

function Bars({
  rows,
  tone = "petrol",
}: {
  rows: { label: string; value: number; stack?: number; caption?: string }[];
  tone?: "petrol" | "split";
}) {
  const max = Math.max(1, ...rows.map((r) => r.value + (r.stack ?? 0)));
  const label = rows
    .map((r) => (tone === "split" ? `${r.label}: Kalender ${r.value}, Buchungsseite ${r.stack ?? 0}` : `${r.label} ${r.caption ?? r.value}`))
    .join(", ");
  return (
    <div className="bars" role="img" aria-label={label}>
      {rows.map((r) => {
        const total = r.value + (r.stack ?? 0);
        const h = (total / max) * 100;
        return (
          <div className="bar" key={r.label}>
            <div className="bar-track">
              {tone === "split" && total > 0 ? (
                <div className="bar-stack" style={{ height: `${h}%` }}>
                  <i className="is-page" style={{ flexGrow: r.stack ?? 0 }} />
                  <i className="is-cal" style={{ flexGrow: r.value }} />
                </div>
              ) : (
                <i className={r.value > 0 ? "is-cal" : "is-empty"} style={{ height: r.value > 0 ? `${h}%` : undefined }} />
              )}
            </div>
            <span>{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ parts }: { parts: { name: string; count: number }[] }) {
  const total = parts.reduce((n, p) => n + p.count, 0);
  if (!total) return <p className="hint-line">Noch keine Buchung.</p>;
  let acc = 0;
  const stops = parts.map((p, i) => {
    const start = acc;
    acc += (p.count / total) * 100;
    return `${SLICE[i % SLICE.length]} ${start}% ${acc}%`;
  });
  return (
    <div className="donut-row">
      <div
        className="donut"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={parts.map((p) => `${p.name} ${p.count}`).join(", ")}
      >
        <span>{total}</span>
      </div>
      <ul className="legend">
        {parts.map((p, i) => (
          <li key={p.name}>
            <i style={{ background: SLICE[i % SLICE.length] }} />
            <span>{p.name}</span>
            <strong>{p.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardPage() {
  const data = useApi<Dashboard>("/api/app/dashboard");
  if (!data) return <div className="page"><p className="lead wait">Laden…</p></div>;
  const yearRevenue = data.months.reduce((n, m) => n + m.revenueCents, 0);
  return (
    <div className="page wide">
      <PageHead title="Dashboard" lead={`${data.monthLabel}. Stornierte Termine zählen nicht.`} />
      <div className="stat-row four">
        <div className="stat">
          <strong>{euro(data.revenueCents)}</strong>
          <span>Umsatz im {data.monthLabel.split(" ")[0]}</span>
          <p className="stat-note">{vsLast(data.revenueDeltaCents, true)}</p>
        </div>
        <div className="stat">
          <strong>{data.appointments}</strong>
          <span>Termine im {data.monthLabel.split(" ")[0]}</span>
          <p className="stat-note">{vsLast(data.appointmentsDelta)}</p>
        </div>
        <div className="stat">
          <strong>{data.bookings}</strong>
          <span>Buchungen insgesamt</span>
          <p className="stat-note">{data.bookingsDelta} in diesem Monat</p>
        </div>
        <div className="stat">
          <strong>{data.customers}</strong>
          <span>Kunden insgesamt</span>
          <p className="stat-note">{data.customersDelta} neu in diesem Monat</p>
        </div>
      </div>
      <div className="dash-grid">
        <section className="dash-card">
          <h2>Umsatz nach Monat</h2>
          <p className="sub">{data.year} · {euro(yearRevenue)} aus Leistungen mit Preis</p>
          <Bars rows={data.months.map((m) => ({ label: m.label, value: m.revenueCents, caption: euro(m.revenueCents) }))} />
        </section>
        <section className="dash-card">
          <h2>Beliebteste Leistungen</h2>
          <p className="sub">Gesamt</p>
          <Donut parts={data.services} />
        </section>
        <section className="dash-card">
          <h2>Buchungen nach Herkunft</h2>
          <p className="sub">{data.year}</p>
          <ul className="legend flat">
            <li><i style={{ background: "#006478" }} /><span>Kalender</span></li>
            <li><i style={{ background: "#ff9600" }} /><span>Buchungsseite</span></li>
          </ul>
          <Bars
            tone="split"
            rows={data.origins.map((m) => ({ label: m.label, value: m.calendar, stack: m.page }))}
          />
        </section>
        <section className="dash-card">
          <h2>Buchungen nach Wochentag</h2>
          <p className="sub">Gesamt</p>
          <Bars rows={data.weekdays.map((d) => ({ label: d.label, value: d.count }))} />
        </section>
      </div>
    </div>
  );
}
