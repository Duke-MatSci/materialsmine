import { ActionContext } from 'vuex';
import { VegaState } from './types';
import { getDefaultChart, loadChart } from '@/modules/vega-chart';

type Context = ActionContext<VegaState, any>;

interface ChartData {
  baseSpec?: Record<string, any> | null;
  query?: string | null;
  title?: string | null;
  description?: string | null;
  depiction?: string | null;
  downloadUrl?: string | null;
  dataset?: string | null;
}

export default {
  resetChart({ dispatch }: Context): void {
    dispatch('setChart', getDefaultChart());
  },
  async loadChart({ dispatch }: Context, uri: string): Promise<void> {
    const chart = await loadChart(uri);
    dispatch('setChart', chart);
  },
  setChart({ commit }: Context, chart: ChartData): void {
    commit('setBaseSpec', chart.baseSpec);
    commit('setQuery', chart.query);
    commit('setTitle', chart.title);
    commit('setDescription', chart.description);
    commit('setDepiction', chart.depiction);
    commit('setDownloadUrl', chart.downloadUrl);
    commit('setDataset', chart.dataset);
  }
};
