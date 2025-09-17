const express = require("express");
const net = require("net");
const { spawn } = require("child_process");

const LIQ_HOST = process.env.LIQ_HOST || "liquidsoap"; // service name from compose
const LIQ_PORT = parseInt(process.env.LIQ_PORT || "1234", 10);
const LIQ_PASS = process.env.LIQ_PASS || "";           // set in Dokploy env

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- helper: send a command to Liquidsoap's telnet server
function liqCommand(cmd) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buf = "";
    let authed = false;

    socket.setEncoding("utf8");
    socket.setTimeout(5000);

    socket.on("timeout", () => {
      try { socket.destroy(); } catch {}
      reject(new Error("Liquidsoap telnet timeout"));
    });

    socket.on("error", reject);

    socket.connect(LIQ_PORT, LIQ_HOST, () => {
      socket.write(LIQ_PASS + "\n");
    });

    socket.on("data", chunk => {
      buf += chunk.toString();
      // After first "OK" we are authenticated, then send the command
      if (!authed && buf.includes("OK")) {
        authed = true;
        socket.write(cmd + "\n");
      }
      // Many Liquidsoap builds print END when done
      if (buf.includes("END")) {
        socket.end();
      }
    });

    socket.on("end", () => resolve(buf));
  });
}

function getDirectAudio(url) {
  return new Promise((resolve, reject) => {
    const args = ["-g", "-f", "bestaudio"];

    // Optional: pass cookies to bypass YouTube bot/age checks
    if (process.env.YT_COOKIES) {
  args.push("--cookies", process.env.YT_COOKIES);
}

    // Extra flags that help in some cases:
    args.push(
      "--no-playlist",
      "--force-ipv4",
      "--geo-bypass",
      "--extractor-args", "youtube:player_client=android" // avoids some web checks
    );

    args.push(url);

    const proc = spawn("yt-dlp", args);
    let out = "", err = "";
    proc.stdout.on("data", d => (out += d.toString()));
    proc.stderr.on("data", d => (err += d.toString()));
    proc.on("close", code => {
      if (code === 0) {
        const line = out.trim().split("\n").pop();
        return line ? resolve(line.trim()) : reject(new Error("yt-dlp returned no URL"));
      }
      reject(new Error(err || `yt-dlp exited with code ${code}`));
    });
  });
}

// ---- API: enqueue a URL (YouTube or direct MP3/AAC/…) to Liquidsoap's request.queue
app.post("/enqueue", async (req, res) => {
  try {
    let { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url" });
    }
    url = url.trim();

    // If it's YouTube, resolve to a direct audio URL
    if (/youtube\.com|youtu\.be/.test(url)) {
      url = await getDirectAudio(url);
    }

    // Safety: Liquidsoap telnet command is plain text; avoid newlines
    url = url.replace(/\s/g, "%20").replace(/\n/g, "");

    // Push into request queue
    const resp = await liqCommand(`request.push ${url}`);
    return res.json({ ok: true, queued: url, resp });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ---- API: skip current request-queue track
app.post("/skip", async (_req, res) => {
  try {
    await liqCommand("rq.skip");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- API: simple now-playing (whatever Liquidsoap returns)
app.get("/now", async (_req, res) => {
  try {
    const out = await liqCommand("request.metadata");
    res.type("text/plain").send(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- tiny HTML form for quick use
app.get("/", (_req, res) => {
  res.type("html").send(`
    <form method="post" action="/enqueue">
      <input name="url" placeholder="YouTube or MP3 URL" style="width:420px" />
      <button type="submit">Enqueue</button>
    </form>
    <form method="post" action="/skip" style="margin-top:10px">
      <button type="submit">Skip current</button>
    </form>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Queue API listening on", PORT));
