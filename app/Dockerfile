FROM node:18.12.1-alpine as builder
WORKDIR '/app'
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.21
RUN mkdir /app
COPY --from=builder /app/dist /app
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf