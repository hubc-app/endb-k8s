const k8s = require('@kubernetes/client-node');
const axios = require('axios');
const https = require('https');

const crd = require('./crd.json');

class Client {
	constructor(options) {
		this.config = this.createConfig(options);
		this.httpsAgent = this.createHttpsAgent(this.config);
		this.axios = this.createAxios(this.config, this.httpsAgent);
	}

	createConfig(options) {
		const config = new k8s.KubeConfig();
		if (options) {
			config.loadFromOptions(options);
		} else {
			config.loadFromDefault();
		}
		return config;
	}

	createHttpsAgent(config) {
		const options = {};
		config.applyHTTPSOptions(options);
		return new https.Agent(options);
	}

	createAxios(config, httpsAgent) {
		const cluster = config.getCurrentCluster();
		const baseURL = cluster && cluster.server;

		const options = {
			httpsAgent,
			baseURL,
		};
		config.applyToRequest(options);

		return axios.default.create(options);
	}

	async request(options) {
		const response = await this.axios(options);
		return response.data;
	}

	async applyCRD() {
		return await this.apply(
			{
				type: types.CustomResourceDefinition,
				name: crd.metadata.name,
			},
			crd
		);
	}

	async getAllInNamespace({ type, namespace }) {
		return await this.request({
			method: 'GET',
			url: type.allPattern({ namespace }),
		});
	}

	async get({ type, namespace, name }) {
		return await this.request({
			method: 'GET',
			url: type.namedPattern({ namespace, name }),
		});
	}

	async apply({ type, namespace, name }, data) {
		return await this.request({
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/apply-patch+yaml',
			},
			params: { fieldManager: 'endb-k8s', force: 'true' },
			url: type.namedPattern({ namespace, name }),
			data,
		});
	}

	async delete({ type, namespace, name }) {
		return await this.request({
			method: 'DELETE',
			url: type.namedPattern({ namespace, name }),
		});
	}

	async deleteAllInNamespace({ type, namespace }) {
		return await this.request({
			method: 'DELETE',
			url: type.allPattern({ namespace }),
		});
	}
}

const types = {
	CustomResourceDefinition: {
		allPattern: () => `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/`,
		namedPattern: ({ name }) =>
			`/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${name}`,
	},
	EndbData: {
		allPattern: ({ namespace }) => `/apis/hubc.app/v1/namespaces/${namespace}/endbdata`,
		namedPattern: ({ namespace, name }) =>
			`/apis/hubc.app/v1/namespaces/${namespace}/endbdata/${name}`,
	},
};

module.exports = {
	createClient: options => new Client(options),
	types,
};
