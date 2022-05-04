const request = require('request-promise-native');
const consul = require('./consul');

const getSecretFromVault = async (secretPath, vaultPrefix, fallback) => {
  try {
    const vaultResponse = await request({
      method: 'GET',
      url: `${vaultPrefix}${secretPath}`,
      headers: {
        'X-Vault-Token': process.env.VAULT_TOKEN
      },
      json: true
    });

    if (vaultResponse && vaultResponse.data && vaultResponse.data.value) {
      return vaultResponse.data.value;
    }
  } catch (e) {
    if (e.statusCode !== 404) throw e;
  }

  if (fallback) {
    return fallback;
  }

  throw new Error(`Missing secret in Vault at ${secretPath}`);
};

const kmsEncrypt = async (params, kms) => {
  const data = await kms.encrypt(params).promise();

  if (data && data.CiphertextBlob) {
    return {
      value: data.CiphertextBlob.toString('base64')
    };
  }

  throw new Error('Missing encrypted secret value from AWS response');
};

const retrieveAndEncrypt = async (path, vaultPrefix, kms, kmsKeyId, fallback = null) => {
  if (!process.env.VAULT_TOKEN) {
    throw new Error(
      'Missing vault token for authentication, you need to set VAULT_TOKEN as a environment variable'
    );
  }
  const secretPath = await consul.get(path, fallback);
  const secretValue = await getSecretFromVault(secretPath, vaultPrefix, fallback);
  return kmsEncrypt(
    {
      KeyId: kmsKeyId,
      Plaintext: secretValue
    },
    kms
  );
};

module.exports = {
  retrieveAndEncrypt
};
