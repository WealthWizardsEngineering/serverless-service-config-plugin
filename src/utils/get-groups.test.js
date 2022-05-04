/* eslint no-template-curly-in-string: 0 */
const test = require('tape');

const target = require('./get-groups');

test('green/secrets/FACT_FIND_API_KEY}', async (assert) => {
  assert.plan(1);

  const input = 'green/secrets/FACT_FIND_API_KEY';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/secrets/FACT_FIND_API_KEY',
    fallback: null
  });
});

test('green/secrets/FACT_FIND_API_KEY, foo}', async (assert) => {
  assert.plan(1);

  const input = 'green/secrets/FACT_FIND_API_KEY, foo';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/secrets/FACT_FIND_API_KEY',
    fallback: 'foo'
  });
});

test('green/secrets/REPORT_GENERATOR_API_KEY}', async (assert) => {
  assert.plan(1);

  const input = 'green/secrets/REPORT_GENERATOR_API_KEY';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/secrets/REPORT_GENERATOR_API_KEY',
    fallback: null
  });
});

test('green/secrets/REPORT_GENERATOR_API_KEY, foo}', async (assert) => {
  assert.plan(1);

  const input = 'green/secrets/REPORT_GENERATOR_API_KEY, foo';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/secrets/REPORT_GENERATOR_API_KEY',
    fallback: 'foo'
  });
});

test('green/ConfigMap/COMMON_NAMESPACE_BASE_URL}', async (assert) => {
  assert.plan(1);

  const input = 'green/ConfigMap/COMMON_NAMESPACE_BASE_URL';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/ConfigMap/COMMON_NAMESPACE_BASE_URL',
    fallback: null
  });
});

test('green/ConfigMap/COMMON_NAMESPACE_BASE_URL, foo}', async (assert) => {
  assert.plan(1);

  const input = 'green/ConfigMap/COMMON_NAMESPACE_BASE_URL, foo';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/ConfigMap/COMMON_NAMESPACE_BASE_URL',
    fallback: 'foo'
  });
});

test('green{self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST}', async (assert) => {
  assert.plan(1);

  const input = 'green/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST',
    fallback: null
  });
});

test('green{self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST, oui}', async (assert) => {
  assert.plan(1);

  const input = 'green/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST, oui';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'green/${self:provider.stage}/ConfigMap/PIERRE_IS_THE_BEST',
    fallback: 'oui'
  });
});

test('global/OFFICES}', async (assert) => {
  assert.plan(1);

  const input = 'global/config.json/IP-aliases/OFFICES';

  const result = target(input);

  assert.deepEqual(result, {
    path: 'global/config.json/IP-aliases/OFFICES',
    fallback: null
  });
});
