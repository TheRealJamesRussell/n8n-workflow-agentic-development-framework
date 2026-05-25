function webhookUrl(config) {
	if (!config.testWebhookPath) {
		throw new Error(
			'manifest.json is missing environments.development.entrypoints.testWebhookPath; configure it before running Layer 3 workflow tests.'
		);
	}

	return `${config.baseUrl}/webhook/${encodeURIComponent(config.testWebhookPath)}`;
}

async function fetchExecution(config, executionId) {
	if (!executionId) return null;

	const response = await fetch(
		`${config.baseUrl}/api/v1/executions/${encodeURIComponent(executionId)}?includeData=true`,
		{
			headers: {
				Accept: 'application/json',
				'X-N8N-API-KEY': config.apiKey
			}
		}
	);

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
		throw new Error(`n8n execution fetch failed with HTTP ${response.status}: ${detail}`);
	}

	return payload;
}

module.exports = {
	fetchExecution,
	webhookUrl
};
