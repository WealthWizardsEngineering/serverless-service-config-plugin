const axios = require('axios');
const { Agent: HttpsAgent } = require('https');
const { Agent } = require('http');

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

async function get(url, fallback = null) {
  if (!process.env.CONSUL_TOKEN) {
    throw new Error(
      'Missing consul token for authentication, you need to set CONSUL_TOKEN as a environment variable'
    );
  }
  try {
    const response = await axios({
      ...GET_CONFIG,
      method: 'GET',
      url,
      headers: {
        'content-type': 'application/json',
        'X-Consul-Token': process.env.CONSUL_TOKEN
      },
    });
    const consulData = await response.data;

    if (consulData && consulData[0] && consulData[0].Value) {
      return {
        value: Buffer.from(consulData[0].Value, 'base64').toString()
      };
    }
  } catch (e) {
    if (e.response?.status !== 404) {
      throw e;
    }
  }

  if (fallback) {
    return {
      value: fallback
    };
  }
  throw new Error(`Missing value in Consul at ${url}`);
}

module.exports = {
  get
};
