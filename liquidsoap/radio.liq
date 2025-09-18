# Verbose logs (3=info)
set("log.level", 3)

# Telnet control (no password in v2.x; only exposes inside Docker network)
# Default bind is localhost. Inside container that's fine; our web app connects via service name.
server.telnet(port=1234)

# Simple encoder bitrate
output_bitrate = 128

# Fallback: random from /music when queue empty
fallback_playlist = playlist(mode="random", reload_mode="watch", "/music")

# Queue for on-demand selections
rq = request.queue(id="rq")

# Prefer queued tracks, else fallback
stream = fallback(track_sensitive=false, [rq, fallback_playlist])

# Gentle crossfade
stream = crossfade(duration=2., stream)

# Stream to Icecast (host is the compose service name)
output.icecast(
  %mp3(bitrate=output_bitrate),
  host="icecast",
  port=8000,
  password="123456789",   # MUST match <source-password> in icecast.xml
  mount="/stream",
  name="My Simple Radio",
  description="Icecast + Liquidsoap + Web UI",
  url="http://radio.movana.me",
  genre="various",
  stream
)
