# Nanomine-graph
visualization for nanomine project

# Installation
- install [whyis](http://tetherless-world.github.io/whyis/install) using this command
  ```
  WHYIS_BRANCH=master bash < <(curl -skL https://raw.githubusercontent.com/tetherless-world/whyis/master/install.sh)
  ```
- whyis will be installed in /apps/whyis
- install nanomine-graph app following:
  ```
  sudo su - whyis
  cd /apps
  git clone https://github.com/tetherless-world/nanomine-graph.git
  cd /apps/nanomine-graph
  pip install -e .
  exit
  sudo service apache2 restart
  sudo service celeryd restart
  sudo su - whyis
  cd /apps/whyis
  python manage.py createuser -e (email) -p (password) -f (frstname) -l (lastname) -u (username) --roles=admin
  ```
- In your terminal, load the ontology and XML Ingest Semantic ETL file:
  ```
  cd /apps/whyis
  python manage.py load -i /apps/nanomine-graph/setl/ontology.setl.ttl -f turtle
  python manage.py load -i /apps/nanomine-graph/setl/xml_ingest.setl.ttl -f turtle
  python manage.py load -i 'http://semanticscience.org/ontology/sio-subset-labels.owl' -f xml
  ```

- Load any Nanomine XML files you may already have. There is a collection floating around among developers. For production, the curation service will post XML files to the Whyis instance when they're ready to be used.

  ```
  cd /apps/whyis
  python manage.py load -i </path/to/local_files.ttl> -f turtle
  ```


- go to http://localhost/ to login with your credentials during "createuser" command

# Developing mode
Each time a change is made on the visualization, apache2 and celeryd service have to be restarted manually. 
This is very troublesome. whyis has a developing mode that help you allevate this pain. 
```
sudo su - whyis
cd /app/whyis
python manage.py runserver -h 0.0.0.0
``` 
Then, you only need to refresh your webpage to see your changes immediately after you make changes to the visualization. 
After you finished the visualization changes, you can shutdown the developing mode with CTRL+c.
Then you have to restart apache2 and celeryd service by
```
sudo service apache2 restart
sudo service celeryd restart
```
