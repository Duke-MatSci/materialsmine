exports.debounce = (paramFunc, delay) => {
  let debounceTimer;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setInterval(() => paramFunc.apply(context, args), delay);
  };
};
