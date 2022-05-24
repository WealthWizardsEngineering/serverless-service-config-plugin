module.exports = (param) => {
  // eslint-disable-next-line prefer-regex-literals
  const regex = new RegExp('([\\w\\/:\\.$\\{\\}\\-]+),?\\s?([\\"\\w]+)?');
  // eslint-disable-next-line no-unused-vars
  const [full, path, fallback = null] = param.match(regex);
  return {
    path,
    fallback: fallback ? fallback.trim() : null
  };
};
