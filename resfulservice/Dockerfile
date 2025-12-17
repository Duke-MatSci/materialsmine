FROM node:18.1.0-alpine
RUN apk add --no-cache openjdk17-jdk
ENV JAVA_HOME=/usr/lib/jvm/default-jvm
ENV PATH="$JAVA_HOME/bin:${PATH}"
WORKDIR "/app"
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
CMD ["sh", "-c", "NODE_ENV=production mkdir -p /app/schemas && curl -fsSL https://raw.githubusercontent.com/Duke-MatSci/nanomine-schema/refs/heads/master/xml/PNC_schema_031822.xsd -o /app/schemas/xsd-schema.xsd && exec node src/server.js"]