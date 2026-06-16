import { useStore } from 'vuex';

export function useDataDictionary() {
  const store = useStore();

  const findDataDictionaryLink = (
    distribution: string | string[] | Record<string, { downloadLink?: string }>
  ): string | undefined => {
    let links: string[] = [];

    if (Array.isArray(distribution)) {
      links = distribution.map((l) => (typeof l === 'string' ? l.trim() : ''));
    } else if (typeof distribution === 'string') {
      links = distribution.split(',').map((l) => l.trim());
    } else if (distribution && typeof distribution === 'object') {
      links = Object.values(distribution)
        .map((d) => d.downloadLink || '')
        .filter(Boolean);
    }

    return links.find((link) => /\.xlsx?/i.test(link.split('?')[0]));
  };

  const copyDataDictionary = async (
    distribution: string | string[] | Record<string, { downloadLink?: string }>
  ): Promise<void> => {
    const xlsLink = findDataDictionaryLink(distribution);

    if (!xlsLink) {
      store.commit('setSnackbar', {
        message: 'No data dictionary found',
        duration: 3000,
      });
      return;
    }

    await navigator.clipboard.writeText(xlsLink);
    store.commit('setSnackbar', {
      message: 'Data dictionary link copied to clipboard',
      duration: 3000,
    });
  };

  return { copyDataDictionary };
}
