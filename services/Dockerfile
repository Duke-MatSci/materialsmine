FROM python:3.8-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the environment variable for OpenBLAS
# ENV OPENBLAS_NUM_THREADS=2

WORKDIR /services



COPY . .

# Installing dependencies
RUN pip install --no-cache-dir -r /services/requirements/prod_requirements.txt

# Exposing the port the app runs on
EXPOSE 5050

# # Run the application
CMD ["gunicorn", "-w", "4", "-b", ":5050", "-t", "60", "run:app"]