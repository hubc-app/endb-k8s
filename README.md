# endb-k8s

This is a third-party adapter for [endb](https://github.com/chroventer/endb) to use kubernetes
as a backing store.

This allows us to use the etcd instance used by kubernetes itself to store our data.

It creates a custom resource type called `EtcdData`, and all data is saved in objects of this type.

### Usage

The default exported value is a function that initializes a store.

The function accepts an optional options object with the following fields:

-   `kubeconfig`: passed directly to `k8s.KubeConfig.loadFromOptions`
-   `skipApplyingCRD`: if true, the crd will be assumed to exist and be correct, and will not be
    applied on application start.

### Kubernetes permission model

In kubernetes, by default the service account is not allowed to change anything.

We need to enable the following permissions using an RBAC role:

1. `PATCH`ing CustomResourceDefinition.

    If you don't want to give your app this permission, you can create the crd directly by running
    `kubectl apply -f crd.json` with the crd.json provided in this project. Then, pass the option
    `skipApplyingCRD: true` in the options object

2. Full access to the `endbdata.hubc.app` data type.

    This permission model allows you to create read-only and read-write roles by using kubernetes's built-in RBAC.

### Usage example

```javascript
const Endb = require('endb');
const k8s = require('endb-k8s');

(async () => {
	try {
		const endb = new Endb({ store: await k8s(), namespace: 'endb-test' });

		await endb.set('dor', 'test');
		await endb.set('hello', 'world');
		console.log(`Hello ${await endb.get('hello')}`);
		console.log(await endb.all());
		console.log(await endb.has('dor'));
		console.log(await endb.has('not dor'));
	} catch (e) {
		console.error(e);
	}
})();
```
