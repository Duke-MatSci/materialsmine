import { CONTACT_INQUIRY_QUERY, CONTACT_UPDATE_QUERY } from '@/modules/gql/contact-gql'
import apollo from '@/modules/gql/apolloClient'

export default {
  async loadItems (context, payload) {
    context.commit('setIsLoading', true)
    context.commit('setDisplayedInquiry', null)
    try {
      const response = await apollo.query({
        query: CONTACT_INQUIRY_QUERY,
        variables: { input: { resolved: payload.showResolved, pageNumber: payload.page, pageSize: payload.pageSize } },
        fetchPolicy: 'no-cache'
      })

      if (!response) {
        const error = new Error('Something went wrong!')
        throw error
      }

      const result = response?.data?.contacts
      context.commit('setContactInquiries', result?.data ?? [])
      context.commit('setPageNumber', result?.pageNumber ?? 1)
      context.commit('setTotalPages', result?.totalPages ?? 1)
    } catch (error) {
      const snackbar = {
        message: 'Something went wrong!',
        action: () => context.dispatch('loadItems', payload)
      }
      context.commit('setSnackbar', snackbar, { root: true })
    } finally {
      context.commit('setIsLoading', false)
    }
  },

  async send (context, payload) {
    if (!context.getters.getId || !context.getters.getMessage) return

    try {
      context.commit('setContentEditable', false)
      await apollo.mutate({
        mutation: CONTACT_UPDATE_QUERY,
        variables: {
          input: {
            contactId: context.getters.getId,
            resolved: payload || false,
            response: context.getters.getFormattedMessage
          }
        }
      })
      context.commit('setSnackbar', { message: 'Inquiry Reply Successful' }, { root: true })
      if (payload) await context.dispatch('loadItems', context.getters.getPageNumber)
      context.dispatch('renderDialog', null)
    } catch (error) {
      const snackbar = {
        message: 'Something went wrong!',
        action: () => context.dispatch('send', payload)
      }
      context.commit('setSnackbar', snackbar, { root: true })
    } finally {
      context.commit('setContentEditable', true)
    }
  },
  renderDialog (context, payload) {
    context.commit('setId', payload)
    context.commit('setMessage', null)
    context.commit('setDialogBox', null, { root: true })
  }
}
