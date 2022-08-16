FROM tetherlessworld/whyis:latest
RUN /opt/venv/bin/pip install whyis-unit-converter==0.0.2
RUN apt-get update
RUN apt install -y git
RUN /opt/venv/bin/pip uninstall -y filedepot
RUN /opt/venv/bin/pip install 'git+https://github.com/jpmccu/depot.git@import_export#egg=filedepot'
COPY ./materialsmine /app
WORKDIR '/app'
CMD [ "/bin/bash" ]
