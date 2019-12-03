const aws = require('aws-sdk');

const load = (serverlessConfig = {}) => {
  const awsConfig = {};

  if (serverlessConfig.provider && serverlessConfig.provider.region) {
    awsConfig.region = serverlessConfig.provider.region;
  }

  const profile = this.serverless.variables.options['aws-profile'];

  if (profile) {
    awsConfig.credentials = new aws.SharedIniFileCredentials({ profile });
  }

  return new aws.KMS(awsConfig);
};

module.exports = {
  load,
};
