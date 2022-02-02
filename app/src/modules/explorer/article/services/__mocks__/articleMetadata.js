/* globals jest */
function getResponse (doi) {
  return {
    paperId: 'abc',
    title: 'NanoMine schema: A shortened data representation for testing Article View',
    abstract: 'Polymer nanocomposites consist of a polymer matrix and fillers like this is a testing matrix and filler material',
    venue: 'APL Materials',
    year: 2018,
    citationCount: 2,
    isOpenAccess: true,
    mockDOI: doi,
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
}

export const response = getResponse('')

export default {
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
  get: jest.fn(function ({ doi }) {
    if (this.testingData) {
      return Promise.resolve(getResponse(doi))
    } else if (this.testingRejection) {
      return Promise.reject(new Error('Testing rejection of fetch(article) Promise'))
    } else {
      return Promise.resolve()
    }
  })
}
