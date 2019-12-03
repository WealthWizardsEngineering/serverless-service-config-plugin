const test = require('tape');
const pluginConfig = require('./plugin_config');

test('should return a default config', (assert) => {
  assert.plan(6);

  const config = pluginConfig.load();

  assert.equal(config.consulAddr, 'https://127.0.0.1:8500');
  assert.equal(config.consulRootContext, 'v1/kv');
  assert.equal(config.consulPrefix, '');
  assert.equal(config.vaultAddr, 'https://127.0.0.1:8200');
  assert.equal(config.vaultRootContext, 'v1');
  assert.equal(config.vaultPrefix, '');
});

test('should be able to override with serverless config', (assert) => {
  assert.plan(6);

  const overrides = {
    consulAddr: 'https://consul/',
    vaultAddr: 'https://vault/',
    consulRootContext: 'consulRoot/',
    vaultRootContext: 'vaultRoot/path/',
    consulPrefix: 'consul_prefix/',
    vaultPrefix: 'vault_prefix/'
  };

  const config = pluginConfig.load(overrides);

  assert.equal(config.consulAddr, 'https://consul/');
  assert.equal(config.consulRootContext, 'consulRoot/');
  assert.equal(config.vaultAddr, 'https://vault/');
  assert.equal(config.vaultRootContext, 'vaultRoot/path/');
  assert.equal(config.consulPrefix, 'consul_prefix/');
  assert.equal(config.vaultPrefix, 'vault_prefix/');
});

test('should build consul url from config', (assert) => {
  assert.plan(1);

  const config = pluginConfig.load({
    consulAddr: 'https://consul.com',
    consulPrefix: 'consul/backend',
  });

  assert.equal(config.consulUrl(), 'https://consul.com/v1/kv/consul/backend/');
});

test('should build vault url from config', (assert) => {
  assert.plan(1);

  const config = pluginConfig.load({
    vaultAddr: 'https://vault',
    vaultRootContext: 'vaultRoot/path',
    vaultPrefix: 'vault_prefix'
  });

  assert.equal(config.vaultUrl(), 'https://vault/vaultRoot/path/vault_prefix/');
});

test('should handle extra/missing slashes', (assert) => {
  assert.plan(2);

  const config = pluginConfig.load({
    consulAddr: 'https://consul/',
    vaultAddr: 'https://vault',
    consulRootContext: '///consulRoot/',
    vaultRootContext: '/vaultRoot/path//',
    consulPrefix: '/consul/prefix/',
    vaultPrefix: 'vault/prefix'
  });

  assert.equal(config.consulUrl(), 'https://consul/consulRoot/consul/prefix/');
  assert.equal(config.vaultUrl(), 'https://vault/vaultRoot/path/vault/prefix/');
});

test('should handle empty prefixes', (assert) => {
  assert.plan(2);

  const config = pluginConfig.load({
    consulAddr: 'https://consul/',
    vaultAddr: 'https://vault',
  });

  assert.equal(config.consulUrl(), 'https://consul/v1/kv/');
  assert.equal(config.vaultUrl(), 'https://vault/v1/');
});
