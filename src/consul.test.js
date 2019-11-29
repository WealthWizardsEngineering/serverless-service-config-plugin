const proxyquire = require('proxyquire').noCallThru();
const test = require('tape');
const sinon = require('sinon');

const requestStub = sinon.stub();

const consul = proxyquire('./consul', { 'request-promise-native': requestStub });

test('before', t => {
    process.env.CONSUL_TOKEN = 'myToken';
    t.end();
})

test('should retrieve data from consul', async assert => {

    assert.plan(1);

    requestStub.reset();
    requestStub
        .withArgs({
            url: 'http://consul/kv/myKey',
            headers: {
                'X-Consul-Token': 'myToken'
            },
            json: true
        })
        .resolves([
            { Value: 'dGhpcyBpcyBteSBjb25maWcgdmFsdWU=' }
        ]);

    const consulValue = await consul.get('http://consul/kv/myKey');

    assert.equal(consulValue, 'this is my config value');
})

test('should fail if no value is found', async assert => {
    assert.plan(3);

    requestStub.reset();
    requestStub.onFirstCall().resolves([ { otherKey: 'Value missing' }])
        .onSecondCall().resolves([])
    
    requestStub.resolves(null);

    for (let i = 0; i <= 2; i++) {
        try {
            await consul.get('http://consul/kv/myKey');
        } catch(e) {
            assert.equal(e.message, 'Missing value at http://consul/kv/myKey')
        }
    }
})

test('after', t => {
    delete process.env.CONSUL_TOKEN;
    t.end();
})

test('should fail if consul token not present', async assert => {
    assert.plan(1);

    try {
        await consul.get('http://consul/kv/myKey')
    } catch (e) {
        assert.equal(e.message, 'Missing consul token for authentication, you need to set CONSUL_TOKEN as a environment variable')
    }
})