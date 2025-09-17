# Logging
set("log.level", 3)


# Telnet control (internal only; Queue API connects to this)
server.telnet(port=1234, password="${LIQ_TELNET_PASSWORD}")


# Encoder settings
output_bitrate = 128


# Fallback playlist when queue is empty: mount a /music folder
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
password="${ICECAST_SOURCE_PASSWORD}",
mount="${STATION_MOUNT}",
name="${STATION_NAME}",
description="Dokploy radio",
url="http://example.com",
genre="various",
stream)