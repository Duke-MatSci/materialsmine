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
    dialogbox: Dialog
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
      quicksearchkeyword: '',
      chemicalname: '',
      abbreviation: '',
      SMILES: '',
      tradename: '',
      stdname: '',
      density: '',
      uSMILES: '',
      loginRequired: false,
      loginRequiredMsg: '',
      successDlg: false,
      theme: 'dark',
      smilesError: false,
      smilesMessage: '',
      inputStr: '',
      molecularFormula: '',
      chempropsToken: null,
      // https://github.com/reymond-group/smilesDrawer#options
      smilesOptions: {
        Padding: 0.0,
        atomVisualization: 'default', // 'balls',
        explicitHydrogens: true,
        terminalCarbons: true,
        debug: false
      },
      tool: {
        references: [
          '10.1186/s13321-021-00502-6',
          '10.1021/acs.jcim.7b00425'
        ]
      }
    }
  },
  watch: {
    stdname (newData, oldData) {
      if (newData) {
        this.scrollToResult()
      }
    }
  },
  beforeMount: function () {
    // this.auth = new Auth()
  },
  async mounted () {
    let result = await fetch(`${URL}/parser`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    if (result && result.status === 201) {
      result = await result.json()
      if (result.token) this.chempropsToken = result.token
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
      this.stdname = ''
      this.density = ''
      if (this.dialogBoxActive) {
        this.toggleDialogBox()
      }
    },
    successDlgClicked: function () {
      // this.$router.go(-1) // go back to previous page
      this.successDlg = false
    },
    search: function () {
      this.resetOutput()
      if (!this.chempropsToken) {
        this.renderDialog(
          'Search Error',
          'System error, contact our system administrator'
        )
        return
      }
      if (this.pfRadios === 'pol' && this.quicksearchkeyword.trim() !== '') {
        if (this.quicksearchkeyword === '') {
          this.renderDialog(
            'Input Error',
            'Please input the quick search keyword.'
          )
          return
        }
        this.chemicalname = this.quicksearchkeyword
        this.abbreviation = this.quicksearchkeyword
        this.tradename = this.quicksearchkeyword
        this.SMILES = this.quicksearchkeyword
      }
      if (this.chemicalname === '') {
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
      // Axios.request({
      //   url: `${URL}/chemprops?polfil=${this.pfRadios}&nmId=restNmId&chemicalname=${this.chemicalname}&abbreviation=${this.abbreviation}&tradename=${this.tradename}&smiles=${this.SMILES}`,
      //   method: 'get',
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //     Authorization: 'Bearer ' + this.chempropsToken
      //   }
      // })
      fetch(new URL(`${URL}/chemprops?polfil=${this.pfRadios}&nmId=restNmId&chemicalname=${this.chemicalname}&abbreviation=${this.abbreviation}&tradename=${this.tradename}&smiles=${this.SMILES}`),
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.chempropsToken
          }
        }
      )
        .then(function (res) {
          return res
        })
        .then(function (response) {
          this.stdname = response.data.data.StandardName
          this.density = parseFloat(response.data.data.density)
          // show uSMILES if it's polymer search
          if (this.pfRadios === 'pol') {
            this.uSMILES = response.data.data.uSMILES
          }
          // check if stdname is found
          if (this.stdname === '') {
            this.renderDialog(
              'Search Error',
              'No results found. Admin will update the database soon. Please try again in a week.'
            )
            this.resetOutput()
          }
          this.resetLoading()
        })
        .catch(function (error) {
          console.log(error)
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
          if (this.quicksearchkeyword.trim() !== '') {
            this.chemicalname = ''
            this.abbreviation = ''
            this.tradename = ''
            this.SMILES = ''
          }
        })
    },
    onSuccess () {
      this.smilesError = false
    },
    formulaUpdated (formula) {
      this.molecularFormula = formula
    },
    onError (err) {
      console.trace('Error handler called: ')
      if (err) {
        this.smilesMessage = err
      } else {
        this.smilesMessage = 'Undefined error'
      }
      this.smilesError = true
      console.log('SmilesTest - error: ' + this.smilesMessage)
    },
    renderDialog (title, content, minWidth) {
      this.dialog = {
        title,
        content,
        minWidth
      }
      this.toggleDialogBox()
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'ChemProps' })
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
  }
}
