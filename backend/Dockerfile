FROM node:18-slim

# Install openssl for prisma client compatibility
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

# Start server after applying migrations (via entrypoint command in docker-compose or script)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run build && npm start"]
