FROM python:3.8-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /services

COPY . /services

# Installing dependencies
RUN pip install --no-cache-dir -r /services/requirements/prod_requirements.txt

# Exposing the port the app runs on
EXPOSE 5050

# Run the application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5050", "run:app"]