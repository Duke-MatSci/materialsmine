import { mapGetters, mapMutations } from 'vuex'
import SmilesCanvas from '@/components/nanomine/SmilesCanvas'
import Dialog from '@/components/Dialog'

export default {
  name: 'ChemProps',
  components: {
    SmilesCanvas,
    dialogBox: Dialog
  },
  data () {
    return {
      title: 'ChemProps',
      loading: false,
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
      tokenVisible: false,
      theme: 'dark',
      inputStr: '',
      molecularFormula: '',
      smilesOptions: {
        Padding: 0.0,
        atomVisualization: 'default', // 'balls',
        explicitHydrogens: true,
        terminalCarbons: true,
        debug: false
      },
      references: ['10.1186/s13321-021-00502-6', '10.1021/acs.jcim.7b00425']
    }
  },
  watch: {
    standardName (newData) {
      if (newData) {
        this.scrollToResult()
      }
    }
  },
  created () {
    if (!this.card) {
      this.$store.commit('setAppHeaderInfo', {
        icon: 'workspaces',
        name: 'ChemProps'
      })
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      token: 'auth/token',
      isAuth: 'auth/isAuthenticated'
    }),
    isQuickSearch () {
      return this.pfRadios === 'pol' && this.quickSearchKeyword.trim() !== ''
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    showToken () {
      if (!this.isAuth) {
        return this.$store.commit('setSnackbar', {
          message: 'Unauthorized User',
          duration: 4000
        })
      }
      this.tokenVisible = !this.tokenVisible
    },
    async copyContent () {
      try {
        await navigator.clipboard.writeText(this.token)
        this.$store.commit('setSnackbar', {
          message: 'Token copied successfully',
          duration: 4000
        })
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.copyContent()
        })
      }
    },
    scrollToResult () {
      const elem = document.getElementById('chemprops-displayed-result')
      if (elem) {
        setTimeout(function () {
          elem.scrollIntoView()
        }, 800)
      }
    },
    resetOutput: function () {
      this.standardName = ''
      this.density = ''
      if (this.dialogBoxActive) {
        this.toggleDialogBox()
      }
    },
    search: async function () {
      this.resetOutput()
      if (!this.token) {
        this.renderDialog(
          'Search Error',
          'System error, contact our system administrator'
        )
        return
      }
      // validate form
      const ChemicalName = this.isQuickSearch
        ? this.quickSearchKeyword
        : this.chemicalName
      const Abbreviation = this.isQuickSearch
        ? this.quickSearchKeyword
        : this.abbreviation
      const TradeName = this.isQuickSearch
        ? this.quickSearchKeyword
        : this.tradename
      const SMILES = this.isQuickSearch ? this.quickSearchKeyword : this.SMILES
      const nmId = this.references[0]

      // const inputError =
      if (!ChemicalName || !this.pfRadios) {
        const inputError = !this.chemicalName
          ? 'Please input the chemical name.'
          : 'Please select the collection.'
        return this.renderDialog('Input Error', inputError)
      }
      // TODO need to configure after nmcp API done
      try {
        this.loading = true
        const body = JSON.stringify({
          polfil: this.pfRadios,
          ChemicalName,
          Abbreviation,
          TradeName,
          SMILES,
          nmId
        })
        const request = await fetch('/api/mn/chemprops', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token
          },
          body
        })
        const response = await request.json()
        if (request.status !== 200 || !response) {
          const message = response?.message ?? 'Something went wrong'
          throw new Error(message)
        }

        this.standardName = response?.data?.StandardName
        this.density = parseFloat(response?.data?.density)
        if (this.pfRadios === 'pol') {
          this.uSMILES = response?.data?.uSMILES
        }

        if (this.standardName === '') {
          this.renderDialog(
            'Search Error',
            'No results found. Admin will update the database soon. Please try again in a week.'
          )
          this.resetOutput()
        }
      } catch (error) {
        this.resetOutput()
        if (error.message.includes('404')) {
          this.renderDialog(
            'Search Error',
            'No results found. Admin will update the database soon. Please try again in a week.'
          )
        } else {
          this.renderDialog('Search Error', error?.message)
        }
      } finally {
        this.loading = false
        this.inputStr = this.uSMILES
      }
    },
    formulaUpdated (formula) {
      this.molecularFormula = formula
    },
    onError (err) {
      this.renderDialog('SMILES error', err ?? 'Undefined error')
    },
    renderDialog (title, content) {
      this.dialog = {
        title,
        content
      }
      this.toggleDialogBox()
    }
  }
}
