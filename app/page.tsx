"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabase";

const sb = supabaseBrowser();

type Activation = {
  device_hash: string;
  activated_at: string;
  last_seen: string;
  revoked_at: string | null;
};
type Lic = {
  id: string;
  note: string | null;
  created_at: string;
  starts_at: string | null;
  expires_at: string | null;
  duration_days: number | null;
  max_devices: number | null;
  active_devices: number;
  revoked_at: string | null;
  activations: Activation[];
};

function dateText(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "Belum dimulai";
}
function statusText(x: Lic) {
  if (x.revoked_at) return "Dicabut";
  if (x.expires_at && new Date(x.expires_at) <= new Date()) return "Kedaluwarsa";
  if (!x.starts_at) return "Belum diaktivasi";
  return "Aktif";
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Lic[]>([]);
  const [duration, setDuration] = useState("365");
  const [devices, setDevices] = useState("1");
  const [note, setNote] = useState("");
  const [created, setCreated] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const { data: { session: current } } = await sb.auth.getSession();
    setSession(current);
    if (!current) { setRows([]); return; }
    const { data, error } = await sb.functions.invoke("photo-printer-license", {
      body: { action: "admin_list" },
    });
    if (error) setMsg(error.message);
    else if (data?.success) setRows(data.licenses || []);
    else setMsg(data?.message || "Backend admin belum tersedia.");
  }

  useEffect(() => {
    load();
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) {
        setTimeout(() => load(), 0);
      } else {
        setRows([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else { setPassword(""); await load(); }
  }

  async function create() {
    setBusy(true); setMsg(""); setCreated("");
    const { data, error } = await sb.functions.invoke("photo-printer-license", {
      body: {
        action: "admin_create",
        duration_days: duration === "unlimited" ? null : Number(duration),
        max_devices: devices === "unlimited" ? null : Number(devices),
        note,
      },
    });
    setBusy(false);
    if (error || !data?.success || !data?.license_key) {
      setMsg(data?.message || error?.message || "Pembuatan lisensi gagal. Periksa fungsi backend dan secret ADMIN_EMAIL.");
      return;
    }
    // Kode yang ditampilkan harus berasal dari server; jangan membuat kode lokal
    // karena backend hanya menyimpan hash dan menghasilkan kode lisensi sendiri.
    setCreated(data.license_key);
    setNote("");
    await load();
  }

  async function revoke(id: string) {
    if (!confirm("Cabut lisensi ini? Perangkat yang menggunakannya tidak dapat melanjutkan aktivasi.")) return;
    setBusy(true); setMsg("");
    const { data, error } = await sb.functions.invoke("photo-printer-license", {
      body: { action: "admin_revoke", license_id: id },
    });
    setBusy(false);
    if (error || !data?.success) setMsg(data?.message || error?.message || "Gagal mencabut lisensi.");
    else { setMsg("Lisensi berhasil dicabut."); await load(); }
  }

  if (!session) return (
    <main>
      <section className="panel login">
        <h1>PhotoPrinter Pro</h1>
        <p className="muted">Panel Administrator Lisensi</p>
        <div className="notice">Masuk menggunakan akun administrator Supabase yang emailnya sudah didaftarkan pada secret <b>ADMIN_EMAIL</b> di Edge Function.</div>
        <form onSubmit={login}>
          <label>Email administrator</label>
          <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
          <p><button disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button></p>
        </form>
        {msg && <div className="notice error">{msg}</div>}
      </section>
    </main>
  );

  return (
    <main>
      <header className="row header">
        <div><h1>PhotoPrinter Pro</h1><p className="muted">Panel Administrator Lisensi</p></div>
        <div className="row"><span className="muted">{session.user?.email}</span><button className="secondary" onClick={() => sb.auth.signOut()}>Keluar</button></div>
      </header>

      {msg && <div className="notice">{msg}</div>}

      <section className="panel">
        <h2>Buat lisensi baru</h2>
        <div className="grid">
          <div><label>Masa berlaku sejak aktivasi pertama</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}>
              <option value="30">30 hari</option><option value="90">90 hari</option>
              <option value="180">180 hari</option><option value="365">1 tahun</option>
              <option value="730">2 tahun</option><option value="1095">3 tahun</option>
              <option value="1825">5 tahun</option><option value="unlimited">Tidak terbatas</option>
            </select>
          </div>
          <div><label>Batas komputer/perangkat</label>
            <select value={devices} onChange={e => setDevices(e.target.value)}>
              <option value="1">1 perangkat</option><option value="2">2 perangkat</option>
              <option value="3">3 perangkat</option><option value="5">5 perangkat</option>
              <option value="10">10 perangkat</option><option value="unlimited">Tidak terbatas</option>
            </select>
          </div>
          <div><label>Catatan pelanggan / pesanan</label>
            <input value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="Nama pelanggan / nomor pesanan" />
          </div>
        </div>
        <p><button onClick={create} disabled={busy}>{busy ? "Memproses…" : "Buat kode lisensi"}</button></p>
        {created && <div className="notice success">
          <b>Lisensi berhasil dibuat. Simpan kode ini sekarang.</b>
          <p className="license-key"><code>{created}</code></p>
          <button className="secondary" onClick={() => navigator.clipboard.writeText(created)}>Salin kode lisensi</button>
          <p className="small">Kode hanya ditampilkan pada saat pembuatan. Backend menyimpan hash kode, bukan kode aslinya.</p>
        </div>}
      </section>

      <section className="panel">
        <div className="row between"><div><h2>Daftar lisensi</h2><p className="muted">{rows.length} lisensi tercatat</p></div><button className="secondary" onClick={load} disabled={busy}>Muat ulang</button></div>
        <div className="table-wrap"><table><thead><tr>
          <th>Catatan / ID</th><th>Dibuat</th><th>Masa berlaku</th><th>Perangkat</th><th>Status</th><th>Aksi</th>
        </tr></thead><tbody>
          {rows.map(x => <tr key={x.id}>
            <td>{x.note || "—"}<br/><code>{x.id.slice(0, 8)}…</code></td>
            <td>{dateText(x.created_at)}</td>
            <td>{x.duration_days === null ? "Tidak terbatas" : `${x.duration_days} hari`}<br/><span className="muted">Mulai: {dateText(x.starts_at)}<br/>Akhir: {x.expires_at ? dateText(x.expires_at) : "Tidak terbatas / belum dimulai"}</span></td>
            <td>{x.active_devices ?? 0} / {x.max_devices ?? "∞"}</td>
            <td><span className={`status ${statusText(x).toLowerCase().replaceAll(" ", "-")}`}>{statusText(x)}</span><br/><button className="link-button" onClick={() => setExpanded(expanded === x.id ? null : x.id)}>{expanded === x.id ? "Tutup perangkat" : "Detail perangkat"}</button></td>
            <td><button className="danger" disabled={busy || !!x.revoked_at} onClick={() => revoke(x.id)}>Cabut</button></td>
          </tr>)}
          {!rows.length && <tr><td colSpan={6}>Belum ada lisensi.</td></tr>}
        </tbody></table></div>
        {rows.filter(x => expanded === x.id).map(x => <div className="device-detail" key={`detail-${x.id}`}>
          <h3>Perangkat terdaftar — {x.note || x.id.slice(0, 8)}</h3>
          {!x.activations?.length ? <p className="muted">Belum ada perangkat yang mengaktifkan lisensi ini.</p> :
            <div className="table-wrap"><table><thead><tr><th>Device hash</th><th>Aktivasi</th><th>Terakhir aktif</th><th>Status</th></tr></thead><tbody>
              {x.activations.map((a, i) => <tr key={`${a.device_hash}-${i}`}><td><code>{a.device_hash}</code></td><td>{dateText(a.activated_at)}</td><td>{dateText(a.last_seen)}</td><td>{a.revoked_at ? "Dicabut" : "Aktif"}</td></tr>)}
            </tbody></table></div>}
        </div>)}
      </section>
      <p className="muted footer">PhotoPrinter Pro License Admin · Jangan membagikan akses administrator atau secret backend.</p>
    </main>
  );
}
