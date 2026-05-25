const {
	assertDevelopmentTestWebhookIfPresent,
	comparableWorkflow,
	createDevelopmentWorkflowVariant,
	n8nRequest,
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
	writeJson(developmentVariant.variantPath, developmentVariant.workflow);

	const remoteWorkflow = await n8nRequest(config, 'GET');
	validateRemoteDevelopmentWorkflow(config, remoteWorkflow);
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
