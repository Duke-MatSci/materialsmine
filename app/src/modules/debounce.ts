export default function debounce<T extends (...args: any[]) => any>(
  func: T,
  millis: number
): (...args: Parameters<T>) => void {
  let timeout: any | null = null;
  return function (...args: Parameters<T>) {
    const functionCall = () => func(...args);
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(functionCall, millis);
  };
}
