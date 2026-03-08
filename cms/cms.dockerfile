FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist
RUN npm install --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/index.js"]
