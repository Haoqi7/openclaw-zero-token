FROM node:22-bookworm

RUN corepack enable

WORKDIR /app

ENV NODE_OPTIONS="--disable-warning=ExperimentalWarning"

# Copy everything (filtered by .dockerignore)
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm ui:build

ARG OPENCLAW_INSTALL_BROWSER=0
RUN if [ "$OPENCLAW_INSTALL_BROWSER" = "1" ]; then \
      node /app/node_modules/playwright-core/cli.js install --with-deps chromium \
      && apt-get install -y --no-install-recommends xvfb \
      && rm -rf /var/lib/apt/lists/*; \
    fi

EXPOSE 3000
CMD ["node", "openclaw.mjs"]
