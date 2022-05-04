const aws = require('aws-sdk');

const load = (serverlessConfig = {}) => {
  console.log(serverlessConfig)
  const awsConfig = {};

  const { service, variables } = serverlessConfig;

  if (service && service.provider && service.provider.region) {
    awsConfig.region = service.provider.region;
  }

  const profile = variables.options['aws-profile'];

  if (profile) {
    awsConfig.credentials = new aws.SharedIniFileCredentials({ profile });
  }

  return new aws.KMS(awsConfig);
};

module.exports = {
  load,
};
