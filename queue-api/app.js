const express = require("express");
const bodyParser = require("body-parser");
const net = require("net");

const app = express();
app.use(bodyParser.json());

// Env vars
const LIQ_HOST = process.env.LIQ_HOST || "liquidsoap";
const LIQ_PORT = parseInt(process.env.LIQ_PORT || "1234", 10);
const PORT = process.env.PORT || 8080;

// Helper to send commands to Liquidsoap via telnet
function liqCommand(cmd) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let dataBuffer = "";

    socket.connect(LIQ_PORT, LIQ_HOST, () => {
      socket.write(cmd + "\n");
    });

    socket.on("data", (data) => {
      dataBuffer += data.toString();
    });

    socket.on("end", () => {
      resolve(dataBuffer.trim());
    });

    socket.on("error", (err) => {
      reject(err);
    });

    setTimeout(() => {
      socket.destroy();
      reject(new Error("Liquidsoap telnet timeout"));
    }, 5000);
  });
}

// API routes
app.post("/enqueue", async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing url" });

    await liqCommand(`request.push ${url}`);
    res.json({ ok: true, queued: url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/skip", async (_req, res) => {
  try {
    await liqCommand("rq.skip");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/now", async (_req, res) => {
  try {
    const out = await liqCommand("request.metadata");
    res.type("text/plain").send(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/", (_req, res) => {
  res.type("html").send(`
    <h2>Radio Queue Control</h2>
    <form method="post" action="/enqueue">
      <input name="url" placeholder="MP3 URL or file path" style="width:420px" />
      <button type="submit">Enqueue</button>
    </form>
    <form method="post" action="/skip" style="margin-top:10px">
      <button type="submit">Skip current</button>
    </form>
    <p><a href="/now">What's playing?</a></p>
  `);
});

app.listen(PORT, () => console.log("Queue API listening on", PORT));
