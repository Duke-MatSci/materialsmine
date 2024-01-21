FROM tetherlessworld/whyis:2.2.2
RUN /opt/venv/bin/pip install whyis-unit-converter==0.0.2
RUN apt-get update
RUN apt install -y git
COPY ./materialsmine /app
WORKDIR '/app'
CMD [ "/bin/bash" ]
