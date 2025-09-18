# Logging
set("log.level", 3)

# Telnet control (no password option in v2.x)
server.telnet(port=1234)

# Encoder settings
output_bitrate = int(getenv("OUTPUT_BITRATE", "128"))

# Fallback playlist from /music
fallback_playlist = playlist(mode="random", reload_mode="watch", "/music")

# Request queue for on-demand files
rq = request.queue(id="rq")

# Prefer queue, else fallback
stream = fallback(track_sensitive=false, [rq, fallback_playlist])

# Simple crossfade
stream = crossfade(duration=2., stream)

# Stream to Icecast
output.icecast(
  %mp3(bitrate=output_bitrate),
  host=getenv("ICECAST_HOST", "icecast"),
  port=int(getenv("ICECAST_PORT", "8000")),
  password=getenv("ICECAST_PASSWORD", "hackme"),
  mount=getenv("STATION_MOUNT", "/stream"),
  name=getenv("STATION_NAME", "My Radio"),
  description="Dokploy radio",
  url="http://example.com",
  genre="various",
  stream
)
