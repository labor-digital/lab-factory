# Multi-stage Dockerfile for pipeline-app — the deployed dashboard surface
# (DL #017). Local-pipeline execution still runs on a dev's laptop via
# `npm run dev`; this image is for the read/manage dashboard.
#
# Build:   docker build -t factory-pipeline-app .
# Run:     docker run -p 3100:3100 --env-file .env factory-pipeline-app

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100
ENV HOST=0.0.0.0

# Only what adapter-node needs at runtime.
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3100
USER node
CMD ["node", "build"]
