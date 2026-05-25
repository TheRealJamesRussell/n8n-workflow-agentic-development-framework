const {
	n8nRequest,
	requireDevelopmentEnv,
	validateRemoteDevelopmentWorkflow,
	writeJson
} = require('./n8n-lib');

async function main() {
	const config = requireDevelopmentEnv();
	const workflow = await n8nRequest(config, 'GET');
	validateRemoteDevelopmentWorkflow(config, workflow);

	writeJson(config.remoteSnapshotPath, workflow);

	console.log(`Pulled development workflow ${config.workflowId}`);
	console.log(`Wrote ${config.remoteSnapshotPath}`);
}

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});
