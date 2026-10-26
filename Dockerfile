FROM node:20-alpine

RUN apk add --no-cache git libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

RUN echo "cachebust-3" && git clone --branch main --depth 1 https://github.com/topmuch/yonukom.git /app/tmp && \
    cp -r /app/tmp/. /app/ && rm -rf /app/tmp

RUN bun install

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/yonukom.db
RUN bun run build

RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/yonukom.db

CMD sh -c "mkdir -p /app/data && export DATABASE_URL=file:/app/data/yonukom.db && \
    if [ ! -f /app/data/yonukom.db ]; then \
        echo 'DB does not exist yet — initializing schema only (no demo data)'; \
        npx prisma db push --skip-generate --accept-data-loss 2>&1 || true; \
        echo 'DB schema created. To seed superadmin demo data, run: bun run prisma/seed-superadmin.ts'; \
    else \
        echo 'DB already exists — applying schema migrations without touching data'; \
        npx prisma db push --skip-generate 2>&1 || true; \
    fi && \
    exec node .next/standalone/server.js"
