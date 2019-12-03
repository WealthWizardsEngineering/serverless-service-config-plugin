const request = require('request-promise-native');
const consul = require('./consul');

const getSecretFromVault = async (secretPath, vaultPrefix) => {
  const vaultResponse = await request({
    method: 'GET',
    url: `${vaultPrefix}${secretPath}`,
    headers: {
      'X-Vault-Token': process.env.VAULT_TOKEN,
    },
    json: true,
  });

  if (vaultResponse && vaultResponse.data && vaultResponse.data.value) {
    return vaultResponse.data.value;
  }

  throw new Error(`Missing secret at ${secretPath}`);
};

const kmsEncrypt = async (params, kms) => {
  const data = await kms.encrypt(params).promise();

  if (data && data.CiphertextBlob) {
    return data.CiphertextBlob.toString('base64');
  }

  throw new Error('Missing encrypted secret value from AWS response');
};

module.exports = async (path, vaultPrefix, kms, kmsKeyId) => {
  if (!process.env.VAULT_TOKEN) {
    throw new Error('Missing vault token for authentication, you need to set VAULT_TOKEN as a environment variable');
  }

  const secretPath = await consul.get(path);

  const secretValue = await getSecretFromVault(secretPath, vaultPrefix);

  return kmsEncrypt({
    KeyId: kmsKeyId,
    Plaintext: secretValue,
  }, kms);
};
