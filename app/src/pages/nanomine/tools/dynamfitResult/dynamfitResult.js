// import Axios from 'axios'
import { mapGetters } from 'vuex'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer'

export default {
  name: 'DynamfitResult',
  components: {
    ReferenceContainer
  },
  data () {
    return {
      resultsError: false,
      resultsErrorMsg: '',
      Eimg: '',
      EEimg: '',
      XPR: '',
      XFF: '',
      XTF: ''
    }
  },
  mounted: function () {
    this.getJobOutputParams()
  },
  computed: {
    ...mapGetters({
      references: 'Dynamfit/references'
    })
  },
  methods: {
    setLoading: function () {
      // this.$store.commit('isLoading')
    },
    resetLoading: function () {
      // this.$store.commit('notLoading')
    },
    getEImage: function () {
      return this.$route.query.ref + '/' + this.Eimg
    },
    getEEImage: function () {
      return this.$route.query.ref + '/' + this.EEimg
    },
    getXPRFile: function () {
      return this.$route.query.ref + '/' + this.XPR
    },
    getXFFFile: function () {
      return this.$route.query.ref + '/' + this.XFF
    },
    getXTFFile: function () {
      return this.$route.query.ref + '/' + this.XTF
    },
    getJobOutputParams: async function () {
      const url = this.$route.query.ref + '/job_output_parameters.json'
      this.setLoading()
      var response
      try {
        response = await fetch(url)
      } catch (err) {
        console.log(err)
        this.resultsErrorMsg = err
        this.resultsError = true
        this.resetLoading()
        return
      }
      var myOutputParams
      try {
        myOutputParams = await response.json()
      } catch (err) {
        console.log(err)
        this.resultsErrorMsg = 'Error retrieving result.'
        this.resultsError = true
        this.resetLoading()
        return
      }
      console.log(myOutputParams)
      this.Eimg = myOutputParams.Eimg
      this.EEimg = myOutputParams.EEimg
      this.XPR = myOutputParams.XPR
      this.XFF = myOutputParams.XFF
      this.XTF = myOutputParams.XTF
      this.resetLoading()
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: 'workspaces',
      name: 'Dynamfit Result'
    })
  }
}
