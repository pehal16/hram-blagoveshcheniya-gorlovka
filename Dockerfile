FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_ORDER_ENDPOINT=/api/notify
ENV VITE_ORDER_ENDPOINT=$VITE_ORDER_ENDPOINT
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server/timeweb-vps/server.mjs ./server/timeweb-vps/server.mjs

USER node
EXPOSE 8080
CMD ["node", "server/timeweb-vps/server.mjs"]
