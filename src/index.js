const consul = require('./consul');
const vault2kms = require('./vault2kms');
const pluginConfig = require('./plugin_config');
const kmsConfig = require('./kms_config');
const getGroups = require('./utils/get-groups');

class ServerlessServiceConfig {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.serverlessLog = serverless.cli.log.bind(serverless.cli);
    this.configurationVariablesSources = {
      serviceConfig: {
        resolve: this.getServiceConfig.bind(this)
      },
      secretConfig: {
        resolve: this.getSecretConfig.bind(this)
      }
    };
  }

  useLocalEnvVars() {
    const { service_config_plugin } = this.serverless.service.custom;
    const { provider } = this.serverless.service;

    const stage = (this.options && this.options.stage) || (provider && provider.stage);

    const { localEnvVarStages } = service_config_plugin;

    if (localEnvVarStages && localEnvVarStages.includes(stage)) {
      this.serverlessLog(
        `Service config will use local environment variables: 'custom.service_config_plugin.localEnvVarStages' includes current stage '${stage}'`
      );
      return true;
    }

    return false;
  }

  static getEnvVar(path) {
    const envVar = path.substring(path.lastIndexOf('/') + 1);

    return {value: process.env[envVar]};
  }

  async getServiceConfig(param) {
    // console.log(param)
    const { path, fallback } = getGroups( param.address);
    // console.log(path)
    // const path = param.address
    if (this.useLocalEnvVars()) {
      return ServerlessServiceConfig.getEnvVar(path);
    }
    const { service_config_plugin } = this.serverless.service.custom;
    const config = pluginConfig.load(service_config_plugin);

    return consul.get(`${config.consulUrl()}${path}`, fallback)
  }

  async getSecretConfig(param ) {
    const { path, fallback } = getGroups(param.address);

    if (this.useLocalEnvVars()) {
      return ServerlessServiceConfig.getEnvVar(path);
    }

    const { service_config_plugin } = this.serverless.service.custom;
    const { stage } = this.serverless.service.provider;

    const config = pluginConfig.load(service_config_plugin);

    const { kmsKeyId = {}, kmsKeyConsulPath } = config;
    let kmsKeyIdValue;
    if (kmsKeyConsulPath && typeof kmsKeyConsulPath === 'string') {
      kmsKeyIdValue = await this.getServiceConfig({address: kmsKeyConsulPath});
    } else if (kmsKeyId[stage]) {
      kmsKeyIdValue = kmsKeyId[stage];
    } else {
      throw new Error(
        `KMS Key Id missing, please specify it in in the plugin config with either:\nservice_config_plugin.kmsKeyConsulPath = path/to/key\n[DEPRECATED] service_config_plugin.kmsKeyId.${stage} = keyId`
      );
    }

    return vault2kms.retrieveAndEncrypt(
      `${config.consulUrl()}${path}`,
      config.vaultUrl(),
      kmsConfig.load(this.serverless),
      kmsKeyIdValue,
      fallback
    )
  }
}

module.exports = ServerlessServiceConfig;
