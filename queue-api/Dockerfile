FROM node:20-alpine
RUN apk add --no-cache yt-dlp ffmpeg
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY app.js ./

# add a tiny entrypoint that writes cookies if provided
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=8080
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "app.js"]
