FROM jrei/systemd-ubuntu:20.04
RUN apt-get update && apt-get install -y software-properties-common gcc

RUN apt-get update && apt-get install -y \
    python3.8-distutils \
    python3.8-dev \
    python3-pip \
    python3.8-venv \
    curl \
    libdb5.3-dev \
    default-jdk-headless
RUN python3.8 -m pip install requests wheel gunicorn
RUN python3.8 -m pip install whyis==2.0a5 whyis-unit-converter==0.0.2
WORKDIR '/apps/materialsmine'
CMD [ "/bin/bash" ]
