FROM python:3.8-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /services

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY . /services

# Installing dependencies
RUN pip install --no-cache-dir -r /services/requirements/prod_requirements.txt

# Exposing the port the app runs on
EXPOSE 5050

# Run the application
# CMD ["gunicorn", "-w", "4", "-b", ":5050", "run:app"]
CMD ["gunicorn", "-w", "2", "-b", ":5050", "-t", "60", "run:app"]