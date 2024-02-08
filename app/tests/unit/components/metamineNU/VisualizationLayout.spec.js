import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import VLayour from '@/components/metamine/visualizationNU/VisualizationLayout.vue'
import store from '@/store/index.js'

describe('VisualizationLayout.vue', () => {
  let wrapper
  const slots = {
    main_chart: ['<header>Test Title</header>'],
    subcharts: ['<p>Testing</p>'],
    side_tools: ['<button>Test Close</button>']
  }
  const props = {
    link: { to: '/mm', text: 'Pairwise' },
    dense: false
  }
  const dispatch = jest.spyOn(store, 'dispatch')
  const commitSpy = jest.spyOn(store, 'commit')
  global.fetch = jest
    .fn()
    .mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve(mockValues) })
    )
    .mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve(mockValues2) })
    )
    .mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve(mockValues2) })
    )
    .mockImplementation(() => {})

  beforeEach(async () => {
    wrapper = await createWrapper(VLayour, { slots, props }, false)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
    await jest.resetAllMocks()
  })

  it('makes a fetch call when mounted ', () => {
    expect.assertions(12)
    expect(wrapper.exists()).toBe(true)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(commitSpy).toHaveBeenCalledTimes(5)
    expect(commitSpy).toHaveBeenNthCalledWith(
      1,
      'metamineNU/setRefreshStatus',
      true
    )
    expect(commitSpy).toHaveBeenNthCalledWith(
      2,
      'metamineNU/setLoadingState',
      true,
      undefined
    )
    expect(commitSpy).toHaveBeenNthCalledWith(
      3,
      'metamineNU/setFetchedNames',
      [],
      undefined
    )
    expect(commitSpy).toHaveBeenNthCalledWith(
      4,
      'metamineNU/setDataPoint',
      [],
      undefined
    )
    expect(commitSpy).toHaveBeenNthCalledWith(
      5,
      'metamineNU/setDatasets',
      [],
      undefined
    )

    expect(fetch).toHaveBeenCalledTimes(1 + mockValues.fetchedNames.length)
    // check initial fetch request
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/files/metamine')
    for (let i = 0; i < mockValues.fetchedNames.length; i++) {
      expect(fetch).toHaveBeenNthCalledWith(
        i + 2,
        `/api/files/metamine/${mockValues.fetchedNames[i].name}`
      )
    }
  })

  it('renders layout properly ', () => {
    expect(wrapper.find('div.main.tool_page').exists()).toBe(true)
    expect(wrapper.find('div.main > div.adjust-padding').exists()).toBe(true)
    const mainContent = wrapper.find('div.main > div.adjust-padding')
    expect(mainContent.exists()).toBe(true)

    const mainChart = mainContent.find(
      'div.viz-u-postion__rel.histogram-chart.md-layout-item.md-size-50.md-medium-size-100.viz-u-mgbottom-big'
    )
    expect(mainChart.exists()).toBe(true)
    expect(mainChart.find('header').text()).toBe('Test Title')
    const subChart = mainContent.find(
      'div.md-layout.md-layout-item.md-size-20.md-medium-size-100.u--layout-flex.u--layout-flex-justify-sb.u_centralize_items.utility-roverflow'
    )
    expect(subChart.exists()).toBe(true)
    expect(subChart.find('p').text()).toBe('Testing')
    const sideTools = mainContent.find(
      'div.side-tools.md-size-30.md-medium-size-100.md-layout-item.md-card-header.viz-u-display__show'
    )
    expect(sideTools.exists()).toBe(true)
    expect(sideTools.find('button').text()).toBe('Test Close')
  })

  it('renders button properly ', () => {
    const button = wrapper.find('div.main > div.adjust-padding > div > button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('class')).toBe('nuplot-button-link')
    expect(button.findComponent(RouterLinkStub).props().to).toBe(props.link.to)
    expect(button.findComponent(RouterLinkStub).text()).toBe(props.link.text)
  })

  it('hides side nav', async () => {
    const commitSpy = jest.spyOn(wrapper.vm.$store, 'commit')
    const nav = wrapper.vm.showSide

    await wrapper.vm.hideSide()
    expect(wrapper.vm.showSide).toBe(!nav)
    expect(commitSpy).toHaveBeenCalledTimes(3)
    expect(commitSpy).toHaveBeenNthCalledWith(
      2,
      'metamineNU/setLoadingState',
      true
    )
    expect(commitSpy).toHaveBeenNthCalledWith(
      3,
      'metamineNU/setLoadingState',
      false
    )
  })
})

const mockValues = {
  fetchedNames: [
    {
      key: 0,
      bucket_name: 'metamine',
      name: 'lattice_2d_sample.csv.csv',
      color: '#FFB347'
    },
    {
      key: 1,
      bucket_name: 'metamine',
      name: 'freeform_2d_sample.csv.csv',
      color: '#8A8BD0'
    }
  ]
}

const mockValues2 = {
  fetchedData: [
    {
      field1: '0',
      symmetry: 'C2v',
      unit_cell_x_pixels: '50',
      unit_cell_y_pixels: '50',
      geometry_full:
        '1111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111',
      condition: 'Plane Strain',
      C11: '90623239.99',
      C12: '2093444.168',
      C22: '90623239.99',
      C16: '0',
      C26: '0',
      C66: '88309.93157',
      CM0_E: '1.00E-09',
      'CM0_nu\t': '',
      CM1_E: '2240000000',
      CM1_nu: '0.49253731',
      youngs:
        '[90574880.33650465 89842899.57835576 87626117.20248799 83865234.01354808\n 78473858.03428507 71363376.30564871 62490687.96584841 51940886.46613767\n 40052794.89630961 27572194.13238318 15762794.27006275  6333722.92458005\n  1044019.62898206  1044019.62898206  6333722.92458008 15762794.27006275\n 27572194.13238318 40052794.89630964 51940886.4661377  62490687.96584844\n 71363376.30564868 78473858.03428504 83865234.01354808 87626117.20248798\n 89842899.57835576 90574880.33650465 89842899.57835573 87626117.20248781\n 83865234.0135479  78473858.03428486 71363376.30564846 62490687.96584817\n 51940886.46613741 40052794.89630937 27572194.13238295 15762794.27006265\n  6333722.92458002  1044019.62898205  1044019.62898206  6333722.92458006\n 15762794.27006262 27572194.13238299 40052794.89630942 51940886.46613746\n 62490687.96584821 71363376.30564854 78473858.03428489 83865234.01354791\n 87626117.20248789 89842899.57835571 90574880.33650465 89842899.57835576\n 87626117.20248796 83865234.01354803 78473858.03428507 71363376.30564865\n 62490687.96584835 51940886.46613767 40052794.89630961 27572194.13238313\n 15762794.27006271  6333722.92458001  1044019.62898206  1044019.62898207\n  6333722.92458009 15762794.27006274 27572194.13238325 40052794.8963096\n 51940886.46613779 62490687.96584845 71363376.30564868 78473858.03428508\n 83865234.01354808 87626117.20248798 89842899.57835576 90574880.33650465\n 89842899.57835573 87626117.20248787 83865234.0135479  78473858.03428486\n 71363376.3056485  62490687.96584812 51940886.46613745 40052794.89630929\n 27572194.132383   15762794.27006251  6333722.92457996  1044019.62898206\n  1044019.62898209  6333722.92458004 15762794.27006272 27572194.13238307\n 40052794.89630938 51940886.46613754 62490687.96584819 71363376.30564858\n 78473858.03428492 83865234.01354791 87626117.20248789 89842899.57835571\n 90574880.33650465]',
      poisson:
        '[0.02310052 0.03099533 0.05490454 0.09546772 0.15361665 0.23030707\n 0.32600385 0.43978921 0.56800876 0.70261885 0.82998967 0.93168734\n 0.98873968 0.98873968 0.93168734 0.82998967 0.70261885 0.56800876\n 0.43978921 0.32600385 0.23030707 0.15361665 0.09546772 0.05490454\n 0.03099533 0.02310052 0.03099533 0.05490454 0.09546772 0.15361665\n 0.23030707 0.32600385 0.43978921 0.56800876 0.70261885 0.82998967\n 0.93168734 0.98873968 0.98873968 0.93168734 0.82998967 0.70261885\n 0.56800876 0.43978921 0.32600385 0.23030707 0.15361665 0.09546772\n 0.05490454 0.03099533 0.02310052 0.03099533 0.05490454 0.09546772\n 0.15361665 0.23030707 0.32600385 0.43978921 0.56800876 0.70261885\n 0.82998967 0.93168734 0.98873968 0.98873968 0.93168734 0.82998967\n 0.70261885 0.56800876 0.43978921 0.32600385 0.23030707 0.15361665\n 0.09546772 0.05490454 0.03099533 0.02310052 0.03099533 0.05490454\n 0.09546772 0.15361665 0.23030707 0.32600385 0.43978921 0.56800876\n 0.70261885 0.82998967 0.93168734 0.98873968 0.98873968 0.93168734\n 0.82998967 0.70261885 0.56800876 0.43978921 0.32600385 0.23030707\n 0.15361665 0.09546772 0.05490454 0.03099533 0.02310052]'
    },
    {
      field1: '101',
      symmetry: 'C2v',
      unit_cell_x_pixels: '50',
      unit_cell_y_pixels: '50',
      geometry_full:
        '1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
      condition: 'Plane Strain',
      C11: '2957458810',
      C12: '1456658807',
      C22: '2957458810',
      C16: '0',
      C26: '0',
      C66: '750400001.7',
      CM0_E: '1.00E-09',
      'CM0_nu\t': '',
      CM1_E: '2240000000',
      CM1_nu: '0.49253731',
      youngs:
        '[2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09\n 2.24e+09 2.24e+09 2.24e+09 2.24e+09 2.24e+09]',
      poisson:
        '[0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731\n 0.49253731 0.49253731 0.49253731 0.49253731 0.49253731]'
    }
  ]
}
