const { requireDevelopmentEnv } = require('./n8n-lib');
const {
	assertExecutionNodes,
	assertFixtureResponse,
	getExecutionRunDataNodes,
	getLastExecutionNode,
	summarizeExecution
} = require('./layer3/assertions');
const { discoverFixtures } = require('./layer3/fixtures');
const { fetchExecution, findExecutionByTestRunId, webhookUrl } = require('./layer3/n8n-api');
const { writeReport } = require('./layer3/report');
const { generateTestRunId, postFixture, prepareFixtureUpload } = require('./layer3/request');
const { parseTestRunnerArgs } = require('./test-runner-args');

function createFixtureProgress(fixtureName) {
	const isTty = process.stdout.isTTY === true;
	const message = `RUN ${fixtureName}`;
	let interval = null;
	let dotCount = 0;

	function render() {
		const dots = '.'.repeat((dotCount % 3) + 1).padEnd(3, ' ');
		process.stdout.write(`\r${message} ${dots}`);
		dotCount += 1;
	}

	return {
		start() {
			if (!isTty) {
				console.log(message);
				return;
			}

			render();
			interval = setInterval(render, 300);
		},
		stop() {
			if (!isTty) return;
			clearInterval(interval);
			interval = null;
			process.stdout.write('\r\x1b[2K');
		}
	};
}

async function runFixture(config, url, fixture) {
	fixture.testRunId = generateTestRunId(fixture.name);
	prepareFixtureUpload(fixture);

	const response = await postFixture(url, fixture, config);
	assertFixtureResponse(fixture, response);

	let execution = null;
	if (response.executionId) {
		execution = await fetchExecution(config, response.executionId);
	} else {
		execution = await findExecutionByTestRunId(config, fixture.testRunId);
	}

	if (!response) {
		const lastNode = getLastExecutionNode(execution);
		const error = new Error([
			`${fixture.name} workflow did not return the development test response.`,
			lastNode ? `Last executed node: ${lastNode}.` : 'No matching execution data was found.'
		].join(' '));
		error.details = {
			execution: summarizeExecution(execution)
		};
		throw error;
	}

	if (execution) {
		assertExecutionNodes(fixture, execution);
	}

	return {
		name: fixture.name,
		testRunId: fixture.testRunId,
		status: 'passed',
		executionId: response.executionId || null,
		response,
		execution: execution ? {
			id: execution.id,
			status: execution.status,
			workflowId: execution.workflowId,
			runDataNodes: getExecutionRunDataNodes(execution)
		} : null
	};
}

async function main() {
	const args = parseTestRunnerArgs(process.argv.slice(2), 'node scripts/run-development-fixtures.js');
	if (args.help) {
		console.log(args.usage);
		return;
	}

	const config = requireDevelopmentEnv({ requireTestWebhook: true });
	const fixtures = discoverFixtures(undefined, { only: args.only });

	if (fixtures.length === 0) {
		console.log('No development fixtures found in tests/development-fixtures; skipping Layer 3 workflow tests.');
		return;
	}

	const url = webhookUrl(config);
	const results = [];

	for (const fixture of fixtures) {
		const progress = createFixtureProgress(fixture.name);
		progress.start();

		try {
			const result = await runFixture(config, url, fixture);
			progress.stop();
			results.push(result);
			console.log(`PASS ${fixture.name}`);
		} catch (error) {
			if (!error.details?.execution && fixture.testRunId) {
				try {
					const execution = await findExecutionByTestRunId(config, fixture.testRunId);
					if (execution) {
						error.details = {
							...(error.details || {}),
							execution: summarizeExecution(execution)
						};
					}
				} catch (executionError) {
					error.details = {
						...(error.details || {}),
						executionFetchError: executionError.message
					};
				}
			}

			progress.stop();
			results.push({
				name: fixture.name,
				testRunId: fixture.testRunId || null,
				status: 'failed',
				error: error.message,
				details: error.details || null
			});
			console.error(`FAIL ${fixture.name}: ${error.message}`);
			break;
		}
	}

	const reportPath = writeReport(results);
	const failures = results.filter(result => result.status !== 'passed');
	console.log(`Wrote ${reportPath}`);

	if (failures.length > 0) process.exit(1);
}

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});
