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
   * Deletes all documents of an index
   * @param {String} type
   * @returns response
   */
  async deleteIndexDocs (type) {
    return this.client.deleteByQuery({
      index: type,
      body: {
        query: {
          match_all: {}
        }
      },
      timeout: '5m' // Todo: Increase when data becomes larger
    });
  }

  async deleteSingleDoc (type, identifier) {
    return this.client.deleteByQuery({
      index: type,
      body: {
        query: {
          match_phrase: {
            identifier
          }
        }
      }
    });
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

  async _getExistingIndices () {
    return await this.client.cat.indices({ format: 'json' });
  }

  async initES (req) {
    const log = req.logger;
    log.info('elasticsearch.initES(): Function entry');

    // Check and ignore existing indexes before create
    const existingIndexes = await this._getExistingIndices();
    if (existingIndexes.length >= Object.keys(configPayload).length) {
      log.info('elasticsearch.initES(): All indexes exist in Elastic search');
      return;
    }

    // Remove elastic search index config from list of keys
    let preparedKeys = Object.keys(configPayload)?.filter(e => e !== 'config');
    if (existingIndexes.length) {
      preparedKeys = preparedKeys.filter(preppedKey => !existingIndexes.some(existingIndex => (existingIndex?.index === preppedKey)));
      log.info(`elasticsearch.initES(): Adding the following missing index(es) ${preparedKeys.join(',')}`);
    }

    try {
      Object.entries(configPayload).forEach(async ([key, value]) => {
        if (preparedKeys.includes(key)) {
          await this._createConfig(key);
          await this._putMappings(key, value);
        }
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

    // if (sanitizeSearch.match(/"|\*|\s|\/|:|\./)) {
    if (sanitizeSearch.match(/"|\*|\/|:|\./)) {
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
          bool: {
            should: [
              {
                match_phrase: {
                  label: phrase
                }
              },
              {
                match_phrase: {
                  description: phrase
                }
              }
            ]
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
