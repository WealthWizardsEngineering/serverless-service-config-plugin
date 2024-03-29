# serverless-service-config-plugin
Serverless Plugin to retrieve config and secrets for services in Consul and Vault

All secrets from Vault are encrypted with a KMS key by the plugin. This to prevent secrets leaking into the Cloudformation templates, which end up being readable in the AWS Console. This means they must be decrypted in code using KMS after being retrieved from environment.

## Usage:

```yaml
custom:
    myVaultVar: ${vault:/secrets/mysecret} # takes secret at /secrets/mysecret from Vault, KMS encrypts it, and makes it available as a custom variable
    myConsulVar: ${consul:/app.json/green/myconfig} # takes kv item from path in Consul and makes it available as a custom variable 
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
    functions:
        calculate:
            handler: src/handlers.calculate
            environment:
                # BEWARE: This will require KMS decryption to be useable
                MY_SECRET_VAR: ${self:custom.myVaultVar}
                # This will be plaintext
                MY_CONFIG_VAR: ${self:custom.myConsulVar}
            events:
                - http:
                path: /v1/calculate
                method: post
```

## Upgrade to plugin 1.0 / slsv3:
Serverless v3 contained some [major changes](https://www.serverless.com/framework/docs/guides/upgrading-v3) to how custom variables and parameters are used, notably that arbitrary CLI parameters are no longer permitted. WealthWizards used these heavily. Thankfully they also added in params as a good alternative. When migrating a project to serverless framework v3 / v1.0 of this plugin, you will need be mindful of the following:

- Any use of custom variables dependant on `opt` interpolation and custom cli vars will no longer work, e.g.
```yaml
  tenant: ${opt:tenant, 'tenant'}
```
This should be replaced by the use of params:
```yaml
  tenant: ${param:tenant}
```
Params can be specified on the CLI, and helpfully you can also provide per stage params in your yml alongside a default. As a simple example:
```yaml
params:
  default:
    accountId: xxxx
    accountName: proof
  red:
    accountId: yyyy
    accountName: prod
```

- Stage is the source of truth for your environment. Remove any redundant variables such as `{opt.environment}`, these should no longer be required when using `params`. This makes deploying personal stacks and feature branches simpler too, as `params` allows for having default parameter sets within YML (see above).

_Aside_: From what I can glean, this does mean that compiling a single artifact of code + CF template is no longer possible, as the stage and its parameters are required at _package time_. These are then baked into the Cloudformation template.

- Bonus breakage: Changed interface and usage to be more direct. `serviceConfig` and `secretConfig` have been replaced by `consul` and `vault` respectively. The existing pattern of using `secretConfig` pointing to a Consul path, whose value contains a Vault path, has been replaced with a direct vault path.
