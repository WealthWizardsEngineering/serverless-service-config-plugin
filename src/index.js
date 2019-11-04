'use strict';

const request = require('request-promise-native');
const aws     = require('aws-sdk');

class ServerlessServiceConfig {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.variableResolvers = {
      ww_serviceConfig: this.getConfig.bind(this),
    }
  }

  async getConfig() {

    const stage = this.serverless.variables.options.stage || this.serverless.service.provider.stage;
    const service = this.serverless.service.service;

    const root = `app_config_vars/serverless/${service}.json/${stage}/`

    const consulResponse = await request({
      url: `${process.env.CONSUL_ADDR}/v1/kv/${root}`,
      headers: {
        'X-Consul-Token': process.env.CONSUL_TOKEN
      },
      qs: {
        keys: null
      },
      json: true,
    })

    const values = {};
    for (const path of consulResponse) {
      this.serverless.cli.log(`processing ${path}`);

      const shouldProcessPath = new RegExp(root + '(ConfigMap|secrets)/(\\w+)$').exec(path);

      this.serverless.cli.log(`${path}`);
      this.serverless.cli.log(root + '(ConfigMap|secrets)/(\\w+)$');
      this.serverless.cli.log(`${shouldProcessPath}`);

      if (shouldProcessPath) {

        const consulData = await request({
          url: `${process.env.CONSUL_ADDR}/v1/kv/${path}`,
          headers: {
            'X-Consul-Token': process.env.CONSUL_TOKEN
          },
          json: true,
        })

        const decodedValue = Buffer.from(consulData[0].Value, 'base64').toString();

        if (shouldProcessPath[1] === 'secrets') {
          values[shouldProcessPath[2]] = await this.vault2kms(decodedValue);
        } else {
          values[shouldProcessPath[2]] = decodedValue;
        }

      }

    }

    return values;

  }

  async vault2kms(secretPath) {

    const stage = this.serverless.variables.options.stage || this.serverless.service.provider.stage;

    try {
      const vaultResponse = await request({
        method: 'GET',
        url: `${process.env.VAULT_ADDR}/v1/${secretPath}`,
        headers: {
          'X-Vault-Token': process.env.VAULT_TOKEN,
        },
        json: true,
      });

      const awsConfig = { region: 'eu-west-1' };
      const profile = this.serverless.variables.options['aws-profile'];

      if (profile) {
        awsConfig.credentials = new aws.SharedIniFileCredentials({ profile });
      }

      const kms = new aws.KMS(awsConfig);

      const params = {
        KeyId: this.serverless.service.custom.KMS_KEY_ID[stage],
        Plaintext: vaultResponse.data.value,
      };

      const data = await kms.encrypt(params).promise();

      return data.CiphertextBlob.toString('base64');
    } catch(err) {
      this.serverless.cli.log(`err [${err.message}] received while fetching ${process.env.VAULT_ADDR}/v1/${secretPath}`, 'ServerlessServiceConfigPlugin[Vault2KMS]', {color: 'red'})
      throw err;
    }
  }
}

module.exports = ServerlessServiceConfig;
