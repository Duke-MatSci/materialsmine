/**
 * Optional chaining utility composable
 * Note: Modern JavaScript/TypeScript supports optional chaining natively with ?. operator
 * This composable is provided for backward compatibility with legacy code
 */
export function useOptionalChaining() {
  const optionalChaining = <T>(fn: () => T): T | undefined => {
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
