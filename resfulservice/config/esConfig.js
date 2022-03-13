/**
 * Elastic search index config
 */
module.exports = config = { 
    settings: { 
        number_of_shards: 2, 
        analysis: { 
            filter: { 
                autocomplete_filter: { 
                    "type": "edge_ngram", 
                    "min_gram": 3, 
                    "max_gram": 20 
                } 
            }, 
            analyzer: { 
                autocomplete: { 
                    type: "custom", 
                    tokenizer: "standard", 
                    filter: [ 
                        "lowercase", 
                        "autocomplete_filter" 
                    ] 
                } 
            } 
        } 
    } 
};

/**
 * Article: Elastic search mappings.
 */
 module.exports = article = {
    articles: {
        properties: {
            label: {
                type: "string",
                analyzer: "autocomplete"
            }, 
            identifier: {
                type:    "string"
            }
        }
    }
}