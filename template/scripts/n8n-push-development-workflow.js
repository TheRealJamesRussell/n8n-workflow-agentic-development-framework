const {
	activateDevelopmentWorkflow,
	assertDevelopmentActivationSafety,
	assertDevelopmentTestWebhookIfPresent,
	comparableWorkflow,
	createDevelopmentWorkflowVariant,
	ensureDevelopmentTestWebhookAuth,
	n8nRequest,
	readJson,
	requireDevelopmentEnv,
	stableJson,
	validateRemoteDevelopmentWorkflow,
	workflowUpdatePayload,
	writeJson
} = require('./n8n-lib');

async function main() {
	const config = requireDevelopmentEnv();
	const localWorkflow = readJson(config.localWorkflowPath);
	const developmentVariant = createDevelopmentWorkflowVariant(localWorkflow, config);
	const remoteWorkflow = await n8nRequest(config, 'GET');
	validateRemoteDevelopmentWorkflow(config, remoteWorkflow);
	const webhookAuth = await ensureDevelopmentTestWebhookAuth(
		developmentVariant.workflow,
		remoteWorkflow,
		config
	);
	writeJson(developmentVariant.variantPath, developmentVariant.workflow);

	if (config.activateDevelopmentWorkflow) {
		assertDevelopmentActivationSafety(developmentVariant.workflow, config);
	}

	const payload = workflowUpdatePayload(developmentVariant.workflow, config);
	const updatedWorkflow = await n8nRequest(config, 'PUT', payload);
	validateRemoteDevelopmentWorkflow(config, updatedWorkflow);
	assertDevelopmentTestWebhookIfPresent(updatedWorkflow, config.manifest);

	if (config.activateDevelopmentWorkflow) {
		await activateDevelopmentWorkflow(config);
	}

	const finalRemoteWorkflow = await n8nRequest(config, 'GET');
	validateRemoteDevelopmentWorkflow(config, finalRemoteWorkflow);
	const webhookCheck = assertDevelopmentTestWebhookIfPresent(finalRemoteWorkflow, config.manifest);

	if (config.activateDevelopmentWorkflow && finalRemoteWorkflow.active !== true) {
		throw new Error(`Development workflow ${config.workflowId} was not active after activation.`);
	}

	const localComparable = stableJson(comparableWorkflow(developmentVariant.workflow));
	const remoteComparable = stableJson(comparableWorkflow(finalRemoteWorkflow));

	if (localComparable !== remoteComparable) {
		throw new Error(
			`Remote development workflow ${config.workflowId} does not match ${developmentVariant.variantPath} after update.`
		);
	}

	writeJson(config.remoteSnapshotPath, finalRemoteWorkflow);

	console.log(`Updated development workflow ${config.workflowId}`);
	if (webhookAuth.preserved) {
		console.log(`Preserved development test webhook ${webhookAuth.authentication} authentication`);
	}
	if (webhookAuth.created) {
		console.log(`Created development test webhook ${webhookAuth.authentication} credential`);
	}
	if (webhookCheck.checked) {
		console.log(`Verified development test webhook node(s): ${webhookCheck.nodes.join(', ')}`);
	}
	if (config.activateDevelopmentWorkflow) {
		console.log(`Activated development workflow ${config.workflowId}`);
	}
	console.log(`Wrote ${developmentVariant.variantPath}`);
	console.log(`Wrote ${config.remoteSnapshotPath}`);
}

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});
