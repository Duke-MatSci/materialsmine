FROM node:22 AS build
WORKDIR /app

# Accept build argument for GitHub token
ARG MM_GHT

# Set environment variable for the build process
ENV MM_GHT=${MM_GHT}

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .

ENV NODE_ENV=production
ENV BASE_URL="/"
RUN pnpm run build

FROM nginx:alpine AS production

# Accept build argument for port
ARG PORT=8080

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Replace port placeholder in nginx config
RUN sed -i "s/listen 8080;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf

EXPOSE $PORT

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]