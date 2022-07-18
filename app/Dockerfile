FROM node:16.14-alpine as builder
WORKDIR '/app'
COPY ./package.json .
RUN apk add --upgrade --no-cache python3 make g++
RUN npm install
RUN apk del python3 make g++
COPY . .
RUN npm run build

FROM nginx:1.21
RUN mkdir /app
COPY --from=builder /app/dist /app
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf