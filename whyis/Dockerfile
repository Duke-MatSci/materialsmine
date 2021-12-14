FROM alpine
RUN apk update && apk add --no-cache python3 py3-pip
RUN alias python=python3
WORKDIR '/app'
COPY . .
CMD [ "python3" ]