const fs = require("fs");
const path = require("path");
const net = require("net");
const express = require("express");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const MUSIC_DIR = process.env.MUSIC_DIR || "/music";
const LIQ_HOST = process.env.LIQ_HOST || "liquidsoap";
const LIQ_PORT = parseInt(process.env.LIQ_PORT || "1234", 10);

// Talk to Liquidsoap telnet
function liqCommand(cmd, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = "";

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("Liquidsoap telnet timeout"));
    }, timeoutMs);

    socket
      .connect(LIQ_PORT, LIQ_HOST, () => {
        socket.write(cmd.trim() + "\n");
      })
      .on("data", (chunk) => (data += chunk.toString()))
      .on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      })
      .on("close", () => {
        clearTimeout(timer);
        resolve(data.trim());
      });
  });
}

// List files in /music
app.get("/files", (_req, res) => {
  fs.readdir(MUSIC_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const allowed = new Set([".mp3", ".ogg", ".m4a", ".flac", ".wav"]);
    const list = files
      .filter((f) => allowed.has(path.extname(f).toLowerCase()))
      .sort();
    res.json({ files: list });
  });
});

// Enqueue a file by name (must exist in MUSIC_DIR)
app.post("/enqueue", async (req, res) => {
  try {
    const name = (req.body && req.body.name) || "";
    const full = path.join(MUSIC_DIR, name);
    if (!name) return res.status(400).json({ error: "Missing 'name'" });
    if (!fs.existsSync(full)) return res.status(404).json({ error: "File not found" });

    // Liquidsoap accepts local path or file:// URL
    const cmd = `request.push ${full}`;
    const out = await liqCommand(cmd);
    res.json({ ok: true, out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Skip current track
app.post("/skip", async (_req, res) => {
  try {
    const out = await liqCommand("skip");
    res.json({ ok: true, out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Show simple UI
app.get("/", (_req, res) => {
  res.type("html").send(`
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Radio Queue</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 760px; margin: 30px auto; }
  .row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #eee; }
  button { padding: 6px 10px; cursor: pointer; }
  input[type="text"] { width: 100%; padding: 6px; }
  .top { display:flex; justify-content: space-between; align-items:center; margin-bottom: 14px; }
</style>
</head>
<body>
  <div class="top">
    <h2>Radio Queue</h2>
    <div>
      <button onclick="skip()">⏭ Skip</button>
      <a href="#" onclick="refresh();return false;">🔄 Refresh</a>
    </div>
  </div>
  <div id="status"></div>
  <div id="list">Loading…</div>

<script>
async function refresh() {
  setStatus("Loading file list…");
  const r = await fetch("/files");
  const j = await r.json();
  const wrap = document.getElementById("list");
  if (j.error) { wrap.textContent = j.error; return; }
  wrap.innerHTML = "";
  j.files.forEach(name => {
    const row = document.createElement("div");
    row.className = "row";
    const btn = document.createElement("button");
    btn.textContent = "➕ Queue";
    btn.onclick = () => enqueue(name);
    const span = document.createElement("span");
    span.textContent = name;
    row.appendChild(btn);
    row.appendChild(span);
    wrap.appendChild(row);
  });
  clearStatus();
}

async function enqueue(name) {
  setStatus("Queuing " + name + " …");
  const r = await fetch("/enqueue", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name })
  });
  const j = await r.json();
  if (!r.ok) alert(j.error || "Error");
  clearStatus();
}

async function skip() {
  setStatus("Skipping…");
  const r = await fetch("/skip", { method: "POST" });
  const j = await r.json();
  if (!r.ok) alert(j.error || "Error");
  clearStatus();
}

function setStatus(t){ document.getElementById("status").textContent = t; }
function clearStatus(){ document.getElementById("status").textContent = ""; }

refresh();
</script>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Web UI on port", PORT));
