const axios = require('axios');
const { Agent: HttpsAgent } = require('https');
const { Agent } = require('http');
const { TextEncoder } = require('util');

const ERROR_PAGE_NOT_FOUND = 404;

const GET_CONFIG = {
  transformRequest: (r) => JSON.stringify(r),
  httpAgent: new Agent({ keepAlive: true }),
  httpsAgent: new HttpsAgent({ keepAlive: true }),
  responseType: 'json',
  transitional: {
    silentJSONParsing: false,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
  },
  validateStatus: (s) => s < 300,
};

const textEncoder = new TextEncoder('utf-8');

const uint8ArrayToBase64 = (u8) => Buffer.from(u8).toString('base64');
const stringToUint8Array = (str) => textEncoder.encode(str);

const getSecretFromVault = async (secretPath, vaultPrefix, fallback) => {
  try {
    const response = await axios({
      ...GET_CONFIG,
      method: 'GET',
      url: `${vaultPrefix}${secretPath}`,
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': process.env.VAULT_TOKEN,
      },
    });
    const vaultResponse = await response.data;

    if (vaultResponse && vaultResponse.data && vaultResponse.data.value) {
      return vaultResponse.data.value;
    }
  } catch (e) {
    if (e.statusCode !== ERROR_PAGE_NOT_FOUND) {
      throw e;
    }
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
