# -*- config:utf-8 -*-

import os
import logging
from datetime import timedelta

project_name = "nanomine"
import importer

import autonomic
import agents.nlp as nlp
import rdflib
from datetime import datetime


# Set to be custom for your project
LOD_PREFIX = os.environ.get('NM_GRAPH_LOD_PREFIX','http://materialsmine.org')

#os.getenv('lod_prefix') if os.getenv('lod_prefix') else 'http://hbgd.tw.rpi.edu'

skos = rdflib.Namespace("http://www.w3.org/2004/02/skos/core#")

from nanomine.agent import *

import whyis_unit_converter.unit_converter_agent as converter

from authenticator import JWTAuthenticator

authenticator_config = [] # set into config dict later
authenticator_secret = os.environ.get('NM_GRAPH_AUTH_SECRET', None)
if authenticator_secret:
    authenticator_config.append(JWTAuthenticator(key=authenticator_secret))

# base config class; extend it to your needs.
Config = dict(
    # use DEBUG mode?
    DEBUG = False,

    site_name = "Nanomine",

    site_description = "Material Informatics for Polymer Nanocomposites",

    root_path = '/apps/whyis',

    app_path = '/apps/nanomine-graph',

    site_header_image = 'static/images/random_network.png',

    # use TESTING mode?
    TESTING = False,

    # use server x-sendfile?
    USE_X_SENDFILE = False,

    WTF_CSRF_ENABLED = True,
    SECRET_KEY = "VOJ12a53NB9HOURFLNDOIWQZZ8YuFpMc",

    base_rate_probability = 0.8,

    file_archive = {
        #'depot.backend': 'depot.io.gridfs.GridFSStorage',
        #'depot.mongouri': 'mongodb://localhost/whyis_files',
        'depot.storage_path' : '/data/files',
        'cache_max_age' : 3600*24*7,
    },
    vocab_file = "/apps/nanomine-graph/vocab.ttl",
    WHYIS_TEMPLATE_DIR = [
        "templates",
    ],
    WHYIS_CDN_DIR = "/apps/nanomine-graph/static",

    # LOGGING
    LOGGER_NAME = "%s_log" % project_name,
    LOG_FILENAME = "/var/log/%s/output-%s.log" % (project_name,str(datetime.now()).replace(' ','_')),
    LOG_LEVEL = logging.INFO,
    LOG_FORMAT = "%(asctime)s %(levelname)s\t: %(message)s", # used by logging.Formatter

    PERMANENT_SESSION_LIFETIME = timedelta(days=7),

    # EMAIL CONFIGURATION
    ## MAIL_SERVER = "",
    ## MAIL_PORT = 587,
    ## MAIL_USE_TLS = True,
    ## MAIL_USE_SSL = False,
    ## MAIL_DEBUG = False,
    ## MAIL_USERNAME = '',
    ## MAIL_PASSWORD = '',
    ## DEFAULT_MAIL_SENDER = "rui <yanr2@rpi.edu>",

    # see example/ for reference
    # ex: BLUEPRINTS = ['blog']  # where app is a Blueprint instance
    # ex: BLUEPRINTS = [('blog', {'url_prefix': '/myblog'})]  # where app is a Blueprint instance
    BLUEPRINTS = [],

    lod_prefix = LOD_PREFIX,
    SECURITY_EMAIL_SENDER = "rui <admin@nanomine.org>",
    SECURITY_FLASH_MESSAGES = True,
    SECURITY_CONFIRMABLE = False,
    SECURITY_CHANGEABLE = True,
    SECURITY_TRACKABLE = True,
    SECURITY_RECOVERABLE = True,
    SECURITY_REGISTERABLE = True,
    SECURITY_PASSWORD_HASH = 'sha512_crypt',
    SECURITY_PASSWORD_SALT = 'B3kPg16LgaoxOm4Jp4kg31iGwz7fx4Kv',
    SECURITY_SEND_REGISTER_EMAIL = False,
    SECURITY_POST_LOGIN_VIEW = "/",
    SECURITY_SEND_PASSWORD_CHANGE_EMAIL = False,
    SECURITY_DEFAULT_REMEMBER_ME = True,
    ADMIN_EMAIL_RECIPIENTS = [],
    db_defaultGraph = LOD_PREFIX + '/',

    DEFAULT_ANONYMOUS_READ = True,


    admin_queryEndpoint = 'http://localhost:8080/blazegraph/namespace/admin/sparql',
    admin_updateEndpoint = 'http://localhost:8080/blazegraph/namespace/admin/sparql',

    knowledge_queryEndpoint = 'http://localhost:8080/blazegraph/namespace/knowledge/sparql',
    knowledge_updateEndpoint = 'http://localhost:8080/blazegraph/namespace/knowledge/sparql',

    authenticators = authenticator_config,

    #knowledge_useBlazeGraphBulkLoad = True,
    #knowledge_bulkLoadEndpoint = 'http://localhost:8080/blazegraph/dataloader',
    #knowledge_BlazeGraphProperties = '/apps/whyis/knowledge.properties',
    #load_dir = '/data/loaded',
    #knowledge_bulkLoadNamespace = 'knowledge',

    LOGIN_USER_TEMPLATE = "auth/login.html",
    CELERY_BROKER_URL = 'redis://localhost:6379/0',
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0',
    CACHE_TYPE = "redis", # Flask-Caching related configs
    CACHE_KEY_PREFIX = 'whyis_cache_',
    CACHE_REDIS_URL = 'redis://localhost:6379/0',
    CACHE_DEFAULT_TIMEOUT = 0,

    default_language = 'en',
    namespaces = [
        importer.LinkedData(
            prefix = LOD_PREFIX+'/dcat/',
            url = 'http://www.w3.org/ns/dcat#%s',
            headers={'Accept':'text/turtle'},
            format='turtle'
        ),
        importer.LinkedData(
            prefix = LOD_PREFIX+'/doi/',
            url = 'http://dx.doi.org/%s',
            headers={'Accept':'text/turtle'},
            format='turtle',
            postprocess_update= ['''insert {
                graph ?g {
                    ?pub a <http://purl.org/ontology/bibo/AcademicArticle>.
                }
            } where {
                graph ?g {
                    ?pub <http://purl.org/ontology/bibo/doi> ?doi.
                }
            }''',
            '''delete {
              ?author <http://www.w3.org/2002/07/owl#sameAs> ?orcid.
            } insert {
                graph ?g {
                    ?author <http://www.w3.org/ns/prov#specializationOf> ?orcid.
                }
            } where {
                graph ?g {
                    ?author a <http://xmlns.com/foaf/0.1/Person>;
                      <http://www.w3.org/2002/07/owl#sameAs> ?orcid.
                }
            }
            ''']
        ),
        importer.LinkedData(
            prefix = LOD_PREFIX+'/orcid/',
            url = 'http://orcid.org/%s',
            headers={'Accept':'application/ld+json'},
            format='json-ld',
            replace=[
                ('\\"http:\\/\\/schema\\.org\\",', '{"@vocab" : "http://schema.org/"},'),
                ('https://doi.org/', 'http://dx.doi.org/'),
                ('https://', 'http://'),
            ],
            postprocess_update= ['''delete {
              ?org ?p ?o.
              ?s ?p ?org.
            } insert {
                graph ?g {
                    ?s ?p ?o.
                }
            } where {
                graph ?g {
                    {
                    ?org a <http://schema.org/Organization>;
                      <http://schema.org/identifier> [
                          a <http://schema.org/PropertyValue>;
                          <http://schema.org/propertyID> ?propertyID;
                          <http://schema.org/value> ?idValue;
                      ].
                      ?org ?p ?o.
                      bind(IRI(concat("%s/organization/", str(?propertyID),"/",str(?idValue))) as ?s)
                    } union {
                    ?org a <http://schema.org/Organization>;
                      <http://schema.org/identifier> [
                          a <http://schema.org/PropertyValue>;
                          <http://schema.org/propertyID> ?propertyID;
                          <http://schema.org/value> ?idValue;
                      ].
                      ?s ?p ?org.
                      bind(IRI(concat("%s/organization/", str(?propertyID),"/",str(?idValue))) as ?o)
                    }
                }
            }'''  % (LOD_PREFIX, LOD_PREFIX) ,
            '''
            insert {
                graph ?g {
                    ?s <http://schema.org/name> ?name.
                }
            } where {
                graph ?g {
                    ?s <http://schema.org/alternateName> ?name.
                }
            }
            ''']
        ),
        importer.LinkedData(
            prefix = LOD_PREFIX+'/dbpedia/',
            url = 'http://dbpedia.org/resource/%s',
            headers={'Accept':'text/turtle'},
            format='turtle',
            postprocess_update= '''insert {
                graph ?g {
                    ?article <http://purl.org/dc/terms/abstract> ?abstract.
                }
            } where {
                graph ?g {
                    ?article <http://dbpedia.org/ontology/abstract> ?abstract.
                }
            }
            '''
        )
    ],
    inferencers = {
	"SDDAgent": autonomic.SDDAgent(),
        "SETLr": autonomic.SETLr(),
        "SETLMaker": autonomic.SETLMaker(),
        "CacheUpdater" : autonomic.CacheUpdater(),
        "UnitConverter": converter.UnitConverter(),
#        "HTML2Text" : nlp.HTML2Text(),
        "EntityExtractor" : nlp.EntityExtractor(),
        "EntityResolver" : nlp.EntityResolver(),
#        "TF-IDF Calculator" : nlp.TFIDFCalculator(),
#        "SKOS Crawler" : autonomic.Crawler(predicates=[skos.broader, skos.narrower, skos.related])
    },
    inference_tasks = [
#        dict ( name="SKOS Crawler",
#               service=autonomic.Crawler(predicates=[skos.broader, skos.narrower, skos.related]),
#               schedule=dict(hour="1")
#              )
    ]
)


# config class for development environment
Dev = dict(Config)
Dev.update(dict(
    DEBUG = True,  # we want debug level output
    MAIL_DEBUG = True,
    EXPLAIN_TEMPLATE_LOADING = True,
    DEBUG_TB_INTERCEPT_REDIRECTS = False
))

# config class used during tests
Test = dict(Config)
Test.update(dict(
    TESTING = True,
    WTF_CSRF_ENABLED = False
))
