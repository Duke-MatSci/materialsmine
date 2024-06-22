import explorerQueryParams from '@/mixins/explorerQueryParams';
import { mapGetters, mapMutations } from 'vuex';
import { XML_FINDER } from '@/modules/gql/xml-gql';
import dialogBox from '@/components/Dialog.vue';

export default {
  data() {
    return {
      xmlFinder: [],
      pageNumber: 1,
      pageSize: 20,
      filterParams: {},
      error: null,
      dialogBoxAction: null
    };
  },
  components: {
    dialogBox
  },
  computed: {
    ...mapGetters({
      isAuth: 'auth/isAuthenticated',
      isAdmin: 'auth/isAdmin',
      userId: 'auth/userId',
      dialogBoxActive: 'dialogBox'
    })
  },

  mixins: [explorerQueryParams],
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    isAuthorized(xmlUser) {
      return this.isAuth && (xmlUser === this.userId || this.isAdmin);
    },
    editCuration(id, isNew) {
      this.$router.push({
        name: 'EditXmlCuration',
        query: { isNew: isNew, id: id }
      });
    },
    confirmAction() {
      if (this.dialogBoxAction) {
        this.dialogBoxAction();
        this.closeDialogBox();
      }
    },
    openDialogBox(id, isNew, func = null) {
      if (!id) return;
      this.dialogBoxAction = !func
        ? () => this.deleteXmlCuration(id, isNew)
        : func;
      if (!this.dialogBoxActive) {
        this.toggleDialogBox();
      }
    },
    closeDialogBox() {
      if (this.dialogBoxActive) {
        this.toggleDialogBox();
      }
      this.dialogBoxAction = null;
    },
    async deleteXmlCuration(id, isNew = null) {
      if (id && isNew !== null) {
        await this.$store.dispatch('explorer/curation/deleteCuration', {
          xmlId: id,
          isNew: isNew
        });
        await this.$apollo.queries.xmlFinder.refetch();
      }
    },
    setApprovalStatus() {
      // return approvalStatus
      switch (this.$route.name) {
        case 'CuratedXML':
          return 'Not_Approved';
        case 'ApprovedCuration':
          return 'Approved';
        default:
          return null;
      }
    },
    updateFilterParams() {
      if (!this.isAdmin) {
        this.filterParams = { user: this.userId };
      }
    }
  },
  apollo: {
    xmlFinder: {
      query: XML_FINDER,
      variables() {
        this.updateFilterParams();
        return {
          input: {
            pageNumber: this.pageNumber,
            pageSize: parseInt(this.pageSize),
            filter: {
              param: this.$route.query?.q,
              ...this.filterParams,
              status: this.setApprovalStatus()
            }
          }
        };
      },
      fetchPolicy: 'cache-first',
      result({ data, loading }) {
        if (!loading && data) this.error = null;
      },
      error(error) {
        if (error.networkError) {
          const err = error.networkError;
          this.error = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`;
        } else if (error.graphQLErrors) {
          this.error = error.graphQLErrors;
        }
        this.$store.commit('setSnackbar', {
          message: this.error,
          duration: 10000
        });
      }
    }
  }
};
