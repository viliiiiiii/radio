const express = require("express");
else reject(new Error(err || `yt-dlp exited with ${code}`));
});
});
}


app.post("/enqueue", async (req, res) => {
try {
let { url } = req.body;
if (!url) return res.status(400).json({ error: "Missing url" });


if (/youtube\.com|youtu\.be/.test(url)) {
url = await getDirectAudio(url);
}


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