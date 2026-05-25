const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = 'tests/code-node-fixtures';
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function repoPath(relativePath) {
	return path.join(REPO_ROOT, relativePath);
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readWorkflow() {
	const manifest = readJson(repoPath('manifest.json'));
	return readJson(repoPath(manifest.source || 'workflow.json'));
}

function makeInputApi(items) {
	return {
		all() {
			return items;
		},
		first() {
			return items[0] || { json: {} };
		}
	};
}

function makeDollar(nodeOutputs) {
	return function dollar(nodeName) {
		const items = nodeOutputs[nodeName] || [];

		return {
			all() {
				return items;
			},
			first() {
				return items[0] || { json: {} };
			},
			get item() {
				return items[0] || { json: {} };
			}
		};
	};
}

function getCode(workflow, nodeName) {
	const node = workflow.nodes.find(candidate => candidate.name === nodeName);
	if (!node) throw new Error(`Could not find Code node "${nodeName}"`);

	const code = node.parameters?.jsCode;
	if (!code) throw new Error(`Node "${nodeName}" does not have parameters.jsCode`);

	return code;
}

async function runCode(code, { inputItems = [], nodeOutputs = {}, context = {} } = {}) {
	const fn = new AsyncFunction('$input', '$', code);
	return await fn.call(context, makeInputApi(inputItems), makeDollar(nodeOutputs));
}

function discoverFixtures() {
	const root = repoPath(FIXTURES_DIR);
	if (!fs.existsSync(root)) return [];

	return fs.readdirSync(root, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => {
			const fixturePath = path.join(root, entry.name, 'fixture.json');
			if (!fs.existsSync(fixturePath)) {
				throw new Error(`Fixture ${entry.name} is missing fixture.json`);
			}

			return {
				name: entry.name,
				dir: path.dirname(fixturePath),
				...readJson(fixturePath)
			};
		})
		.sort((left, right) => left.name.localeCompare(right.name));
}

function resolveItems(fixtureDir, value) {
	if (value?.file) {
		return readJson(path.resolve(fixtureDir, value.file));
	}

	return value || [];
}

function assertJsonEqual(actual, expected, label) {
	const actualJson = JSON.stringify(actual);
	const expectedJson = JSON.stringify(expected);

	if (actualJson !== expectedJson) {
		throw new Error(`${label}: expected ${expectedJson}, got ${actualJson}`);
	}
}

async function runFixture(workflow, fixture) {
	const nodeName = fixture.node;
	if (!nodeName) throw new Error(`Fixture ${fixture.name} must declare node`);

	const code = getCode(workflow, nodeName);
	const output = await runCode(code, {
		inputItems: resolveItems(fixture.dir, fixture.input),
		nodeOutputs: fixture.nodeOutputs || {},
		context: fixture.context || {}
	});

	if (fixture.expected?.output !== undefined) {
		assertJsonEqual(output, fixture.expected.output, `${fixture.name} output`);
	}

	return { fixtureName: fixture.name };
}

async function main() {
	const workflow = readWorkflow();
	const fixtures = discoverFixtures();

	if (fixtures.length === 0) {
		console.log(`No Code-node fixtures found in ${FIXTURES_DIR}; skipping.`);
		return;
	}

	for (const fixture of fixtures) {
		const result = await runFixture(workflow, fixture);
		console.log(`PASS ${result.fixtureName}`);
	}
}

main().catch(error => {
	console.error(`FAIL ${error.message}`);
	process.exit(1);
});
