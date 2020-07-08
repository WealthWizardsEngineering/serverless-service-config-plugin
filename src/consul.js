const request = require('request-promise-native');

async function get(url, options = {}) {
  if (!process.env.CONSUL_TOKEN) {
    throw new Error(
      'Missing consul token for authentication, you need to set CONSUL_TOKEN as a environment variable'
    );
  }

  try {
    const consulData = await request({
      url,
      headers: {
        'X-Consul-Token': process.env.CONSUL_TOKEN
      },
      json: true
    });

    if (consulData && consulData[0] && consulData[0].Value) {
      return Buffer.from(consulData[0].Value, 'base64').toString();
    }

    if (options.allowMissing) {
      // eslint-disable-next-line no-console
      console.warn(url, 'missing, using blank value.');
      return null;
    }
  } catch (e) {
    if (e.statusCode !== 404) throw e;
  }
  throw new Error(`Missing value in Consul at ${url}`);
}

module.exports = {
  get
};
