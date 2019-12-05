const test = require('tape');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { KMS } = require('aws-sdk');

const kms = new KMS();

const consulStub = sinon.stub();
const requestStub = sinon.stub();
const kmsStub = sinon.stub(kms, 'encrypt');

const vault2kms = proxyquire('./vault2kms', {
  'request-promise-native': requestStub,
  './consul': { get: consulStub }
});

test('before - fake vault token', (t) => {
  process.env.VAULT_TOKEN = 'vault_token';
  t.end();
});

test('should retrieve secret path from Consul, secret from Vault and encrypt with KMS', async (assert) => {
  assert.plan(1);

  consulStub.reset();
  requestStub.reset();
  kmsStub.reset();

  consulStub
    .withArgs('path/to/secret')
    .resolves('secret/path');

  requestStub
    .withArgs({
      method: 'GET',
      url: 'http://vault/secret/path',
      headers: {
        'X-Vault-Token': 'vault_token',
      },
      json: true,
    })
    .resolves({
      data: {
        value: 'fake_secret'
      }
    });

  kmsStub
    .withArgs({
      KeyId: 'kmsKeyId',
      Plaintext: 'fake_secret'
    })
    .returns({
      promise: () => Promise.resolve({
        CiphertextBlob: Buffer.from('encrypted:fake_secret')
      })
    });

  const encryptedSecret = await vault2kms.retrieveAndEncrypt('path/to/secret', 'http://vault/', kms, 'kmsKeyId');

  assert.equal(encryptedSecret, 'ZW5jcnlwdGVkOmZha2Vfc2VjcmV0');
});

test('should throw if no data is returned from Vault', async (assert) => {
  consulStub.reset();

  consulStub
    .withArgs('path/to/secret')
    .resolves('secret/path');

  const expectedVaultResponses = [
    { data: {} },
    {},
    null
  ];

  assert.plan(expectedVaultResponses.length);

  for (const response of expectedVaultResponses) {
    requestStub.reset();
    requestStub.resolves(response);

    try {
      await vault2kms.retrieveAndEncrypt('path/to/secret', 'http://vault/', kms, 'kmsKeyId');
    } catch (e) {
      assert.equal(e.message, 'Missing secret in Vault at secret/path');
    }
  }
});

test('should throw friendler exception when Vault returns 404', async (assert) => {
  consulStub.reset();

  consulStub
    .withArgs('path/to/secret')
    .resolves('secret/path');

  const notFoundError = new Error('404 - not found');
  notFoundError.statusCode = 404;

  assert.plan(1);

  requestStub.reset();
  requestStub.rejects(notFoundError);

  try {
    await vault2kms.retrieveAndEncrypt('path/to/secret', 'http://vault/', kms, 'kmsKeyId');
  } catch (e) {
    assert.equal(e.message, 'Missing secret in Vault at secret/path');
  }
});

test('should throw if encrypted secret cannot be retrieved', async (assert) => {
  consulStub.reset();
  requestStub.reset();

  consulStub
    .withArgs('path/to/secret')
    .resolves('secret/path');

  requestStub
    .resolves({
      data: {
        value: 'fake_secret'
      }
    });

  const expectedKmsResponses = [
    { data: null },
    null
  ];

  assert.plan(expectedKmsResponses.length);

  for (const response of expectedKmsResponses) {
    kmsStub.reset();
    kmsStub.returns({
      promise: () => Promise.resolve(response)
    });

    try {
      await vault2kms.retrieveAndEncrypt('path/to/secret', 'http://vault/', kms, 'kmsKeyId');
    } catch (e) {
      assert.equal(e.message, 'Missing encrypted secret value from AWS response');
    }
  }
});

test('after - unset fake vault token', (t) => {
  delete process.env.VAULT_TOKEN;
  t.end();
});

test('should fail if vault token not present', async (assert) => {
  assert.plan(1);

  try {
    await vault2kms.retrieveAndEncrypt('path/to/secret', 'http://vault/', kms, 'kmsKeyId');
  } catch (e) {
    assert.equal(e.message, 'Missing vault token for authentication, you need to set VAULT_TOKEN as a environment variable');
  }
});
