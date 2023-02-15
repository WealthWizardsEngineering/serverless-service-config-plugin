const request = require('request-promise-native');
const { TextEncoder } = require('util');

const textEncoder = new TextEncoder('utf-8');

const uint8ArrayToBase64 = (u8) => Buffer.from(u8).toString('base64');
const stringToUint8Array = (str) => textEncoder.encode(str);

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
  console.log('kmsEncrypt 1', JSON.stringify({ params }));
  const data = await kms.encrypt(params);
  console.log('kmsEncrypt 2', JSON.stringify({ data }));

  if (data && data.CiphertextBlob) {
    return {
      value: uint8ArrayToBase64(data.CiphertextBlob),
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

  const encryptedValue = await kmsEncrypt(
    {
      KeyId: kmsKeyId,
      Plaintext: stringToUint8Array(secretValue),
    },
    kms
  );

  return encryptedValue;
};

module.exports = {
  retrieveAndEncrypt
};
