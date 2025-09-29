# ---------- Dev image: Bun + hot reload ----------
    FROM oven/bun:1-debian

    WORKDIR /app
    
    # Copy manifest & install deps (cache-friendly)
    COPY package.json bun.lockb* ./
    RUN bun install --frozen-lockfile || bun install
    
    # Copy sisa source (kalau pakai volume mount di compose, langkah ini opsional)
    COPY . .
    
    # Env default
    ENV NODE_ENV=development \
        TFJS_BACKEND=cpu \
        PORT=3000
    
    EXPOSE 3000
    EXPOSE 3266
    
    # Jalankan script dev (watcher)
    CMD ["bun","run","dev"]
    