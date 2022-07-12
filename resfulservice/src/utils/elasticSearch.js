const axios = require('axios');
const { Client } = require('@elastic/elasticsearch');
const configPayload = require('../../config/esConfig');
const env = process.env;

class ElasticSearch {
  constructor () {
    this.client = new Client({ node: `http://${env?.ESADDRESS}` });
    this.initES = this.initES.bind(this);
    this.search = this.search.bind(this);
  }

  /**
   * Check if ES is up & running
   * @returns {Boolean} ping
   */
  async ping (log, waitTime = 50000) {
    log.info('elasticsearch.ping(): Function entry');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        const response = await this.client.ping();
        clearTimeout(timer);
        if (!response) {
          const error = new Error('Elastic Search Service Not Available');
          log.error(`elasticsearch.ping(): 500 - ${error}`);
          reject(error);
        }
        log.debug(`elasticsearch.ping(): response ${response}`);
        resolve(response);
      }, waitTime);
    });
  }

  /**
   *
   * @param {String} type
   * @returns {Object} response
   */
  async _createConfig (type) {
    const configResponse = await axios({
      method: 'put',
      url: `http://${env.ESADDRESS}/${type}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ ...configPayload.config })
    });
    return configResponse;
  }

  /**
   * Deletes a type group and all its docs
   * @param {String} type
   * @returns {Object} response
   */
  async deleteAType (type) {
    const configResponse = await axios({
      method: 'delete',
      url: `http://${env.ESADDRESS}/${type}`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return configResponse;
  }

  async _putMappings (type, schema) {
    return this.client.indices.putMapping({
      index: type,
      // type: 'articles',
      body: {
        ...schema
      }
    });
  }

  async initES (req) {
    const log = req.logger;
    log.info('elasticsearch.initES(): Function entry');

    try {
      const allSchemas = {
        articles: configPayload.articles,
        samples: configPayload.samples,
        charts: configPayload.charts,
        images: configPayload.images
      };

      Object.entries(allSchemas).forEach(async ([key, value]) => {
        await this._createConfig(key);
        await this._putMappings(key, value);
      });

      return {
        status: 'Successfully configured schemas!'
      };
    } catch (err) {
      log.error(`elasticsearch.initES(): ${err.status || 500} - ${err}`);
      throw (err);
    }
  }

  async indexDocument (req, type, doc) {
    const log = req.logger;
    if (!type || !doc) {
      const error = new Error('Category type is missing');
      error.statusCode = 400;
      log.error(`indexDocument(): ${error}`);
      throw (error);
    }
    return this.client.index({
      index: type,
      document: { ...doc }
    });
  }

  async refreshIndices (req, type) {
    const log = req.logger;
    if (!type) {
      const error = new Error('Category type is missing');
      error.statusCode = 400;
      log.error(`refreshIndices(): ${error}`);
      throw (error);
    }
    return this.client.indices.refresh({ index: type });
  }

  searchSanitizer (search) {
    let sanitizeSearch = search;
    sanitizeSearch = sanitizeSearch.split(' ').map((word, index) => { // eslint-disable-line
      if (index < 20) {
        if (word.length > 50) {
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

  async search (searchPhrase, autosuggest = false) {
    const phrase = this.searchSanitizer(searchPhrase);
    let url = `http://${env.ESADDRESS}/_all/_search?size=400`;

    if (autosuggest) {
      url = `http://${env.ESADDRESS}/_all/_search?size=100&pretty=true`;
    }

    return axios({
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        query: {
          match: {
            label: {
              query: phrase,
              analyzer: 'standard'
            }
          }
        }
      })
    });
  }

  async loadAllCharts (page, size) {
    const url = `http://${env.ESADDRESS}/charts/_search`;
    return axios({
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        from: ((page - 1) * size),
        size,
        query: {
          match_all: {}
        }
      })
    });
  }
}

module.exports = new ElasticSearch();
