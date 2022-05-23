const aws = require('aws-sdk');

const load = (serverlessConfig = {}) => {
  const awsConfig = {};

  const { service } = serverlessConfig;

  if (service && service.provider && service.provider.region) {
    awsConfig.region = service.provider.region;
  }
  
  return new aws.KMS(awsConfig);
};

module.exports = {
  load,
};
