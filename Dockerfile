# Remotion headless + API HTTP (EasyPanel / Docker).
# Doc oficial: https://www.remotion.dev/docs/docker
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
  libnspr4 \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libgbm-dev \
  libasound2 \
  libxrandr2 \
  libxkbcommon-dev \
  libxfixes3 \
  libxcomposite1 \
  libxdamage1 \
  libatk-bridge2.0-0 \
  libpango-1.0-0 \
  libcairo2 \
  libcups2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY patches ./patches
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY public ./public

RUN npm ci
RUN npm run build:preview
RUN npx remotion browser ensure

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "scripts/http-server.mjs"]
