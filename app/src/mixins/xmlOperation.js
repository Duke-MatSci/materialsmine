import explorerQueryParams from '@/mixins/explorerQueryParams';
import { mapGetters, mapMutations } from 'vuex';
import { XML_FINDER } from '@/modules/gql/xml-gql';
import dialogBox from '@/components/Dialog.vue';

const NULL_INIT = null;
export default {
  data() {
    return {
      xmlFinder: [],
      pageNumber: 1,
      pageSize: 20,
      filterParams: {},
      error: null,
      dialogBoxAction: NULL_INIT
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
    isOwner(xmlUser) {
      return this.isAuth && xmlUser === this.userId;
    },
    editCuration(id, isNew) {
      this.$router.push({
        name: 'EditXmlCuration',
        query: { isNew: isNew, id: id }
      });
    },
    confirmAction() {
      if (this.dialogBoxAction) {
        // TODO (@tee): Check if xml is not ingested into KG before calling `this.dialogBoxAction()` to delete
        // this.dialogBoxAction();
        this.closeDialogBox();
      }
    },
    openDialogBox(id, isNew) {
      if (!id) return;
      this.dialogBoxAction = this.deleteXmlCuration(id, isNew);
      this.toggleDialogBox();
    },
    closeDialogBox() {
      this.dialogBoxAction = NULL_INIT;
      this.toggleDialogBox();
    },
    async deleteXmlCuration(id, isNew = NULL_INIT) {
      if (id && isNew !== null) {
        await this.$store.dispatch('explorer/curation/deleteCuration', {
          xmlId: id,
          isNew: isNew
        });
        await this.$apollo.queries.xmlFinder.refetch();
      }
    },
    updateFilterParams() {
      return this.isAuth && (this.filterParams = { user: this.userId });
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
              // User Portal Page: Show curation based on status depending on a route a user entered.
              ...(this.$route.name === 'ApprovedCuration'
                ? { status: 'Approved' }
                : { status: 'Not_Approved' })
            }
          }
        };
      },
      fetchPolicy: 'cache-first',
      result({ data, loading }) {
        if (!loading && data) this.error = NULL_INIT;
      },
      // TODO (@tee): Put this in the global store action as it is reusable for other gql calls
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
