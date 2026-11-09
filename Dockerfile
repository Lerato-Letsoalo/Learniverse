FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production DB_PATH=/data/learniverse.db
VOLUME /data
EXPOSE 3000
CMD ["node","server/index.js"]
