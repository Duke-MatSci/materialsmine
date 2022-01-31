import Sample from '@/pages/explorer/Sample.vue'
import SampleHeader from '@/components/explorer/SampleHeader.vue'
import SampleImages from '@/components/explorer/SampleImages.vue'
import MaterialComponentsAndAttributes from '@/components/explorer/MaterialComponentsAndAttributes.vue'
import CuratedProcessingStepsParameters from '@/components/explorer/CuratedProcessingStepsParameters.vue'
import OtherSamples from '@/components/explorer/OtherSamples.vue'
import CuratedPropertiesOfNanocompositeSample from '@/components/explorer/CuratedPropertiesOfNanocompositeSample.vue'

import VueRouter from 'vue-router'
import Vuex from 'vuex'
import { createLocalVue, mount, shallowMount } from '@vue/test-utils'

// Data extracted from keyword l382-s2-huang-2019

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(Vuex)

const store = new Vuex.Store()
const router = new VueRouter()

describe('Sample.vue', () => {
  let wrapper = null

  beforeAll(() => {
    wrapper = mount(Sample, {
      localVue,
      store,
      router
    })
  })

  it('mounts sample header component to Sample page', () => {
    expect(wrapper.findComponent(SampleHeader)).toBeTruthy()
  })

  it('mounts sample images component to Sample page', () => {
    expect(wrapper.findComponent(SampleImages)).toBeTruthy()
  })

  it('mounts material components and attributes component to Sample page', () => {
    expect(wrapper.findComponent(MaterialComponentsAndAttributes)).toBeTruthy()
  })

  it('mounts curated processing steps parameters component to Sample page', () => {
    expect(
      wrapper.findComponent(CuratedProcessingStepsParameters)
    ).toBeTruthy()
  })

  it('mounts other samples component to Sample page', () => {
    expect(wrapper.findComponent(OtherSamples)).toBeTruthy()
  })

  it('mounts curated properties of nanocomposite sample component to Sample page', () => {
    expect(
      wrapper.findComponent(CuratedPropertiesOfNanocompositeSample)
    ).toBeTruthy()
  })
})

describe('SampleHeader.vue', () => {
  it('renders loading placeholder for sample header', async () => {
    const wrapper = shallowMount(SampleHeader, {
      localVue,
      store,
      router
    })
    expect(wrapper.vm.$data.loading).toBe(true)
  })

  it('renders sample header', async () => {
    const wrapper = shallowMount(SampleHeader, {
      localVue,
      store,
      router
    })
    // set sample data
    await wrapper.setData({
      sample: {
        DOI: '10.1021/acs.macromol.8b02071',
        sample_label: 'gold nanoparticle in PS(40 kDa)-b-P4VP(5.6 kDa)'
      },
      loading: false
    })

    expect(
      wrapper.findComponent('[data-test="sample_label"]').text()
    ).toContain('gold nanoparticle in PS(40 kDa)-b-P4VP(5.6 kDa)')
    expect(wrapper.findComponent('[data-test="DOI"]').text()).toContain(
      '10.1021/acs.macromol.8b02071'
    )
  })
})

describe('SampleImages.vue', () => {
  it('renders loading placeholder for sample images', async () => {
    const wrapper = shallowMount(SampleImages, {
      localVue,
      store,
      router
    })
    expect(wrapper.vm.$data.loading).toBe(true)
  })

  it('renders sample images', async () => {
    const wrapper = shallowMount(SampleImages, {
      localVue,
      store,
      router
    })
    await wrapper.setData({
      images: [
        {
          alt: 'http://materialsmine.org/sample/l382-s2-huang-2019',
          src: 'https://qa.materialsmine.org/nmr/blob?id=5ed680a88d37da6c5907a969'
        }
      ],
      loading: false
    })
    // console.log(
    //   wrapper.findComponent('[data-test="sample_image"]').attributes()
    // );
    expect(
      wrapper.findComponent('[data-test="sample_image"]').html()
    ).toContain(
      '<img src="https://qa.materialsmine.org/nmr/blob?id=5ed680a88d37da6c5907a969" alt="http://materialsmine.org/sample/l382-s2-huang-2019">'
    )
  })
})

describe('MaterialComponentsAndAttributes.vue', () => {
  it('renders loading placeholder for material components', async () => {
    const wrapper = shallowMount(MaterialComponentsAndAttributes, {
      localVue,
      store,
      router
    })
    expect(wrapper.vm.$data.loading).toBe(true)
  })

  it('renders material components', async () => {
    const wrapper = shallowMount(MaterialComponentsAndAttributes, {
      localVue,
      store,
      router
    })
    await wrapper.setData({
      materialsData: [
        {
          classType: 'Gold',
          role: 'Filler',
          materialProperties: [
            {
              type: 'Density',
              units: 'Gram per Cubic Centimeter',
              value: 19.3
            }
          ]
        }
      ],
      loading: false
    })
    expect(
      wrapper.findComponent('[data-test="material-properties"]').text()
    ).toContain('Gold')
  })
})
