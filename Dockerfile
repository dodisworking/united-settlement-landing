# Use Playwright's official image - has Chromium, Node, all OS deps preinstalled.
# Pin the version so the npm playwright dep matches the bundled browser binary.
FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

# Install only production deps. Playwright is in dependencies (not dev) so it
# installs fine here; the browser binary is already in the base image.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source (.dockerignore excludes node_modules, .git, etc.)
COPY . .

# Railway sets PORT at runtime; expose for documentation.
EXPOSE 3000

# Run as non-root for security (the base image creates 'pwuser')
USER pwuser

CMD ["node", "server/index.js"]
