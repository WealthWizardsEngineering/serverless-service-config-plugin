const test = require('tape');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const consulStub = sinon.stub();
const vault2kmsStub = sinon.stub();
const kmsConfigStub = sinon.stub();

const consulSpy = sinon.spy(consulStub);
const vault2kmsSpy = sinon.spy(vault2kmsStub);

const ServerlessServiceConfig = proxyquire('./index', {
  './consul': { get: consulSpy },
  './vault2kms': { retrieveAndEncrypt: vault2kmsSpy },
  './kms_config': { load: kmsConfigStub }
});

test('useLocalEnvVars', (t) => {
  t.test('should return false when localEnvVarStages is not defined', async (assert) => {
    assert.plan(1);

    const service = new ServerlessServiceConfig(
      {
        service: {
          custom: {
            service_config_plugin: {
              consulAddr: 'http://consul',
              consulPrefix: 'prefix'
            }
          }
        },
        cli: {
          log(message) {
            // eslint-disable-next-line no-console
            console.log(message);
          }
        }
      },
      {
        stage: 'stage'
      }
    );

    const value = await service.useLocalEnvVars();

    assert.equal(value, false);
  });

  t.test(
    'should return true when stage defined in options is listed in localEnvVarStages',
    async (assert) => {
      assert.plan(1);

      const service = new ServerlessServiceConfig(
        {
          service: {
            custom: {
              service_config_plugin: {
                consulAddr: 'http://consul',
                consulPrefix: 'prefix',
                localEnvVarStages: ['stage']
              }
            }
          },
          cli: {
            log(message) {
              // eslint-disable-next-line no-console
              console.log(message);
            }
          }
        },
        {
          stage: 'stage'
        }
      );

      const value = await service.useLocalEnvVars();

      assert.equal(value, true);
    }
  );

  t.test(
    'should return false when stage defined in options is NOT listed in localEnvVarStages',
    async (assert) => {
      assert.plan(1);

      const service = new ServerlessServiceConfig(
        {
          service: {
            custom: {
              service_config_plugin: {
                consulAddr: 'http://consul',
                consulPrefix: 'prefix',
                localEnvVarStages: ['other stage']
              }
            }
          },
          cli: {
            log(message) {
              // eslint-disable-next-line no-console
              console.log(message);
            }
          }
        },
        {
          stage: 'stage'
        }
      );

      const value = await service.useLocalEnvVars();

      assert.equal(value, false);
    }
  );

  t.test(
    'should fallback to provider and return true when stage defined in provider is listed in localEnvVarStages',
    async (assert) => {
      assert.plan(1);

      const service = new ServerlessServiceConfig({
        service: {
          provider: {
            stage: 'stage'
          },
          custom: {
            service_config_plugin: {
              consulAddr: 'http://consul',
              consulPrefix: 'prefix',
              localEnvVarStages: ['stage']
            }
          }
        },
        cli: {
          log(message) {
            // eslint-disable-next-line no-console
            console.log(message);
          }
        }
      });

      const value = await service.useLocalEnvVars();

      assert.equal(value, true);
    }
  );

  t.test(
    'should fallback to provider and return false when stage defined in provider is NOT listed in localEnvVarStages',
    async (assert) => {
      assert.plan(1);

      const service = new ServerlessServiceConfig({
        service: {
          provider: {
            stage: 'stage'
          },
          custom: {
            service_config_plugin: {
              consulAddr: 'http://consul',
              consulPrefix: 'prefix',
              localEnvVarStages: ['other stage']
            }
          }
        },
        cli: {
          log(message) {
            // eslint-disable-next-line no-console
            console.log(message);
          }
        }
      });

      const value = await service.useLocalEnvVars();

      assert.equal(value, false);
    }
  );
});

test('serviceConfig', (t) => {
  t.test('should call consul with fallback', async (assert) => {
    assert.plan(1);
    const service = new ServerlessServiceConfig({
      service: {
        custom: {
          service_config_plugin: {
            consulAddr: 'http://consul',
            consulPrefix: 'prefix'
          }
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    });

    await service.getServiceConfig({ address: 'config_path/key, "fallback"' });
    assert.true(consulSpy.calledWith('http://consul/v1/kv/prefix/config_path/key', '"fallback"'));
  });

  t.test('should call consul to get config', async (assert) => {
    assert.plan(1);

    consulStub.reset();

    consulStub.withArgs('http://consul/v1/kv/prefix/config_path/key').resolves({ value: 'a sample value' });

    const service = new ServerlessServiceConfig({
      service: {
        custom: {
          service_config_plugin: {
            consulAddr: 'http://consul',
            consulPrefix: 'prefix'
          }
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    });

    const value = await service.getServiceConfig({ address: 'config_path/key' });
    assert.equal(value.value, 'a sample value');
  });

  t.test('should use process.env to get config when `useLocalEnvVars` is true', async (assert) => {
    assert.plan(1);

    consulStub.reset();

    process.env.key = 'an env var value';

    consulStub.withArgs('http://consul/v1/kv/prefix/config_path/key').resolves('a sample value');

    const service = new ServerlessServiceConfig({
      service: {
        provider: {
          stage: 'stage'
        },
        custom: {
          service_config_plugin: {
            consulAddr: 'http://consul',
            consulPrefix: 'prefix',
            localEnvVarStages: ['other', 'stage']
          }
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    });

    const value = await service.getServiceConfig({ address: 'config_path/key' });

    assert.equal(value.value, 'an env var value');
  });
});

test('secretConfig', (t) => {
  t.test('should query vault with fallback', async (assert) => {
    assert.plan(1);

    const kmsKeyId = {
      stage: 'kmsKeyId'
    };
    const slsConfig = {
      service: {
        provider: {
          stage: 'stage'
        },
        custom: {
          service_config_plugin: {
            consulAddr: 'http://consul',
            vaultAddr: 'http://vault_server',
            kmsKeyId
          }
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    };

    const service = new ServerlessServiceConfig(slsConfig);
    await service.getSecretConfig({ address: 'vault/my_secret/secret, "fallback"' });
    assert.true(
      vault2kmsStub.calledWith(
        'http://consul/v1/kv/vault/my_secret/secret',
        'http://vault_server/v1/',
        undefined,
        'kmsKeyId',
        '"fallback"'
      )
    );
  });

  t.test('should get value from consul and vault and encrypt with kms', async (assert) => {
    assert.plan(1);

    const fakeKms = {};
    const kmsKeyId = {
      stage: 'kmsKeyId'
    };
    const slsConfig = {
      service: {
        provider: {
          stage: 'stage'
        },
        custom: {
          service_config_plugin: {
            consulAddr: 'http://consul',
            vaultAddr: 'http://vault_server',
            kmsKeyId
          }
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    };

    vault2kmsStub.reset();
    vault2kmsStub
      .withArgs(
        'http://consul/v1/kv/vault/my_secret/secret',
        'http://vault_server/v1/',
        fakeKms,
        'kmsKeyId'
      )
      .resolves({ value: 'a base64 encrypted secret' });

    kmsConfigStub.reset();
    kmsConfigStub.withArgs(slsConfig).returns(fakeKms);

    const service = new ServerlessServiceConfig(slsConfig);

    const value = await service.getSecretConfig({ address: 'vault/my_secret/secret' });

    assert.equal(value.value, 'a base64 encrypted secret');
  });

  t.test('should be able to get kms key id from consul', async (assert) => {
    assert.plan(1);

    const fakeKms = {};
    const kmsKeyConsulPath = 'path/to/key_id';
    const slsConfig = {
      service: {
        provider: {
          stage: 'stage'
        },
        custom: {
          service_config_plugin: {
            consulAddr: 'http://consul',
            vaultAddr: 'http://vault_server',
            kmsKeyConsulPath
          }
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    };

    vault2kmsStub.reset();
    vault2kmsStub
      .withArgs(
        'http://consul/v1/kv/vault/my_secret/secret',
        'http://vault_server/v1/',
        fakeKms,
        'kmsKeyId'
      )
      .resolves({ value: 'a base64 encrypted secret' });

    kmsConfigStub.reset();
    kmsConfigStub.withArgs(slsConfig).returns(fakeKms);

    const getServiceConfigStub = sinon.stub();
    getServiceConfigStub.withArgs({ address: 'path/to/key_id' }).returns('kmsKeyId');

    const service = new ServerlessServiceConfig(slsConfig);

    service.getServiceConfig = getServiceConfigStub;

    const value = await service.getSecretConfig({ address: 'vault/my_secret/secret' });

    assert.equal(value.value, 'a base64 encrypted secret');
  });

  t.test('should fail if kms key id definition is missing', async (assert) => {
    assert.plan(1);

    const service = new ServerlessServiceConfig({
      service: {
        provider: {
          stage: 'dev'
        },
        custom: {
          service_config_plugin: {}
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    });

    try {
      await service.getSecretConfig({ address: 'vault/my_secret/secret' });
    } catch (e) {
      assert.match(e.message, /^KMS Key Id missing/);
    }
  });

  t.test('should fail if kms key id for stage is missing', async (assert) => {
    assert.plan(1);

    const service = new ServerlessServiceConfig({
      service: {
        provider: {
          stage: 'green'
        },
        custom: {
          service_config_plugin: {
            kmsKeyId: {
              blue: 'myKey'
            }
          }
        }
      },
      cli: {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    });

    try {
      await service.getSecretConfig({ address: 'vault/my_secret/secret' });
    } catch (e) {
      assert.match(e.message, /^KMS Key Id missing/);
    }
  });

  t.test(
    'should use process.env to get secret config when `useLocalEnvVars` is true',
    async (assert) => {
      assert.plan(1);

      process.env.key = 'an env var value';

      const fakeKms = {};
      const kmsKeyId = {
        stage: 'kmsKeyId'
      };
      const slsConfig = {
        service: {
          provider: {
            stage: 'stage'
          },
          custom: {
            service_config_plugin: {
              consulAddr: 'http://consul',
              vaultAddr: 'http://vault_server',
              kmsKeyId,
              localEnvVarStages: ['other', 'stage']
            }
          }
        },
        cli: {
          log(message) {
            // eslint-disable-next-line no-console
            console.log(message);
          }
        }
      };

      vault2kmsStub.reset();
      vault2kmsStub
        .withArgs(
          'http://consul/v1/kv/vault/my_secret/secret',
          'http://vault_server/v1/',
          fakeKms,
          'kmsKeyId',
          null
        )
        .resolves('a base64 encrypted secret');

      kmsConfigStub.reset();
      kmsConfigStub.withArgs(slsConfig).returns(fakeKms);

      const service = new ServerlessServiceConfig(slsConfig);

      const value = await service.getServiceConfig({ address: 'config_path/key' });

      assert.equal(value.value, 'an env var value');
    }
  );
});
