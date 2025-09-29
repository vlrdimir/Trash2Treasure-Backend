# ---------- Dev image: Bun + hot reload ----------
    FROM oven/bun:1-debian

    WORKDIR /app
    
    # HTTPS buat download model, AWS SDK, dsb.
    RUN apt-get update \
      && apt-get install -y --no-install-recommends ca-certificates \
      && rm -rf /var/lib/apt/lists/*
    
    # Env default dev
    ENV NODE_ENV=development \
        TFJS_BACKEND=cpu \
        PORT=3029
    
    # Install deps dulu (cache-friendly), lalu copy source
    COPY package.json bun.lockb* ./
    RUN bun install --frozen-lockfile || bun install
    COPY . .
    
    EXPOSE 3029 3266
    
    # Jalankan watcher
    CMD ["bun","run","dev"]
    