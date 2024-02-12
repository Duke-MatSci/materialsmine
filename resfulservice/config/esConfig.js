/**
 * Elastic search index config
 */
exports.config = {
  settings: {
    number_of_shards: 8,
    analysis: {
      filter: {
        autocomplete_filter: {
          type: 'edge_ngram',
          min_gram: 3,
          max_gram: 20
        }
      },
      analyzer: {
        autocomplete: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'autocomplete_filter']
        }
      }
    }
  }
};

/**
 * Article: Elastic search mappings.
 */
exports.articles = {
  properties: {
    label: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    identifier: {
      type: 'text'
    }
  }
};

/**
 * Images: Elastic search mappings.
 */
exports.images = {
  properties: {
    label: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    identifier: {
      type: 'text'
    }
  }
};

/**
 * Samples: Elastic search mappings.
 */
exports.samples = {
  properties: {
    label: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    identifier: {
      type: 'text'
    },
    thumbnail: {
      type: 'text'
    }
  }
};

/**
 * Charts: Elastic search mappings.
 */
exports.charts = {
  properties: {
    label: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    identifier: {
      type: 'text'
    },
    thumbnail: {
      type: 'text'
    },
    description: {
      type: 'text',
      analyzer: 'autocomplete'
    }
  }
};

/**
 * Datasets: Elastic search mappings.
 */
exports.datasets = {
  properties: {
    label: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    identifier: {
      type: 'text'
    },
    thumbnail: {
      type: 'text'
    },
    description: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    doi: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    organization: {
      type: 'text',
      analyzer: 'autocomplete',
      fields: {
        raw: {
          type: 'keyword'
        }
      }
    },
    distributions: {
      type: 'text'
    }
  }
};

/**
 * Knowledge: Elastic search mappings.
 */
exports.knowledge = {
  properties: {
    label: {
      type: 'text',
      analyzer: 'autocomplete'
    },
    response: {
      type: 'object',
      dynamic: true,
      properties: {
        head: {
          type: 'nested', // Define head as nested object
          dynamic: true
        },
        results: {
          type: 'nested', // Define results as nested object
          dynamic: true
        }
      }
    },
    date: {
      type: 'date'
    }
  }
};
