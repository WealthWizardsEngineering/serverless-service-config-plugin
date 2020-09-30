/* eslint no-template-curly-in-string: 0 */
const test = require('tape');

const target = require('./get-groups');

test('${secretConfig:${self:custom.serviceConfigPath}/secrets/FACT_FIND_API_KEY}', async (assert) => {
  assert.plan(1);

  const input = 'secretConfig:${self:custom.serviceConfigPath}/secrets/FACT_FIND_API_KEY';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/secrets/FACT_FIND_API_KEY',
    fallback: null
  });
});

test('${secretConfig:${self:custom.serviceConfigPath}/secrets/FACT_FIND_API_KEY, foo}', async (assert) => {
  assert.plan(1);

  const input = 'secretConfig:${self:custom.serviceConfigPath}/secrets/FACT_FIND_API_KEY, foo';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/secrets/FACT_FIND_API_KEY',
    fallback: 'foo'
  });
});

test('${secretConfig:${self:custom.serviceConfigPath}/secrets/REPORT_GENERATOR_API_KEY}', async (assert) => {
  assert.plan(1);

  const input = 'secretConfig:${self:custom.serviceConfigPath}/secrets/REPORT_GENERATOR_API_KEY';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/secrets/REPORT_GENERATOR_API_KEY',
    fallback: null
  });
});

test('${secretConfig:${self:custom.serviceConfigPath}/secrets/REPORT_GENERATOR_API_KEY, foo}', async (assert) => {
  assert.plan(1);

  const input = 'secretConfig:${self:custom.serviceConfigPath}/secrets/REPORT_GENERATOR_API_KEY, foo';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/secrets/REPORT_GENERATOR_API_KEY',
    fallback: 'foo'
  });
});

test('${serviceConfig:${self:custom.serviceConfigPath}/ConfigMap/COMMON_NAMESPACE_BASE_URL}', async (assert) => {
  assert.plan(1);

  const input = 'serviceConfig:${self:custom.serviceConfigPath}/ConfigMap/COMMON_NAMESPACE_BASE_URL';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/ConfigMap/COMMON_NAMESPACE_BASE_URL',
    fallback: null
  });
});

test('${serviceConfig:${self:custom.serviceConfigPath}/ConfigMap/COMMON_NAMESPACE_BASE_URL, foo}', async (assert) => {
  assert.plan(1);

  const input = 'serviceConfig:${self:custom.serviceConfigPath}/ConfigMap/COMMON_NAMESPACE_BASE_URL, foo';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/ConfigMap/COMMON_NAMESPACE_BASE_URL',
    fallback: 'foo'
  });
});

test('${serviceConfig:${self:custom.serviceConfigPath}/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST}', async (assert) => {
  assert.plan(1);

  const input = 'serviceConfig:${self:custom.serviceConfigPath}/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST',
    fallback: null
  });
});

test('${serviceConfig:${self:custom.serviceConfigPath}/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST, oui}', async (assert) => {
  assert.plan(1);

  const input = 'serviceConfig:${self:custom.serviceConfigPath}/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST, oui';

  const result = target(input);

  assert.deepEqual(result, {
    path: '${self:custom.serviceConfigPath}/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST',
    fallback: 'oui'
  });
});

test('${serviceConfig:global/config.json/IP-aliases/OFFICES}', async (assert) => {
  assert.plan(1);

  const input = 'serviceConfig:global/config.json/IP-aliases/OFFICES';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'global/config.json/IP-aliases/OFFICES',
    fallback: null
  });
});
