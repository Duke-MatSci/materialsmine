import { ref, type Ref } from 'vue';

export type DynamfitVariant = 'a' | 'b' | 'c';

const STORAGE_KEY = 'dynamfitVariant';
const DEFAULT_VARIANT: DynamfitVariant = 'a';

function readVariant(): DynamfitVariant {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'a' || stored === 'b' || stored === 'c') return stored;
  return DEFAULT_VARIANT;
}

const variant: Ref<DynamfitVariant> = ref(readVariant());

if (typeof window !== 'undefined') {
  (window as any).setDynamfitVariant = (v: string) => {
    if (v !== 'a' && v !== 'b' && v !== 'c') {
      console.warn('Invalid variant. Use "a", "b", or "c".');
      return;
    }
    localStorage.setItem(STORAGE_KEY, v);
    variant.value = v as DynamfitVariant;
    console.log(`DynamFit variant set to "${v}". UI updated.`);
  };

  (window as any).getDynamfitVariant = () => {
    console.log(`Current variant: "${variant.value}"`);
    return variant.value;
  };
}

export function useDynamfitVariant() {
  return { variant };
}
