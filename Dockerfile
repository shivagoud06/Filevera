FROM node:22-bookworm-slim

WORKDIR /app

# System dependencies:
# - Ghostscript for PDF compression
# - Python + compiler tools for native npm modules such as better-sqlite3
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ghostscript \
       python3 \
       make \
       g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]