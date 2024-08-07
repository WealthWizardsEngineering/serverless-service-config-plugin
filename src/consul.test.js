const proxyquire = require('proxyquire').noCallThru();
const test = require('tape');
const sinon = require('sinon');

const axiosStub = sinon.stub();

const consul = proxyquire('./consul', { axios: axiosStub });

test('before', (t) => {
  process.env.CONSUL_TOKEN = 'myToken';
  t.end();
});

test('should retrieve data from consul', async (assert) => {
  assert.plan(3);

  axiosStub.reset();
  axiosStub
    .resolves({
      data: Promise.resolve([{ Value: 'dGhpcyBpcyBteSBjb25maWcgdmFsdWU=' }])
    });

  const consulValue = await consul.get('http://consul/kv/myKey');

  assert.equal(consulValue.value, 'this is my config value');
  assert.equal(axiosStub.args[0][0].url, 'http://consul/kv/myKey');
  assert.deepEqual(axiosStub.args[0][0].headers, {
    'content-type': 'application/json',
    'X-Consul-Token': 'myToken',
  });
});

test('should fail if no value is found', async (assert) => {
  const expectedResponses = [[{ otherKey: 'Value missing' }], [], null];

  assert.plan(expectedResponses.length);

  for (const response of expectedResponses) {
    axiosStub.reset();
    axiosStub.resolves({
      data: Promise.resolve(response)
    });

    try {
      await consul.get('http://consul/kv/myKey');
    } catch (e) {
      assert.equal(e.message, 'Missing value in Consul at http://consul/kv/myKey');
    }
  }
});

test('should display friendlier error when receiving 404 from Consul', async (assert) => {
  assert.plan(1);

  const notFoundError = new Error();
  notFoundError.response = { status: 404 };

  axiosStub.reset();
  axiosStub.rejects(notFoundError);

  try {
    await consul.get('http://consul/kv/myKey');
  } catch (e) {
    assert.equal(e.message, 'Missing value in Consul at http://consul/kv/myKey');
  }
});

test('should return fallback if defined and key not present in consul', async (assert) => {
  assert.plan(1);

  const consulValue = await consul.get('http://consul/kv/myKey', 'fallback');

  assert.equal(consulValue.value, 'fallback');
});

test('after', (t) => {
  delete process.env.CONSUL_TOKEN;
  t.end();
});

test('should fail if consul token not present', async (assert) => {
  assert.plan(1);

  try {
    await consul.get('http://consul/kv/myKey');
  } catch (e) {
    assert.equal(
      e.message,
      'Missing consul token for authentication, you need to set CONSUL_TOKEN as a environment variable',
    );
  }
});
