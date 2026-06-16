import { ref } from 'vue';

/**
 * Reduce Utility Composable
 * Provides text reduction and asset navigation functionality
 */
export function useReduce() {
  const hideAssetNavLeft = ref(false);
  const hideAssetNavRight = ref(false);

  // Refactor to reduce description text from the end if startFromEnd is set to true
  // For example: harsh_primate_anica-2025-11-12T07:28:19.449Z-tidy.csv will return "...anica-2025-11-12T07:28:19.449Z-tidy.csv"
  const reduceDescription = (args: string, size = 50, startFromEnd = false) => {
    if (!args) return '';
    if (startFromEnd) {
      const arr = args.split('')?.splice(-size);
      const arrSplice = arr.reduce((a, b) => `${a} ${b}`, '');
      const res = arrSplice.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return `...${res}`;
    } else {
      const words = args.split(' ');
      if (words.length <= size) return args;
      const truncated = words.slice(0, size).join(' ');
      const res = truncated.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return `${res}...`;
    }
  };

  const reduceAsset = (args: 'prev' | 'next', assetItems: any[], pushedAssetItem: any[]) => {
    let movedAsset: any;
    let screen: number;

    if (window.matchMedia('(max-width: 40.5em)').matches) {
      screen = 1;
    } else if (window.matchMedia('(max-width: 56.25em)').matches) {
      screen = 2;
    } else {
      screen = 3;
    }

    if (args === 'prev') {
      if (!pushedAssetItem.length) {
        hideAssetNavLeft.value = true;
        return false;
      } else {
        hideAssetNavLeft.value = false;
        movedAsset = pushedAssetItem[pushedAssetItem.length - 1];
        assetItems.unshift(movedAsset);
        pushedAssetItem.pop();
      }
    } else {
      if (!assetItems.length) {
        hideAssetNavRight.value = true;
        return false;
      } else if (assetItems.length <= screen) {
        hideAssetNavRight.value = true;
        return false;
      } else {
        hideAssetNavRight.value = false;
        movedAsset = assetItems[0];
        pushedAssetItem.push(movedAsset);
        assetItems.shift();
      }
    }
  };

  return {
    hideAssetNavLeft,
    hideAssetNavRight,
    reduceDescription,
    reduceAsset,
  };
}
