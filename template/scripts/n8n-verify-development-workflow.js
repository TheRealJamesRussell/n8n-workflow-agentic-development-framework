const {
	assertDevelopmentTestWebhookIfPresent,
	comparableWorkflow,
	createDevelopmentWorkflowVariant,
	n8nRequest,
	preserveDevelopmentTestWebhookAuth,
	readJson,
	requireDevelopmentEnv,
	stableJson,
	validateRemoteDevelopmentWorkflow,
	writeJson
} = require('./n8n-lib');

async function main() {
	const config = requireDevelopmentEnv();
	const localWorkflow = readJson(config.localWorkflowPath);
	const developmentVariant = createDevelopmentWorkflowVariant(localWorkflow, config);
	const remoteWorkflow = await n8nRequest(config, 'GET');
	validateRemoteDevelopmentWorkflow(config, remoteWorkflow);
	const preservedAuth = preserveDevelopmentTestWebhookAuth(
		developmentVariant.workflow,
		remoteWorkflow,
		config.manifest
	);
	writeJson(developmentVariant.variantPath, developmentVariant.workflow);
	const webhookCheck = assertDevelopmentTestWebhookIfPresent(remoteWorkflow, config.manifest);

	if (config.requireActiveWorkflow && remoteWorkflow.active !== true) {
		throw new Error(`Development workflow ${config.workflowId} is not active.`);
	}

	writeJson(config.remoteSnapshotPath, remoteWorkflow);

	const localComparable = stableJson(comparableWorkflow(developmentVariant.workflow));
	const remoteComparable = stableJson(comparableWorkflow(remoteWorkflow));

	if (localComparable !== remoteComparable) {
		throw new Error(
			`Remote development workflow ${config.workflowId} does not match ${developmentVariant.variantPath}.`
		);
	}

	console.log(`Verified development workflow ${config.workflowId} matches ${developmentVariant.variantPath}`);
	if (developmentVariant.developmentTestWebhook.added) {
		console.log(`Added development test webhook node in generated variant: ${developmentVariant.developmentTestWebhook.node.name}`);
	}
	if (preservedAuth.preserved) {
		console.log(`Preserved development test webhook ${preservedAuth.authentication} authentication`);
	}
	if (webhookCheck.checked) {
		console.log(`Verified development test webhook node(s): ${webhookCheck.nodes.join(', ')}`);
	}
	if (config.requireActiveWorkflow) {
		console.log(`Verified development workflow ${config.workflowId} is active`);
	}
}

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});
