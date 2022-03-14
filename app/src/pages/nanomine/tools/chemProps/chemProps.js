import { mapGetters, mapMutations } from 'vuex'
// import { Auth } from '@/modules/Auth.js'
import SmilesCanvas from '@/components/nanomine/SmilesCanvas'
import Dialog from '@/components/Dialog'
import MCRToolTemplate from '../MCRToolTemplate/MCRToolTemplate.vue'
const SERVER = `${window.location.origin}/nmr/api`
// const SERVER = `http://localhost:8000/nmr/api`
const URL = SERVER

export default {
  name: 'ChemProps',
  components: {
    SmilesCanvas,
    ToolTemplate: MCRToolTemplate,
    dialogBox: Dialog
  },
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data () {
    return {
      title: 'ChemProps',
      dialog: {
        title: ''
      },
      pfRadios: 'pol',
      quickSearchKeyword: '',
      chemicalName: '',
      abbreviation: '',
      SMILES: '',
      tradename: '',
      standardName: '',
      density: '',
      uSMILES: '',
      auth: {
        // AUTH MOCKED because auth is not yet implemented
        isLoggedIn: () => false,
        isTestUser: () => false
      },
      theme: 'dark',
      inputStr: '',
      molecularFormula: '',
      chemPropsToken: null,
      // https://github.com/reymond-group/smilesDrawer#options
      smilesOptions: {
        Padding: 0.0,
        atomVisualization: 'default', // 'balls',
        explicitHydrogens: true,
        terminalCarbons: true,
        debug: false
      },
      references: [
        '10.1186/s13321-021-00502-6',
        '10.1021/acs.jcim.7b00425'
      ]
    }
  },
  watch: {
    standardName (newData, oldData) {
      if (newData) {
        this.scrollToResult()
      }
    }
  },
  beforeMount: function () {
    // this.auth = new Auth()
  },
  async mounted () {
    if (!this.card) {
      let result = await fetch(`${URL}/parser`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
      if (result && result.status === 201) {
        result = await result.json()
        if (result.token) this.chemPropsToken = result.token
      }
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    scrollToResult () {
      const elem = document.getElementById('chemprops-displayed-result')
      if (elem) {
        setTimeout(function () {
          elem.scrollIntoView()
        }, 800)
      }
    },
    setLoading: function () {
      this.$store.commit('isLoading')
    },
    resetLoading: function () {
      this.$store.commit('notLoading')
    },
    resetOutput: function () {
      this.standardName = ''
      this.density = ''
      if (this.dialogBoxActive) {
        this.toggleDialogBox()
      }
    },
    search: function () {
      this.resetOutput()
      if (!this.chemPropsToken) {
        this.renderDialog(
          'Search Error',
          'System error, contact our system administrator'
        )
        return
      }
      if (this.pfRadios === 'pol' && this.quickSearchKeyword.trim() !== '') {
        if (this.quickSearchKeyword === '') {
          this.renderDialog(
            'Input Error',
            'Please input the quick search keyword.'
          )
          return
        }
        this.chemicalName = this.quickSearchKeyword
        this.abbreviation = this.quickSearchKeyword
        this.tradename = this.quickSearchKeyword
        this.SMILES = this.quickSearchKeyword
      }
      if (this.chemicalName === '') {
        this.renderDialog(
          'Input Error',
          'Please input the chemical name.'
        )
        return
      }
      if (this.pfRadios === '') {
        this.renderDialog(
          'Input Error',
          'Please select the collection.'
        )
        return
      }
      // TODO need to configure after nmcp API done
      this.setLoading()
      fetch(new URL(`${URL}/chemprops?polfil=${this.pfRadios}&nmId=restNmId&chemicalname=${this.chemicalName}&abbreviation=${this.abbreviation}&tradename=${this.tradename}&smiles=${this.SMILES}`),
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.chemPropsToken
          }
        }
      )
        .then(function (res) {
          return res
        })
        .then(function (response) {
          this.standardName = response.data.data.StandardName
          this.density = parseFloat(response.data.data.density)
          // show uSMILES if it's polymer search
          if (this.pfRadios === 'pol') {
            this.uSMILES = response.data.data.uSMILES
          }
          // check if standardName is found
          if (this.standardName === '') {
            this.renderDialog(
              'Search Error',
              'No results found. Admin will update the database soon. Please try again in a week.'
            )
            this.resetOutput()
          }
          this.resetLoading()
        })
        .catch(function (error) {
          this.resetOutput()
          if (error.message.includes('404')) {
            this.renderDialog(
              'Search Error',
              'No results found. Admin will update the database soon. Please try again in a week.'
            )
          } else {
            this.renderDialog(
              'Search Error',
              'An exception occurred when calling the ChemProps API service.'
            )
          }
          this.resetLoading()
        })
        .then(function () {
        // always executed
          this.inputStr = this.uSMILES
          // reset input if using quick search
          if (this.quickSearchKeyword.trim() !== '') {
            this.chemicalName = ''
            this.abbreviation = ''
            this.tradename = ''
            this.SMILES = ''
          }
        })
    },
    formulaUpdated (formula) {
      this.molecularFormula = formula
    },
    onError (err) {
      let smilesMessage
      if (err) {
        smilesMessage = err
      } else {
        smilesMessage = 'Undefined error'
      }
      this.renderDialog('SMILES error', smilesMessage)
    },
    renderDialog (title, content) {
      this.dialog = {
        title,
        content
      }
      this.toggleDialogBox()
    }
  },
  created () {
    if (!this.card) {
      this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'ChemProps' })
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
  }
}
