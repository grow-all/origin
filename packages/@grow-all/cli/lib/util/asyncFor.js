module.exports = async (arr, fn) => {
  for (let i = 0; i < arr.length; i++) {
    await fn(arr[i]);
  }
};
