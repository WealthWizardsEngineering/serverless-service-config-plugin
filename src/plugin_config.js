const defaultPluginConfig = {
  consulAddr: 'https://127.0.0.1:8500',
  consulRootContext: 'v1/kv',
  consulPrefix: '',
  vaultAddr: 'https://127.0.0.1:8200',
  vaultRootContext: 'v1',
  vaultPrefix: '',
};

function trimLeadingSlashes(path) {
  if (!path.startsWith('/')) {
    return path;
  }
  return trimLeadingSlashes(path.replace(/^\//, ''));
}

function trimTrailingSlash(path) {
  if (!path.endsWith('/')) {
    return path;
  }
  return trimTrailingSlash(path.replace(/\/$/, ''));
}

function trimPath(path) {
  const trimmedPath = trimLeadingSlashes(path);

  return trimTrailingSlash(trimmedPath);
}

function buildUrl({ addr, root, prefix }) {
  const trimmmedPrefix = trimPath(prefix);
  return `${trimTrailingSlash(addr)}/${trimPath(root)}/${trimmmedPrefix ? `${trimmmedPrefix}/` : ''}`;
}

function load(overrides = {}) {
  function consulUrl() {
    return buildUrl({
      addr: this.consulAddr,
      root: this.consulRootContext,
      prefix: this.consulPrefix,
    });
  }

  function vaultUrl() {
    return buildUrl({
      addr: this.vaultAddr,
      root: this.vaultRootContext,
      prefix: this.vaultPrefix,
    });
  }

  return {
    consulUrl,
    vaultUrl,
    ...defaultPluginConfig,
    ...overrides
  };
}

module.exports = { load };
