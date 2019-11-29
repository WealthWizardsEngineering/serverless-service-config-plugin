const defaultPluginConfig = {
    consulAddr: 'https://127.0.0.1:8500',
    consulRootContext: 'v1/kv',
    consulPrefix: '',
    vaultAddr: 'https://127.0.0.1:8200',
    vaultRootContext: 'v1',
    vaultPrefix: '',
}

function trimPath(path) {
     
    const trimmedPath = trimLeadingSlashes(path);

    return trimTrailingSlash(trimmedPath)
}

function trimLeadingSlashes(path) {
    if (!path.startsWith('/')) {
        return path;
    }
    return trimLeadingSlashes(path.replace(/^\//, ''))
}

function trimTrailingSlash(path) {
    if (!path.endsWith('/')) {
        return path;
    }
    return trimTrailingSlash(path.replace(/\/$/, ''));
}

function load(overrides = {}) {

    function consulUrl() {
        return `${trimTrailingSlash(this.consulAddr)}/${trimPath(this.consulRootContext)}/${trimPath(this.consulPrefix)}/`;
    }

    function vaultUrl() {
        return `${trimTrailingSlash(this.vaultAddr)}/${trimPath(this.vaultRootContext)}/${trimPath(this.vaultPrefix)}/`;
    }

    return {
        consulUrl,
        vaultUrl,
        ...defaultPluginConfig,
        ...overrides
    };
}

module.exports = { load };