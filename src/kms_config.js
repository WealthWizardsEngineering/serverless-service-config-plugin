const { KMS } = require('@aws-sdk/client-kms');

const load = (serverlessConfig = {}) => {
  const awsConfig = {};

  const { service } = serverlessConfig;

  if (service && service.provider && service.provider.region) {
    awsConfig.region = service.provider.region;
  }

  return new KMS(awsConfig);
};

module.exports = {
  load,
};
