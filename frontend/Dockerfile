FROM node:18-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci

# Source
COPY . .

# Build
RUN npm run build

# Runner
CMD ["npm", "start"]
