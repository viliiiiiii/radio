# Logging
set("log.level", 3)

# Set the server (telnet/HTTP) control password first
server.password("gZ7rP2mXq9Vt4LkS5hBw0QeY")

# Then enable the telnet server on port 1234 (no password argument here)
server.telnet(port=1234)


# Encoder settings
output_bitrate = 128

# Fallback playlist when queue is empty
fallback_playlist = playlist(mode="random", reload_mode="watch", "/music")

# Request queue for on-demand URLs
rq = request.queue(id="rq")

# Prefer rq when it has items, else fallback
stream = fallback(track_sensitive=false, [rq, fallback_playlist])

# Simple crossfade
stream = crossfade(duration=2., stream)

# Stream to Icecast (service name is "icecast" in compose network)
output.icecast(
  %mp3(bitrate=output_bitrate),
  host="icecast",
  port=8000,
  password="N8f4bK2p9xQh7rV6sYw3Tu1c",  # MUST match <source-password> in icecast.xml
  mount="/stream",                     # hardcode; no ${...} here
  name="My Dockploy Radio",            # hardcode; no ${...} here
  description="Dokploy radio",
  url="http://radio.movana.me",
  genre="various",
  stream
)
