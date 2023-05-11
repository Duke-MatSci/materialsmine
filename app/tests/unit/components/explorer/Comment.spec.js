import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Comment from '@/components/explorer/Comment.vue'

describe('Comment.vue', () => {
  const loadComment = {
    comments: [
      {
        _id: '64397a75dffb639553bf6301',
        comment: 'secont comment',
        user: {
          givenName: 'Test',
          surName: 'Test'
        },
        createdAt: '1681488501114',
        updatedAt: '1681488501114'
      },
      {
        _id: '643d6915ed8c46b40712ed6a',
        comment: 'secont comment',
        user: {
          givenName: 'Test',
          surName: 'Test'
        },
        createdAt: '1681746197052',
        updatedAt: '1681746197052'
      },
      {
        _id: '643d691eed8c46b40712ed78',
        comment: 'third comment',
        user: {
          givenName: 'Test',
          surName: 'Test'
        },
        createdAt: '1681746206972',
        updatedAt: '1681746206972'
      }
    ]
  }

  let wrapper
  beforeEach(async () => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = await createWrapper(Comment, {
      props: { type: 'xml', identifier: 'something' },
      mocks: {
        $apollo: {
          loading: false,
          queries: {
            xmlViewer: {
              refetch: jest.fn()
            }
          }
        }
      }
    }, true)
    await wrapper.setData({ loadComment: loadComment })
  })

  enableAutoDestroy(afterEach)
  it('renders default layout correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders default layout correctly', () => {
    expect(wrapper.findAll('.wrapper.u_margin-top-med').length).toBe(2)
    expect(wrapper.find('.wrapper.u_margin-top-med.md-layout').exists()).toBe(true)
    expect(wrapper.find('.wrapper > .u_width--max').exists()).toBe(true)
    expect(wrapper.findAll('.wrapper.u_margin-top-med > form').exists()).toBe(true)
  })

  it('renders comment list data correctly', () => {
    const commentDiv = wrapper.findAll('.md-layout-item.md-size-85.md-layout.u_margin-top-med')
    expect(commentDiv.length).toBe(loadComment.comments.length)
    for (let i = 0; i < commentDiv.length; i++) {
      expect(commentDiv.at(i).find('p.u--color-primary.u--default-size').text()).toBe(`${loadComment.comments[i].user.givenName} ${loadComment.comments[i].user.surName}`)
      expect(commentDiv.at(i).find('p.md-body-1').text()).toBe(`${loadComment.comments[i].comment}`)
      expect(commentDiv.at(i).find('p.utility-align--right.md-caption').text()).toBe(wrapper.vm.formatDate(loadComment.comments[i].createdAt))
    }
  })

  it('renders form correctly', () => {
    const formContainer = wrapper.findAll('.wrapper.u_margin-top-med').at(1)
    const form = formContainer.find('form')
    expect(formContainer.attributes().class).toBe('wrapper u_margin-top-med')
    expect(form.exists()).toBe(true)
    expect(form.find('button').attributes().class).toBe('btn btn--primary btn--noradius search_box_form_btn u--margin-bottommd u--margin-left-auto')
    expect(form.find('button').text()).toBe('Submit')
  })
})
