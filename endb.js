const kubernetes = require('./kubernetes');

const isErrorCode = (expectedStatusCode, error) =>
	error && error.response && error.response.status === expectedStatusCode;

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
			name = this.removeUselessPrefix(name);
			await client.delete({ ...this, name });
		},
		async get(name) {
			try {
				name = this.removeUselessPrefix(name);
				const result = await client.get({ ...this, name });
				return result.value;
			} catch (e) {
				if (isErrorCode(404, e)) {
					return null;
				} else {
					throw e;
				}
			}
		},
		async has(name) {
			return (await this.get(name)) !== null;
		},
		async set(name, value) {
			name = this.removeUselessPrefix(name);
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
