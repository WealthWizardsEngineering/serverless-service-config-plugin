# serverless-service-config-plugin
Serverless Plugin to retrieve config and secrets for services in Consul and Vault

Usage:

```yaml
custom:
    service_config_plugin:
        consulAddr: https://consul.corp.domain
        consulPrefix: app_config_vars/
        vaultAddr: https://vault.corp.domain
        kmsKeyId:
            proof: 87y3gh4ei982yh3jeiou2yh2j3eorue1
            prod: 2349u23iuh2j3oiuh2j3oi2j3eo
        # Array of stages that should use environment variables instead
        # of consul to fulfill service config variables
        # the segment of the path after the last "/" will be looked for in process.envs
        localEnvVarStages:
            - local
            - test
```
