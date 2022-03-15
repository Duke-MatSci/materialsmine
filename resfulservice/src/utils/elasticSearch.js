const axios = require('axios');
const { Client } = require('@elastic/elasticsearch');
const configPayload = require('../../config/esConfig');
const env = process.env;

class ElasticSearch {
  constructor() {
    this.client = new Client({ node: `http://${env?.ESADDRESS}` });
    this.initES = this.initES.bind(this);
    this.search = this.search.bind(this);
  }

  /**
   * Check if ES is up & running
   * @returns {Boolean} ping
   */
  async ping (log, waitTime = 30000) {
    log.info('elasticsearch.ping(): Function entry');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        const response = await this.client.ping();
        clearTimeout(timer);
        if(!response) {
          const error = new Error('Elastic Search Service Not Available');
          log.error(`elasticsearch.ping(): 500 - ${error}`);
          reject(error);
        }
        resolve(response);
      }, waitTime);
    });
  }

  /**
   * 
   * @param {String} type 
   * @returns {Object} response
   */
  async createConfig (type) {
    const configResponse = await axios({
      method: 'put',
      url: `http://${env.ESADDRESS}/${type}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({...configPayload.config})
    });
    return configResponse;
  }

  async putMappings (type, schema) {
    return this.client.indices.putMapping({
      index: type,
      // type: 'articles',
      body: {
        ...schema
      }
    })
  }

  async initES (req, type, schema) {
    const log = req.logger;
    log.error('elasticsearch.initES(): Function entry');

    if(!type || !schema) {
      const error = new Error('Category type is missing')
      error.statusCode = 400;
      log.error(`initializeElasticSearch(): ${error}`);
      throw(error);
    }

    try {
      await this.createConfig(type);
      await this.putMappings(type, schema);
      return {
        type,
        status: 'Successfully configured!'
      }
    } catch (err) {
      log.error(`elasticsearch.initES(): ${err.status || 500 } - ${err}`);
      throw (err);
    }
  }

  async indexDocument (req, type, doc) {
    const log = req.logger;
    if(!type || !doc) {
      const error = new Error('Category type is missing')
      error.statusCode = 400;
      log.error(`indexDocument(): ${error}`);
      throw(error);
    }
    return this.client.index({
      index: type,
      document: { ...doc }
    })
  }

  async refreshIndices (req, type) {
    const log = req.logger;
    if(!type) {
      const error = new Error('Category type is missing')
      error.statusCode = 400;
      log.error(`refreshIndices(): ${error}`);
      throw(error);
    }
    return this.client.indices.refresh({ index: type });
  }

  searchSanitizer (search) {
    let sanitizeSearch = search;
    sanitizeSearch = sanitizeSearch.split(' ').map((word, index) => {
      if(index < 20) {
        if(word.length > 50) {
          return word.substr(0, 75);
        }
        return word;
      }
    }).join(' ');

    if (sanitizeSearch.match(/"|\*|\s|\/|:|\./)) {
      sanitizeSearch = `${sanitizeSearch}\\*`;
    }
    return sanitizeSearch;
  }

  async search (searchPhrase) {
    const phrase = this.searchSanitizer(searchPhrase);
    return axios({
      method: 'get',
      url: `http://${env.ESADDRESS}/_all/_search?size=300`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
       query: { 
        match: { 
          label: {
            query: phrase, 
            analyzer: "standard" 
          } 
        } 
      } 
      })
    });
  }
}

module.exports = new ElasticSearch();