/**
 * Optional Chaining Utility Composable
 * Provides safe function execution with error handling
 */
export function useOptionalChaining() {
  const optionalChaining = (fn: () => any) => {
    try {
      return fn();
    } catch (e) {
      console.log(e);
      return undefined;
    }
  };

  return {
    optionalChaining,
  };
}
