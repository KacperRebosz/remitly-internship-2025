
    FROM node:20-alpine AS base
    WORKDIR /usr/src/app
    RUN apk add --no-cache libc6-compat openssl

    FROM base AS deps
    COPY package.json package-lock.json* ./
    RUN npm install --frozen-lockfile
    

    FROM base AS build
    COPY --from=deps /usr/src/app/node_modules ./node_modules
    COPY . .
    RUN echo ">>> Running NestJS build..." && npm run build && echo ">>> NestJS build finished."
    RUN echo ">>> Verifying contents of /usr/src/app/dist/src..." && ls -l /usr/src/app/dist/src && echo ">>> Verification complete." # Adjusted verification path
    RUN echo ">>> Building scripts..." && npm run build:scripts && echo ">>> Script build finished."

    FROM base AS production
    ENV NODE_ENV=production
    WORKDIR /usr/src/app
    
    COPY --from=deps /usr/src/app/package.json ./package.json
    COPY --from=deps /usr/src/app/package-lock.json* ./package-lock.json*
    RUN npm install --omit=dev --ignore-scripts --prefer-offline
    
    COPY --from=build /usr/src/app/dist ./dist
    
    EXPOSE ${PORT:-3000}

    CMD ["node", "dist/src/main.js"]
