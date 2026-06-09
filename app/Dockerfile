# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install all deps (incl. dev) for the TypeScript build.
COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json tsconfig.client.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src
RUN npm run build

# Drop dev dependencies for the runtime image.
RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# DB lives on a mounted volume; quest config is mounted read-only.
ENV DB_PATH=/data/quest.db
ENV QUEST_CONFIG=/quest/quest.yaml
EXPOSE 3000

CMD ["node", "dist/server/index.js"]
