const request = require('request-promise-native');
const { TextDecoder, TextEncoder } = require('util');

const textEncoder = new TextEncoder('utf-8');
const textDecoder = new TextDecoder('utf-8');

const stringToBase64 = (str) => Buffer.from(str).toString('base64');
const stringToUint8Array = (str) => textEncoder.encode(str);
const uint8ArrayToString = (uint8Array) => textDecoder.decode(uint8Array);

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
  const data = await kms.encrypt(params);

  if (data && data.CiphertextBlob) {
    return {
      value: stringToBase64(uint8ArrayToString(data.CiphertextBlob)),
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
  const secretValue = await getSecretFromVault(path, vaultPrefix, fallback);
  return kmsEncrypt(
    {
      KeyId: kmsKeyId,
      Plaintext: stringToUint8Array(secretValue),
    },
    kms
  );
};

module.exports = {
  retrieveAndEncrypt
};
