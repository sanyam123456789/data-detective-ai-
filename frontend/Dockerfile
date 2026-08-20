FROM node:18-alpine

WORKDIR /app

# Copy package dependencies and install
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Expose Next.js server port
EXPOSE 3000

# Set build/runtime environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000}

# Run Next.js dev server
CMD ["npm", "run", "dev"]

