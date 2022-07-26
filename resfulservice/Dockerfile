FROM node:16.14-alpine
WORKDIR "/app"
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
CMD ["npm", "run", "start:prod"]