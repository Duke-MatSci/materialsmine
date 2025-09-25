import { ref } from 'vue';

/**
 * Reduce Utility Composable
 * Provides text reduction and asset navigation functionality
 */
export function useReduce() {
  const hideAssetNavLeft = ref(false);
  const hideAssetNavRight = ref(false);

  const reduceDescription = (args: string, size = 50) => {
    if (!args) return '';
    const arr = args.split(' ');
    arr.splice(size);
    const arrSplice = arr.reduce((a, b) => `${a} ${b}`, '');
    const res = arrSplice.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return `${res}...`;
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
