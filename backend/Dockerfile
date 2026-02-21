FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Create directories for uploads and generated files
RUN mkdir -p /app/uploads /app/generated

EXPOSE 4000

CMD ["node", "dist/index.js"]
