# ---- Logging
set("log.level", 3)

# ---- Control (set password via settings, then start telnet)
set("server.password", "gZ7rP2mXq9Vt4LkS5hBw0QeY")
server.telnet(port=1234)

# ---- Audio source: watch /music for files
s = playlist(mode="random", reload_mode="watch", "/music")

# ---- Stream to Icecast (MUST match icecast.xml source-password)
output.icecast(
  %mp3(bitrate=128),
  host="icecast",
  port=8000,
  password="N8f4bK2p9xQh7rV6sYw3Tu1c",
  mount="/stream",
  name="My Dockploy Radio",
  s
)
