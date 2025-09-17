FROM node:20-alpine
RUN apk add --no-cache yt-dlp ffmpeg
WORKDIR /app

# Copy only package.json first to leverage build cache
COPY package.json ./

# Install prod deps without needing a lockfile
RUN npm install --omit=dev

# Now copy the app code
COPY app.js ./

ENV PORT=8080
CMD ["node", "app.js"]
