function usage(command) {
	return [
		`Usage: ${command} [--only <fixture-name> ...]`,
		'',
		'Options:',
		'  --only, -o   Run only the named fixture(s).',
		'  --help, -h   Show this help.'
	].join('\n');
}

function parseTestRunnerArgs(argv, command) {
	const only = [];
	let readingOnly = false;

	for (const arg of argv) {
		if (arg === '--help' || arg === '-h') {
			return { help: true, only, usage: usage(command) };
		}

		if (arg === '--only' || arg === '-o') {
			readingOnly = true;
			continue;
		}

		if (arg.startsWith('-')) {
			throw new Error(`Unknown option ${arg}.\n\n${usage(command)}`);
		}

		if (!readingOnly) {
			throw new Error(`Unexpected argument ${arg}. Use --only ${arg} to run a specific fixture.\n\n${usage(command)}`);
		}

		only.push(arg);
	}

	if (readingOnly && only.length === 0) {
		throw new Error(`--only requires at least one fixture name.\n\n${usage(command)}`);
	}

	return { help: false, only, usage: usage(command) };
}

function filterNames(allNames, selectedNames, label) {
	if (!selectedNames || selectedNames.length === 0) return allNames;

	const available = new Set(allNames);
	const missing = selectedNames.filter(name => !available.has(name));

	if (missing.length > 0) {
		throw new Error([
			`Unknown ${label}: ${missing.join(', ')}`,
			allNames.length > 0
				? `Available ${label}s: ${allNames.join(', ')}`
				: `No ${label}s are available.`
		].join('\n'));
	}

	const selected = new Set(selectedNames);
	return allNames.filter(name => selected.has(name));
}

module.exports = {
	filterNames,
	parseTestRunnerArgs
};
