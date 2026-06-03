function fail(message, details = undefined) {
	const error = new Error(message);
	if (details !== undefined) error.details = details;
	throw error;
}

function assertEqual(actual, expected, label) {
	if (actual !== expected) {
		fail(`${label} mismatch`, { actual, expected });
	}
}

function assertIncludes(value, fragment, label) {
	if (!String(value || '').includes(fragment)) {
		fail(`${label} missing expected fragment`, { fragment });
	}
}

function assertArrayIncludesAll(actualValues, expectedValues, label) {
	const actual = new Set(Array.isArray(actualValues) ? actualValues : []);
	const missing = (expectedValues || []).filter(value => !actual.has(value));

	if (missing.length > 0) {
		fail(`${label} missing expected value(s)`, {
			missing,
			actual: [...actual]
		});
	}
}

function collectTypes(values) {
	return (Array.isArray(values) ? values : [])
		.map(value => value && value.type)
		.filter(Boolean);
}

function assertFixtureResponse(fixture, response) {
	const expected = fixture.expected.response || {};
	if (!response || typeof response !== 'object') {
		fail(`${fixture.name} response missing`, { response });
	}

	const result = response.result || {};

	if (expected.assertTestRunId === true) {
		assertEqual(response.testRunId, fixture.testRunId, `${fixture.name} response.testRunId`);
	}

	if (expected.status) {
		assertEqual(response.status, expected.status, `${fixture.name} response.status`);
	}

	if (expected.finalResultNode) {
		assertEqual(response.finalResultNode, expected.finalResultNode, `${fixture.name} response.finalResultNode`);
	}

	if (expected.completionTitle) {
		assertEqual(response.completionTitle, expected.completionTitle, `${fixture.name} response.completionTitle`);
	}

	for (const fragment of expected.completionMessageIncludes || []) {
		assertIncludes(response.completionMessage, fragment, `${fixture.name} response.completionMessage`);
	}

	assertArrayIncludesAll(
		collectTypes(result.errors),
		expected.errorTypes || [],
		`${fixture.name} result.errors`
	);

	assertArrayIncludesAll(
		collectTypes(result.warnings),
		expected.warningTypes || [],
		`${fixture.name} result.warnings`
	);
}

function getExecutionRunDataNodes(execution) {
	const runData = execution?.data?.resultData?.runData || {};
	return Object.keys(runData);
}

function getLastExecutionNode(execution) {
	const runData = execution?.data?.resultData?.runData || {};
	const entries = Object.entries(runData);

	if (entries.length === 0) return null;

	entries.sort(([, leftRuns], [, rightRuns]) => {
		const leftStart = Number(leftRuns?.[0]?.startTime || 0);
		const rightStart = Number(rightRuns?.[0]?.startTime || 0);
		return leftStart - rightStart;
	});

	return entries[entries.length - 1][0];
}

function summarizeExecution(execution) {
	if (!execution) return null;

	return {
		id: execution.id || null,
		status: execution.status || null,
		workflowId: execution.workflowId || null,
		lastNode: getLastExecutionNode(execution),
		error: execution.data?.resultData?.error?.message || null,
		runDataNodes: getExecutionRunDataNodes(execution)
	};
}

function assertExecutionNodes(fixture, execution) {
	const expectedNodes = fixture.expected.execution?.expectedNodes || [];
	if (expectedNodes.length === 0) return;

	assertArrayIncludesAll(
		getExecutionRunDataNodes(execution),
		expectedNodes,
		`${fixture.name} execution nodes`
	);
}

module.exports = {
	assertExecutionNodes,
	assertFixtureResponse,
	fail,
	getLastExecutionNode,
	summarizeExecution,
	getExecutionRunDataNodes
};
