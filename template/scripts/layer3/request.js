const fs = require('fs');
const path = require('path');

function generateTestRunId(fixtureName) {
	const timestamp = new Date().toISOString()
		.replace(/[-:.]/g, '')
		.replace('T', 't')
		.replace('Z', 'z');
	const random = Math.random().toString(16).slice(2, 10);

	return `DEV_TEST__${timestamp}__${fixtureName}__${random}`;
}

function readPayloadFile(fixture, filePath) {
	return fs.readFileSync(path.resolve(fixture.dir, filePath));
}

function interpolate(value, fixture) {
	if (typeof value === 'string') {
		return value.replaceAll('{{testRunId}}', fixture.testRunId || '');
	}

	if (Array.isArray(value)) {
		return value.map(item => interpolate(item, fixture));
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, interpolate(item, fixture)])
		);
	}

	return value;
}

function buildJsonRequest(fixture) {
	const body = fixture.request?.bodyFile
		? JSON.parse(readPayloadFile(fixture, fixture.request.bodyFile).toString('utf8'))
		: fixture.request?.body || {};

	return {
		body: JSON.stringify(interpolate(body, fixture)),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(interpolate(fixture.request?.headers || {}, fixture))
		}
	};
}

function buildFormDataRequest(fixture) {
	const form = new FormData();

	for (const [name, value] of Object.entries(fixture.request?.fields || {})) {
		form.append(name, interpolate(value, fixture));
	}

	for (const file of fixture.request?.files || []) {
		const buffer = readPayloadFile(fixture, file.path);
		form.append(
			file.field,
			new Blob([buffer], { type: file.contentType || 'application/octet-stream' }),
			file.filename || path.basename(file.path)
		);
	}

	return {
		body: form,
		headers: {
			Accept: 'application/json',
			...(interpolate(fixture.request?.headers || {}, fixture))
		}
	};
}

function buildRequest(fixture) {
	const type = fixture.request?.type || 'json';
	if (type === 'formData') return buildFormDataRequest(fixture);
	if (type === 'json') return buildJsonRequest(fixture);
	throw new Error(`Fixture ${fixture.name} has unsupported request.type "${type}".`);
}

function addDevelopmentWebhookAuthHeader(request, config) {
	if (!config.developmentWebhookSecret) {
		throw new Error([
			'Missing required development webhook secret.',
			'Set N8N_DEVELOPMENT_WEBHOOK_SECRET before running Layer 3 workflow tests.'
		].join(' '));
	}

	return {
		...request,
		headers: {
			...request.headers,
			[config.developmentWebhookSecretHeader || 'X-N8N-Development-Webhook-Secret']: config.developmentWebhookSecret
		}
	};
}

function prepareFixtureUpload(fixture) {
	fixture.upload = {};
}

async function postFixture(url, fixture, config) {
	const request = addDevelopmentWebhookAuthHeader(buildRequest(fixture), config);
	const response = await fetch(url, {
		method: fixture.request?.method || 'POST',
		body: request.body,
		headers: request.headers
	});

	const text = await response.text();
	let payload = null;

	if (text) {
		try {
			payload = JSON.parse(text);
		} catch (error) {
			payload = { raw: text };
		}
	}

	if (!response.ok) {
		const detail = payload?.message || payload?.raw || response.statusText;
		throw new Error(`Development webhook failed with HTTP ${response.status}: ${detail}`);
	}

	return payload;
}

module.exports = {
	generateTestRunId,
	prepareFixtureUpload,
	postFixture
};
