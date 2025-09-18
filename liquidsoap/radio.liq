set("log.level", 3)

# Telnet control (no password parameter in v2)
server.telnet(port=int(getenv("LIQ_TELNET_PORT","1234")))

output_bitrate = int(getenv("OUTPUT_BITRATE","128"))
ice_host = getenv("ICECAST_HOST","icecast")
ice_port = int(getenv("ICECAST_PORT","8000"))
ice_pw   = getenv("ICECAST_PASSWORD","changeme")
mount    = getenv("STATION_MOUNT","/stream")
name     = getenv("STATION_NAME","My Radio")

# Fallback playlist from mounted /music
fallback_playlist = playlist(mode="random", reload_mode="watch", "/music")

# Request queue
rq = request.queue(id="rq")

# Prefer requests, then fallback
stream = fallback(track_sensitive=false, [rq, fallback_playlist])
stream = crossfade(duration=2., stream)

# Stream to Icecast
output.icecast(
  %mp3(bitrate=output_bitrate),
  host=ice_host, port=ice_port, password=ice_pw,
  mount=mount, name=name, description="Dokploy radio",
  url="http://example.com", genre="various",
  stream
)
