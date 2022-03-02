/* globals jest */

// cleaned SemanticScholar API response, for comparison
export const cleanResponse = {
  ok: true,
  status: 200,
  statusText: 'OK',
  paperId: 'abc',
  title: 'NanoMine schema: A shortened data representation for testing Article View',
  abstract: 'Polymer nanocomposites consist of a polymer matrix and fillers like this is a testing matrix and filler material',
  venue: 'APL Materials',
  year: 2018,
  citationCount: 2,
  isOpenAccess: true,
  authors: [
    {
      authorId: 'abc1',
      name: 'He Zhao'
    },
    {
      authorId: 'abc2',
      name: 'Yixing Wang'
    }
  ],
  authorNames: 'He Zhao, Yixing Wang',
  citations: [
    {
      ok: true,
      status: 200,
      statusText: 'OK',
      paperId: 'def',
      title: 'Bayesian Optimization for testing',
      year: 2019,
      authors: [
        {
          authorId: 'def1',
          name: 'Yichi Zhang'
        },
        {
          authorId: 'def2',
          name: 'D. Apley'
        }
      ],
      authorNames: 'Yichi Zhang, D. Apley'
    },
    {
      paperId: 'ghi',
      title: 'Data-Centric Mixed-Variable Bayesian Optimization For Materials Design',
      year: 2019,
      authors: [
        {
          authorId: 'ghi1',
          name: 'A. Iyer'
        },
        {
          authorId: 'ghi2',
          name: 'Yichi Zhang'
        }
      ],
      authorNames: 'A. Iyer, Yichi Zhang'
    }
  ],
  references: [
    {
      ok: true,
      status: 200,
      statusText: 'OK',
      paperId: 'jkl',
      title: 'A translation approach to portable ontology specifications',
      year: 1993,
      authors: [
        {
          authorId: 'jkl1',
          name: 'T. Gruber'
        }
      ],
      authorNames: 'T. Gruber'
    },
    {
      paperId: 'mno',
      title: 'MatML: An XML for standardizing web-based materials property data',
      year: 2000,
      authors: [
        {
          authorId: 'mno1',
          name: 'E. Begley'
        },
        {
          authorId: 'mno2',
          name: 'C. Sturrock'
        }
      ],
      authorNames: 'E. Begley, C. Sturrock'
    }
  ]
}

// raw response from SemanticScholar API, split into article, references, and citations as
// returned from the REST API.
export const rawResponse = {
  article: {
    paperId: 'abc',
    title: 'NanoMine schema: A shortened data representation for testing Article View',
    abstract: 'Polymer nanocomposites consist of a polymer matrix and fillers like this is a testing matrix and filler material',
    venue: 'APL Materials',
    year: 2018,
    citationCount: 2,
    isOpenAccess: true,
    authors: [
      {
        authorId: 'abc1',
        name: 'He Zhao'
      },
      {
        authorId: 'abc2',
        name: 'Yixing Wang'
      }
    ]
  },
  references: {
    offset: 0,
    data: [
      {
        citedPaper: {
          paperId: 'jkl',
          title: 'A translation approach to portable ontology specifications',
          year: 1993,
          authors: [
            {
              authorId: 'jkl1',
              name: 'T. Gruber'
            }
          ]
        }
      },
      {
        citedPaper: {
          paperId: 'mno',
          title: 'MatML: An XML for standardizing web-based materials property data',
          year: 2000,
          authors: [
            {
              authorId: 'mno1',
              name: 'E. Begley'
            },
            {
              authorId: 'mno2',
              name: 'C. Sturrock'
            }
          ]
        }
      },
      {
        citedPaper: {
          paperId: null,
          title: '',
          year: 2011,
          authors: []
        }
      },
      {
        citedPaper: {
          paperId: null,
          title: 'for Polymer Property Predictor and Database',
          year: null,
          authors: []
        }
      },
      {
        citedPaper: {
          paperId: null,
          title: '',
          year: null,
          authors: []
        }
      }
    ]
  },
  citations: {
    offset: 0,
    data: [
      {
        citingPaper: {
          paperId: 'def',
          title: 'Bayesian Optimization for testing',
          year: 2019,
          authors: [
            {
              authorId: 'def1',
              name: 'Yichi Zhang'
            },
            {
              authorId: 'def2',
              name: 'D. Apley'
            }
          ]
        }
      },
      {
        citingPaper: {
          paperId: 'ghi',
          title: 'Data-Centric Mixed-Variable Bayesian Optimization For Materials Design',
          year: 2019,
          authors: [
            {
              authorId: 'ghi1',
              name: 'A. Iyer'
            },
            {
              authorId: 'ghi2',
              name: 'Yichi Zhang'
            }
          ]
        }
      }
    ]
  }
}

export default {
  // control properties and their setters
  testingData: true,
  __setTestingData: function (value) {
    this.testingData = !!value
  },
  testingRejection: false,
  __setTestingRejection: function (value) {
    this.testingRejection = !!value
  },
  __reset: function () {
    this.testingData = true
    this.testingRejection = false
  },
  /**
   * A mock of @/components/modules/article/articleMetadata.get().
   *
   * Returns complete or empty data, or a rejected promise, depending on the desired
   * testing scenario.
   * @param {*} doi retained for compatibility with the original function
   * @returns complete data, empty data, or a rejected Promise
   */
  get: jest.fn(function ({ doi }) {
    if (this.testingData) {
      return Promise.resolve(cleanResponse)
    } else if (this.testingRejection) {
      return Promise.reject(new Error('Testing rejection of articleMetadata.get() Promise'))
    } else {
      return Promise.resolve()
    }
  })
}
