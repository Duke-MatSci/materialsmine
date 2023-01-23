FROM python:3.8-slim-buster

WORKDIR /apps

COPY pyApp/requirements.txt .
COPY chemprops/requirements.txt ./chemprop-requirements.txt
COPY requirements/xmlconv-requirements.txt ./xmlconv-requirements.txt
COPY requirements/dynamfit-requirements.txt ./dynamfit-requirements.txt

COPY script/ ./script

RUN pip install -r requirements.txt
RUN pip install -r chemprop-requirements.txt
RUN pip install -r xmlconv-requirements.txt
RUN pip install python-datauri
RUN pip install -r dynamfit-requirements.txt
RUN chmod +x ./script/installer

COPY . /app
EXPOSE 5050
CMD [ "/app/script/installer" ]

# matplotlib==2.2.4
# MechanicalSoup==0.12.0
# dicttoxml==1.7.4
# xlrd==1.2.0
# beautifulsoup4~=4.7.1
# lxml==4.3.4
# mime==0.1.0
# python-slugify



# // dockerignore
# .git
# __pycache__
# *.pyc
# *.pyo
# *.pyd
# .Python
# env