const kubernetes = require('./kubernetes');

const createAdapter = async options => {
	const client = kubernetes.createClient(options);
	await client.applyCRD();

	return {
		type: kubernetes.types.EndbData,
		namespace: 'default',

		removeUselessPrefix(key) {
			return key.replace(`${this.namespace}:`, '');
		},

		async all() {
			const result = await client.getAllInNamespace({ ...this });
			return result.items.map(item => ({ key: item.metadata.name, value: item.value }));
		},
		async clear() {
			await client.deleteAllInNamespace({ ...this });
		},
		async delete(name) {
			await client.delete({ ...this, name });
		},
		async get(name) {
			const result = await client.get({ ...this, name });
			return result.value;
		},
		async has(name) {
			await client.get({ ...this, name });
		},
		async set(name, value) {
			const body = {
				apiVersion: 'hubc.app/v1',
				kind: 'EndbData',
				metadata: {
					namespace: this.namespace,
					name,
				},
				value,
			};
			await client.apply({ ...this, name }, body);
		},
	};
};

module.exports = createAdapter;
