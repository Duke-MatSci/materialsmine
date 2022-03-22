FROM tetherlessworld/whyis:latest
RUN /opt/venv/bin/pip install whyis-unit-converter==0.0.2
COPY ./materialsmine /app
WORKDIR '/app'
CMD [ "/bin/bash" ]
