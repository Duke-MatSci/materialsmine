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
   * @param {Object} req
   * @param {String} type
   * @returns response
   */
  async deleteIndexDocs (req, type) {
    const log = req.logger;
    log.info('elasticsearch.deleteIndexDocs(): Function entry');
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

  async deleteSingleDoc (req, type, identifier) {
    const log = req.logger;
    log.info('elasticsearch.deleteSingleDoc(): Function entry');
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
    return await this.client.indices.putMapping({
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

    // Remove elastic search index config from list of keys
    const preparedKeys = Object.keys(configPayload)?.filter(
      (e) => e !== 'config'
    );

    // Create a set of existing indices
    const existingIndicesSet = new Set(
      existingIndexes.map((index) => index.index)
    );
    const nonExistingKeys = [];
    // Check if all indices in indices exist in existingIndicesSet
    const allIndicesExist = preparedKeys.every((index) => {
      const exists = existingIndicesSet.has(index);
      if (!exists) nonExistingKeys.push(index);
      return exists;
    });

    if (allIndicesExist) {
      log.info('elasticsearch.initES(): All indexes exist in Elastic search');
      return;
    }

    if (nonExistingKeys.length) {
      log.info(
        `elasticsearch.initES(): Adding the following missing index(es) ${nonExistingKeys.join(
          ','
        )}`
      );
    }

    try {
      Object.entries(configPayload).forEach(async ([key, value]) => {
        if (nonExistingKeys.includes(key)) {
          try {
            await this._createConfig(key);
            await this._putMappings(key, value);
          } catch (error) {
            console.log(error);
            log.error(
              `elasticsearch.initES(): ${error.status || 500} - ${error}`
            );
          }
        }
      });

      return {
        status: 'Successfully configured schemas!'
      };
    } catch (err) {
      log.error(`elasticsearch.initES(): ${err.status || 500} - ${err}`);
      throw err;
    }
  }

  async indexDocument (req, type, doc) {
    req.logger.info('elasticsearch.indexDocument(): Function entry');
    const log = req.logger;
    if (!type || !doc) {
      const error = new Error('Category type is missing');
      error.statusCode = 400;
      log.error(`indexDocument(): ${error}`);
      throw error;
    }
    return this.client.index({
      index: type,
      refresh: true,
      document: { ...doc }
    });
  }

  async refreshIndices (req, type) {
    req.logger.info('elasticsearch.refreshIndices(): Function entry');
    const log = req.logger;
    if (!type) {
      const error = new Error('Category type is missing');
      error.statusCode = 400;
      log.error(`refreshIndices(): ${error}`);
      throw error;
    }
    return this.client.indices.refresh({ index: type });
  }

  searchSanitizer (search) {
    let sanitizeSearch = search;
    sanitizeSearch = sanitizeSearch
      .split(' ')
      // eslint-disable-next-line array-callback-return
      .map((word, index) => {
        // eslint-disable-line
        if (index < 20) {
          if (word.length > 50) {
            return word.substr(0, 75);
          }
          return word;
        }
      })
      .join(' ');

    // if (sanitizeSearch.match(/"|\*|\s|\/|:|\./)) {
    if (sanitizeSearch.match(/"|\*|\/|:|\./)) {
      sanitizeSearch = `${sanitizeSearch}\\*`;
    }
    return sanitizeSearch;
  }

  async searchType (req, searchPhrase, searchField, type, page = 1, size = 20) {
    req.logger.info('elasticsearch.searchType(): Function entry');
    // TODO: use searchField to change which field is queried
    const phrase = this.searchSanitizer(searchPhrase);
    const url = `http://${env.ESADDRESS}/${type}/_search?size=${size}`;
    const response = await axios({
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        from: (page - 1) * size,
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
    return response;
  }

  async search (req, searchPhrase, autosuggest = false) {
    req.logger.info('elasticsearch.search(): Function entry');
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
                match: {
                  label: phrase
                }
              },
              {
                match: {
                  description: phrase
                }
              }
            ]
          }
        }
      })
    });
  }

  async loadAllCharts (req, page, size) {
    req.logger.info('elasticsearch.loadAllCharts(): Function entry');
    const url = `http://${env.ESADDRESS}/charts/_search`;
    return axios({
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        from: (page - 1) * size,
        size,
        query: {
          match_all: {}
        }
      })
    });
  }

  async loadAllDatasets (req, page, size) {
    req.logger.info('elasticsearch.loadAllDatasets(): Function entry');
    const url = `http://${env.ESADDRESS}/datasets/_search`;
    return axios({
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        from: (page - 1) * size,
        size,
        query: {
          match_all: {}
        }
      })
    });
  }

  async searchKnowledgeGraph (req, searchPhrase) {
    req.logger.info('elasticsearch.searchKnowledgeGraph(): Function entry');
    // search knowledge index for key
    const result = await this.client.search({
      index: 'knowledge',
      body: {
        query: {
          match_phrase: {
            label: searchPhrase
          }
        }
      }
    });
    return result.hits.hits;
  }

  async createKnowledgeGraphDoc (req, _id, label, result) {
    req.logger.info('elasticsearch.createKnowledgeGraphDoc(): Function entry');
    // create new doc under knowledge index
    const url = `http://${env.ESADDRESS}/knowledge/_update/${_id}`;
    return await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        doc: {
          label,
          response: result,
          date: new Date().toISOString().slice(0, 10)
        },
        doc_as_upsert: true
      })
    });
  }
}

module.exports = new ElasticSearch();
