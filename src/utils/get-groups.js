module.exports = (param) => {
  const regex = new RegExp('[serviceConfig|secretConfig]:([\\w\\/:\\.$\\{\\}]+),?\\s?([\\"\\w]+)?');
  // eslint-disable-next-line no-unused-vars
  const [full, path, fallback = null] = param.match(regex);
  return {
    path,
    fallback: fallback ? fallback.trim() : null
  };
};
