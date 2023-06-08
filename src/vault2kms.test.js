const test = require('tape');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { KMS } = require('@aws-sdk/client-kms');
const { TextEncoder } = require('util');

const stringToUint8Array = (str) => new TextEncoder('utf-8').encode(str);

const kms = new KMS();

const consulStub = sinon.stub();
const axiosStub = sinon.stub();
const kmsEncryptStub = sinon.stub(kms, 'encrypt');

const { retrieveAndEncrypt } = proxyquire('./vault2kms', {
  axios: axiosStub,
  './consul': { get: consulStub }
});

test('before - fake vault token', (t) => {
  process.env.VAULT_TOKEN = 'vault_token';
  t.end();
});

test('should retrieve secret from Vault and encrypt with KMS', async (assert) => {
  assert.plan(5);

  axiosStub.reset();
  kmsEncryptStub.reset();

  axiosStub
    .resolves({
      data: Promise.resolve({
        data: {
          value: 'fake_secret'
        }
      })
    });

  kmsEncryptStub
    .onCall(0)
    .resolves({
      CiphertextBlob: Buffer.from('encrypted:fake_secret')
    });

  const encryptedSecret = await retrieveAndEncrypt(
    'secret/path',
    'http://vault/',
    kms,
    'kmsKeyId'
  );

  assert.equal(encryptedSecret.value, 'ZW5jcnlwdGVkOmZha2Vfc2VjcmV0');
  assert.deepEquals('kmsKeyId', kmsEncryptStub.firstCall.args[0].KeyId);
  assert.deepEquals(stringToUint8Array('fake_secret'), kmsEncryptStub.firstCall.args[0].Plaintext);
  assert.equal(axiosStub.args[0][0].url, 'http://vault/secret/path');
  assert.deepEqual(axiosStub.args[0][0].headers, {
    'content-type': 'application/json',
    'X-Vault-Token': 'vault_token'
  });
});

test('should throw if no data is returned from Vault', async (assert) => {
  const expectedVaultResponses = [{ data: {} }, {}, null];

  assert.plan(expectedVaultResponses.length);

  for (const response of expectedVaultResponses) {
    axiosStub.reset();
    axiosStub.resolves({ data: Promise.resolve(response) });

    try {
      await retrieveAndEncrypt('secret/path', 'http://vault/', kms, 'kmsKeyId');
    } catch (e) {
      assert.equal(e.message, 'Missing secret in Vault at secret/path');
    }
  }
});

test('should throw friendler exception when Vault returns 404', async (assert) => {
  const notFoundError = new Error('404 - not found');
  notFoundError.statusCode = 404;

  assert.plan(1);

  axiosStub.reset();
  axiosStub.rejects(notFoundError);

  try {
    await retrieveAndEncrypt('secret/path', 'http://vault/', kms, 'kmsKeyId');
  } catch (e) {
    assert.equal(e.message, 'Missing secret in Vault at secret/path');
  }
});

test('should throw if encrypted secret cannot be retrieved', async (assert) => {
  consulStub.reset();
  axiosStub.reset();

  consulStub.withArgs('path/to/secret').resolves('secret/path');

  axiosStub.resolves({
    data: Promise.resolve({
      data: {
        value: 'fake_secret'
      }
    })
  });

  const expectedKmsResponses = [{ data: null }, null];

  assert.plan(expectedKmsResponses.length);

  for (const response of expectedKmsResponses) {
    kmsEncryptStub.reset();
    kmsEncryptStub.resolves(response);

    try {
      await retrieveAndEncrypt('path/to/secret', 'http://vault/', kms, 'kmsKeyId');
    } catch (e) {
      assert.equal(e.message, 'Missing encrypted secret value from AWS response');
    }
  }
});

test('should return fallback if defined and key not present', async (assert) => {
  assert.plan(3);
  consulStub.reset();
  consulStub.withArgs('path/to/secret').resolves('fallback');

  const notFoundError = new Error('404 - not found');
  notFoundError.statusCode = 404;

  axiosStub.reset();
  axiosStub.rejects(notFoundError);

  kmsEncryptStub.reset();
  kmsEncryptStub
    .onCall(0)
    .resolves({
      CiphertextBlob: Buffer.from('encrypted:fallback')
    });

  const encryptedSecret = await retrieveAndEncrypt(
    'path/to/secret',
    'http://vault/',
    kms,
    'kmsKeyId',
    'fallback'
  );

  assert.equal(encryptedSecret.value, 'ZW5jcnlwdGVkOmZhbGxiYWNr');
  assert.deepEquals('kmsKeyId', kmsEncryptStub.firstCall.args[0].KeyId);
  assert.deepEquals(stringToUint8Array('fallback'), kmsEncryptStub.firstCall.args[0].Plaintext);
});

test('after - unset fake vault token', (t) => {
  delete process.env.VAULT_TOKEN;
  t.end();
});

test('should fail if vault token not present', async (assert) => {
  assert.plan(1);

  try {
    await retrieveAndEncrypt('path/to/secret', 'http://vault/', kms, 'kmsKeyId');
  } catch (e) {
    assert.equal(
      e.message,
      'Missing vault token for authentication, you need to set VAULT_TOKEN as a environment variable'
    );
  }
});
