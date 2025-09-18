FROM node:18-alpine

# Create app dir
WORKDIR /app

# Copy package.json first for caching
COPY package.json package-lock.json* ./

RUN npm install --production

# Copy the rest of the code
COPY . .

EXPOSE 8080

CMD ["node", "app.js"]
