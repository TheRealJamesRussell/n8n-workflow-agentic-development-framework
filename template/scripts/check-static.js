const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
	'manifest.json',
	'workflow.json',
	'package.json',
	'.env.development.example',
	'.gitignore',
	'scripts/n8n-lib.js',
	'scripts/run-code-node-fixtures.js',
	'scripts/run-development-fixtures.js',
	'scripts/layer3/assertions.js',
	'scripts/layer3/fixtures.js',
	'scripts/layer3/n8n-api.js',
	'scripts/layer3/report.js',
	'scripts/layer3/request.js',
	'tests/code-node-fixtures',
	'tests/development-fixtures'
];

const FORBIDDEN_TRACKED_PATTERNS = [
	/^\.env($|\.(?!.*example$))/,
	/^tmp\//,
	/:Zone\.Identifier$/
];

function repoPath(relativePath) {
	return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
	return JSON.parse(fs.readFileSync(repoPath(relativePath), 'utf8'));
}

function fail(message, details = {}) {
	return { ok: false, message, details };
}

function pass(message) {
	return { ok: true, message };
}

function fileExists(relativePath) {
	return fs.existsSync(repoPath(relativePath));
}

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function collectTrackedFiles() {
	try {
		const output = childProcess.execFileSync('git', ['ls-files'], {
			cwd: REPO_ROOT,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		}).trim();

		return output ? output.split('\n') : [];
	} catch (error) {
		return [];
	}
}

function checkRequiredFiles() {
	const missing = REQUIRED_FILES.filter(relativePath => !fileExists(relativePath));
	if (missing.length > 0) return fail('required files missing', { missing });
	return pass('required files exist');
}

function checkManifest() {
	const manifest = readJson('manifest.json');
	const requiredStringFields = ['schemaVersion', 'name', 'displayName', 'version', 'description', 'type', 'source'];
	const missing = requiredStringFields.filter(field => typeof manifest[field] !== 'string');

	if (missing.length > 0) {
		return fail('manifest is missing required string fields', { missing });
	}

	if (manifest.type !== 'n8n-workflow') {
		return fail('manifest type must be n8n-workflow', { type: manifest.type });
	}

	if (!fileExists(manifest.source)) {
		return fail('manifest source file does not exist', { source: manifest.source });
	}

	if (manifest.runtime?.name !== 'n8n') {
		return fail('manifest runtime name must be n8n', { runtime: manifest.runtime });
	}

	if (!isPlainObject(manifest.environments?.development)) {
		return fail('manifest must define environments.development');
	}

	if (!isPlainObject(manifest.environments?.production)) {
		return fail('manifest must define environments.production');
	}

	return pass('manifest is valid');
}

function checkWorkflowJson() {
	const manifest = readJson('manifest.json');
	const workflow = readJson(manifest.source);

	if (typeof workflow.name !== 'string' || workflow.name.trim() === '') {
		return fail('workflow name must be a non-empty string');
	}

	if (!Array.isArray(workflow.nodes)) {
		return fail('workflow nodes must be an array');
	}

	if (!isPlainObject(workflow.connections)) {
		return fail('workflow connections must be an object');
	}

	if (!isPlainObject(workflow.settings)) {
		return fail('workflow settings must be an object');
	}

	return pass('workflow JSON is valid');
}

function checkPackageScripts() {
	const packageJson = readJson('package.json');
	const scripts = packageJson.scripts || {};
	const requiredScripts = [
		'check',
		'test',
		'test:code',
		'test:workflow',
		'n8n:pull:development',
		'n8n:push:development',
		'n8n:verify:development'
	];
	const missing = requiredScripts.filter(script => typeof scripts[script] !== 'string');

	if (missing.length > 0) return fail('package scripts missing', { missing });
	return pass('package scripts exist');
}

function checkDevelopmentGuards() {
	const packageJson = readJson('package.json');
	const scripts = packageJson.scripts || {};
	const liveCommands = [
		'test:workflow',
		'n8n:pull:development',
		'n8n:push:development',
		'n8n:verify:development'
	];
	const unguarded = liveCommands.filter(script => {
		return !String(scripts[script] || '').includes('N8N_ENVIRONMENT=development');
	});

	if (unguarded.length > 0) {
		return fail('live n8n scripts must set N8N_ENVIRONMENT=development', { unguarded });
	}

	const n8nLib = fs.readFileSync(repoPath('scripts/n8n-lib.js'), 'utf8');
	if (!n8nLib.includes('N8N_ACTIVATE_DEVELOPMENT_WORKFLOW')) {
		return fail('development push must keep activation opt-in');
	}

	return pass('development command guards exist');
}

function checkNoForbiddenTrackedFiles() {
	const trackedFiles = collectTrackedFiles();
	const forbidden = trackedFiles.filter(file => {
		return FORBIDDEN_TRACKED_PATTERNS.some(pattern => pattern.test(file));
	});

	if (forbidden.length > 0) return fail('forbidden files are tracked', { forbidden });
	return pass('no forbidden files are tracked');
}

function runChecks() {
	return [
		checkRequiredFiles,
		checkManifest,
		checkWorkflowJson,
		checkPackageScripts,
		checkDevelopmentGuards,
		checkNoForbiddenTrackedFiles
	].map(check => check());
}

const results = runChecks();
const failures = results.filter(result => !result.ok);

for (const result of results) {
	console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.message}`);
	if (!result.ok && Object.keys(result.details || {}).length > 0) {
		console.log(JSON.stringify(result.details, null, 2));
	}
}

if (failures.length > 0) {
	process.exit(1);
}
