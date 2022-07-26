FROM python:3.8-alpine

RUN apk update && apk upgrade

RUN mkdir /app
WORKDIR /app

COPY ./src/requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY ./src .

# Expose port 9090 to the outside world
EXPOSE 9090

CMD ["python", "app.py"]