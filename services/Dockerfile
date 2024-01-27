FROM python:3.8-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /services



COPY . /services

# Installing dependencies
RUN pip install -r /services/requirements/prod_requirements.txt

# Exposing the port the app runs on
EXPOSE 5050

# # Run the application
CMD ["gunicorn", "-w", "4", "-b", ":5050", "-t", "60", "run:app"]