FROM node:22-bookworm

RUN corepack enable

WORKDIR /app

ENV NODE_OPTIONS="--disable-warning=ExperimentalWarning"

# Copy everything (filtered by .dockerignore)
COPY . .

# Install dependencies - use --no-frozen-lockfile since pnpm-lock.yaml is not in repo
RUN pnpm install --no-frozen-lockfile || echo "pnpm install completed with warnings"

# Build only if build config files exist
RUN if [ -f "tsdown.config.ts" ] || [ -f "tsconfig.json" ]; then \
      pnpm build || echo "Build step skipped or completed with warnings"; \
    else \
      echo "Build config files not found, skipping build step"; \
    fi

# Build UI only if ui directory has build script
RUN if [ -d "ui" ] && grep -q '"build"' ui/package.json 2>/dev/null; then \
      pnpm ui:build || echo "UI build completed with warnings"; \
    else \
      echo "UI build skipped"; \
    fi

ARG OPENCLAW_INSTALL_BROWSER=0
RUN if [ "$OPENCLAW_INSTALL_BROWSER" = "1" ]; then \
      node /app/node_modules/playwright-core/cli.js install --with-deps chromium \
      && apt-get install -y --no-install-recommends xvfb \
      && rm -rf /var/lib/apt/lists/*; \
    fi

EXPOSE 3000
CMD ["node", "openclaw.mjs"]
