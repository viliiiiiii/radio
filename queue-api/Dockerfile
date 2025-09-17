FROM node:20-alpine
RUN apk add --no-cache yt-dlp ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY app.js ./
ENV PORT=8080
CMD ["node", "app.js"]