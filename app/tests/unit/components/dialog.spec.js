import VueMaterial from 'vue-material'
import { enableAutoDestroy, createLocalVue, shallowMount } from '@vue/test-utils'
import Dialog from '@/components/Dialog.vue'


describe('@/components/Dialog.vue', () => {
    let wrapper;

    beforeEach(async () => {
        const localVue = await createLocalVue()
        localVue.use(VueMaterial)
        wrapper = shallowMount(Dialog, {
          localVue
        })
    })

    enableAutoDestroy(afterEach)

    it('check dialog box exist', () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('renders props.msg when passed', async() => {
      const testProps = {
        active: false,
        cancelTextBtn: 'Disagree',
        confirmTextBtn: 'Agree',
        textContent: `Testing <strong>Materialsmine</strong>.`,
        dialogTitle: 'Dialog Box'
      }
      await wrapper.setProps({...testProps})
      expect(wrapper.props('active')).toBe(testProps.active)
      expect(wrapper.props('cancelTextBtn')).toBe(testProps.cancelTextBtn)
      expect(wrapper.props('confirmTextBtn')).toBe(testProps.confirmTextBtn)
      expect(wrapper.props('textContent')).toBe(testProps.textContent)
      expect(wrapper.props('dialogTitle')).toBe(testProps.dialogTitle)
    })
})