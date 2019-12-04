const consul = require('./consul');
const vault2kms = require('./vault2kms');
const pluginConfig = require('./plugin_config');
const kmsConfig = require('./kms_config');

class ServerlessServiceConfig {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.variableResolvers = {
      serviceConfig: this.getServiceConfig.bind(this),
      secretConfig: this.getSecretConfig.bind(this),
    };
  }

  // the serverless framework will always invoke this
  // function with param starting with 'serviceConfig:'
  async getServiceConfig(param = 'serviceConfig:') {
    const path = param.slice('serviceConfig:'.length);

    const { service_config_plugin } = this.serverless.service.custom;

    const config = pluginConfig.load(service_config_plugin);

    return consul.get(`${config.consulUrl()}${path}`);
  }

  // the serverless framework will always invoke this
  // function with param starting with 'secretConfig:'
  async getSecretConfig(param = 'secretConfig:') {
    const path = param.slice('secretConfig:'.length);

    const { service_config_plugin } = this.serverless.service.custom;
    const { stage } = this.serverless.service.provider;

    const config = pluginConfig.load(service_config_plugin);

    const { kmsKeyId = {} } = config;

    if (!kmsKeyId[stage]) {
      throw new Error(`KMS Key Id missing, please specify it in in the plugin config [service_config_plugin.kmsKeyId.${stage}]`);
    }

    return vault2kms.retrieveAndEncrypt(`${config.consulUrl()}${path}`, config.vaultUrl(), kmsConfig.load(this.serverless), config.kmsKeyId[stage]);
  }
}

module.exports = ServerlessServiceConfig;
