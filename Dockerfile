FROM denoland/deno:debian

# Install chromium and standard dependencies for headless Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Deno environment variables for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copy project files
COPY . .

# Pre-cache dependencies
RUN deno cache main.tsx

EXPOSE 8000

# Start server
CMD ["run", "-A", "--env", "main.tsx"]
