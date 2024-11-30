FROM tetherlessworld/whyis:2.3.10
RUN apt-get update
RUN /opt/venv/bin/pip install whyis-unit-converter==0.0.2
COPY ./materialsmine /app
WORKDIR '/app'
CMD [ "/bin/bash" ]