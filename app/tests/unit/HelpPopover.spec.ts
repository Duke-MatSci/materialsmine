/**
 * NOTE: this suite needs the jsdom environment, which currently cannot boot in
 * the client image — jsdom eagerly requires the stale transitive `canvas@1.6.13`
 * and it has no built native binding ("Cannot find module
 * '../build/Release/canvas.node'"). The pre-existing `example.spec.ts` fails the
 * same way, so this is a repo-wide environment problem, not a problem with the
 * component. The assertions below are written to pass once it is fixed.
 */
import { mount } from '@vue/test-utils';
import HelpPopover from '@/components/HelpPopover.vue';

const mountPopover = () =>
  mount(HelpPopover, {
    props: { label: 'Smoothness' },
    slots: { default: 'Penalty on curvature of the relaxation spectrum.' },
    global: { stubs: { 'md-icon': true } },
    attachTo: document.body,
  });

describe('HelpPopover', () => {
  it('starts closed and advertises that through aria-expanded', () => {
    const wrapper = mountPopover();
    expect(wrapper.find('.help-popover__panel').exists()).toBe(false);
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
    expect(wrapper.get('button').attributes('aria-label')).toBe('Help: Smoothness');
    wrapper.unmount();
  });

  it('opens on click and closes on a second click', async () => {
    const wrapper = mountPopover();
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('.help-popover__panel').text()).toContain('Penalty on curvature');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');

    await wrapper.get('button').trigger('click');
    expect(wrapper.find('.help-popover__panel').exists()).toBe(false);
    wrapper.unmount();
  });

  it('closes when the pointer goes down outside the popover', async () => {
    const wrapper = mountPopover();
    await wrapper.get('button').trigger('click');
    expect(wrapper.find('.help-popover__panel').exists()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.help-popover__panel').exists()).toBe(false);
    wrapper.unmount();
  });

  it('stays open when the pointer goes down inside the panel', async () => {
    const wrapper = mountPopover();
    await wrapper.get('button').trigger('click');

    await wrapper.get('.help-popover__panel').trigger('mousedown');
    expect(wrapper.find('.help-popover__panel').exists()).toBe(true);
    wrapper.unmount();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const wrapper = mountPopover();
    await wrapper.get('button').trigger('click');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.help-popover__panel').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('button').element);
    wrapper.unmount();
  });
});
