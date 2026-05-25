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
	getExecutionRunDataNodes
};
