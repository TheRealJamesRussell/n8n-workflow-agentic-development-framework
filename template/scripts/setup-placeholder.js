const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'manifest.json');
const WORKFLOW_PATH = path.join(REPO_ROOT, 'workflow.json');
const ENV_PATH = path.join(REPO_ROOT, '.env.development');
const TODO_PATH = path.join(REPO_ROOT, 'TODO.md');

function clean(value) {
	return String(value || '').trim();
}

function repoPath(relativePath) {
	return path.join(REPO_ROOT, relativePath);
}

function readJson(fullPath) {
	return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function writeJson(fullPath, data) {
	fs.writeFileSync(fullPath, `${JSON.stringify(data, null, 2)}\n`);
}

function loadDotEnv(fullPath) {
	if (!fs.existsSync(fullPath)) return {};

	const values = {};
	for (const line of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const equalsIndex = trimmed.indexOf('=');
		if (equalsIndex === -1) continue;

		const key = trimmed.slice(0, equalsIndex).trim();
		let value = trimmed.slice(equalsIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		values[key] = value;
	}

	return values;
}

function slugify(value) {
	const slug = clean(value)
		.toLowerCase()
		.replace(/['"]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return slug || 'project-name';
}

function normalizeBaseUrl(value) {
	return clean(value).replace(/\/+$/, '');
}

function parseWorkflowId(value) {
	const input = clean(value);
	if (!input) return '';

	try {
		const url = new URL(input);
		const segments = url.pathname.split('/').filter(Boolean);
		const workflowIndex = segments.findIndex(segment => segment === 'workflow' || segment === 'workflows');

		if (workflowIndex !== -1 && segments[workflowIndex + 1]) {
			return segments[workflowIndex + 1];
		}

		return segments[segments.length - 1] || input;
	} catch (error) {
		return input;
	}
}

function normalizeWorkflow(workflow, name) {
	if (!workflow || typeof workflow !== 'object') {
		throw new Error('n8n returned an invalid workflow payload.');
	}

	if (!Array.isArray(workflow.nodes)) {
		throw new Error('n8n workflow payload is missing nodes array.');
	}

	if (!workflow.connections || typeof workflow.connections !== 'object' || Array.isArray(workflow.connections)) {
		throw new Error('n8n workflow payload is missing connections object.');
	}

	return {
		name: clean(name || workflow.name) || 'project-name',
		nodes: workflow.nodes,
		connections: workflow.connections,
		settings: workflow.settings && typeof workflow.settings === 'object' && !Array.isArray(workflow.settings)
			? workflow.settings
			: { executionOrder: 'v1' }
	};
}

function workflowApiUrl(baseUrl, workflowId = '') {
	const suffix = workflowId ? `/${encodeURIComponent(workflowId)}` : '';
	return `${baseUrl}/api/v1/workflows${suffix}`;
}

async function n8nRequest({ baseUrl, apiKey }, method, url, body) {
	const response = await fetch(url, {
		method,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-N8N-API-KEY': apiKey
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	});

	const text = await response.text();
	let payload = null;

	if (text) {
		try {
			payload = JSON.parse(text);
		} catch (error) {
			payload = { raw: text };
		}
	}

	if (!response.ok) {
		const detail = payload?.message || payload?.raw || response.statusText;
		throw new Error(`n8n ${method} failed with HTTP ${response.status}: ${detail}`);
	}

	return payload;
}

function developmentWorkflowName(slug) {
	return `development_${slug}`;
}

function updateManifest({
	manifest,
	slug,
	displayName,
	description,
	author,
	developmentName,
	developmentBaseUrl = null,
	developmentWorkflowId = null,
	production = null
}) {
	return {
		...manifest,
		name: slug,
		displayName,
		description,
		author,
		source: 'workflow.json',
		environments: {
			development: {
				...(manifest.environments?.development || {}),
				baseUrl: developmentBaseUrl,
				workflowId: developmentWorkflowId,
				workflowName: developmentName,
				entrypoints: {}
			},
			production: production
				? {
					...(manifest.environments?.production || {}),
					baseUrl: production.baseUrl,
					workflowId: production.workflowId,
					workflowName: production.workflowName,
					entrypoints: {},
					releasePolicy: manifest.environments?.production?.releasePolicy || 'Not configured.'
				}
				: {
					...(manifest.environments?.production || {}),
					baseUrl: null,
					workflowId: null,
					workflowName: null,
					entrypoints: {},
					releasePolicy: manifest.environments?.production?.releasePolicy || 'Not configured.'
				}
		}
	};
}

function workflowPayload(workflow, name) {
	const normalized = normalizeWorkflow(workflow, name);
	return {
		name: normalized.name,
		nodes: normalized.nodes,
		connections: normalized.connections,
		settings: normalized.settings
	};
}

function envFileContent({ baseUrl, apiKey, workflowId, workflowName }) {
	return [
		'N8N_ENVIRONMENT=development',
		`N8N_BASE_URL=${baseUrl || ''}`,
		`N8N_API_KEY=${apiKey || ''}`,
		`N8N_DEVELOPMENT_WORKFLOW_ID=${workflowId || ''}`,
		`N8N_DEVELOPMENT_WORKFLOW_NAME=${workflowName || ''}`,
		'',
		'N8N_ACTIVATE_DEVELOPMENT_WORKFLOW=false',
		'N8N_REQUIRE_ACTIVE_WORKFLOW=false',
		'',
		'N8N_LOCAL_WORKFLOW_PATH=workflow.json',
		'N8N_DEVELOPMENT_VARIANT_PATH=tmp/n8n-development-workflow.generated.json',
		'N8N_REMOTE_SNAPSHOT_PATH=tmp/n8n-development-workflow.remote.json',
		''
	].join('\n');
}

function todoContent() {
	return [
		'# Project TODO',
		'',
		'- [ ] Review workflow architecture.',
		'- [ ] Identify required credentials.',
		'- [ ] Identify triggers and entrypoints.',
		'- [ ] Decide development test webhook path after workflow inspection.',
		'- [ ] Classify external side effects.',
		'- [ ] Rate live testability.',
		'- [ ] Add Code-node fixtures.',
		'- [ ] Add Layer 3 workflow fixtures.',
		'- [ ] Harden development webhook access.',
		''
	].join('\n');
}

function mask(value) {
	const text = clean(value);
	if (!text) return '(not set)';
	if (text.length <= 8) return '********';
	return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

class Prompter {
	constructor() {
		this.isTty = process.stdin.isTTY === true;
		this.rl = this.isTty
			? readline.createInterface({ input: process.stdin, output: process.stdout })
			: null;
		this.answers = this.isTty
			? []
			: fs.readFileSync(0, 'utf8').split(/\r?\n/);
	}

	async question(label) {
		if (this.rl) return this.rl.question(label);

		process.stdout.write(label);
		return this.answers.length > 0 ? this.answers.shift() : '';
	}

	close() {
		if (this.rl) this.rl.close();
	}
}

async function promptSecret(prompter, label, existingValue = '') {
	if (!prompter.rl) {
		const suffix = existingValue ? ' [existing value]' : '';
		process.stdout.write(`${label}${suffix}: `);
		const answer = prompter.answers.length > 0 ? prompter.answers.shift() : '';
		return clean(answer) || existingValue;
	}

	const suffix = existingValue ? ' [existing value]' : '';
	const output = prompter.rl.output;
	const originalWrite = output.write;

	output.write = function maskedWrite(chunk, encoding, callback) {
		const text = String(chunk);
		if (text.includes(label) || text.includes(suffix) || text.includes(': ')) {
			return originalWrite.call(output, chunk, encoding, callback);
		}
		return true;
	};

	try {
		const answer = clean(await prompter.rl.question(`${label}${suffix}: `));
		originalWrite.call(output, '\n');
		return answer || existingValue;
	} finally {
		output.write = originalWrite;
	}
}

async function promptRequired(prompter, label, defaultValue = '') {
	while (true) {
		const suffix = defaultValue ? ` [${defaultValue}]` : '';
		const answer = clean(await prompter.question(`${label}${suffix}: `)) || defaultValue;
		if (answer) return answer;
		console.log(`${label} is required.`);
	}
}

async function promptOptional(prompter, label, defaultValue = '') {
	const suffix = defaultValue ? ` [${defaultValue}]` : '';
	return clean(await prompter.question(`${label}${suffix}: `)) || defaultValue;
}

async function promptYesNo(prompter, label, defaultValue = false) {
	const suffix = defaultValue ? ' [Y/n]' : ' [y/N]';
	const answer = clean(await prompter.question(`${label}${suffix}: `)).toLowerCase();
	if (!answer) return defaultValue;
	return answer === 'y' || answer === 'yes';
}

async function promptMode(prompter) {
	while (true) {
		console.log('What are you setting up?');
		console.log('1. Existing n8n workflow');
		console.log('2. Start from scratch');

		const answer = clean(await prompter.question('Choose 1 or 2: '));
		if (answer === '1') return 'existing';
		if (answer === '2') return 'scratch';
		console.log('Choose 1 or 2.');
	}
}

async function getN8nConfig(prompter, envValues) {
	const existingApiKey = process.env.N8N_API_KEY || envValues.N8N_API_KEY || '';
	const baseUrl = normalizeBaseUrl(await promptRequired(
		prompter,
		'n8n base URL',
		process.env.N8N_BASE_URL || envValues.N8N_BASE_URL || ''
	));
	const apiKey = await promptSecret(
		prompter,
		'n8n API key',
		existingApiKey
	);

	if (!apiKey) {
		throw new Error('n8n API key is required.');
	}

	return { baseUrl, apiKey };
}

function printSummary(summary) {
	console.log('\nSetup summary');
	console.log(`Mode: ${summary.mode}`);
	console.log(`Workflow name: ${summary.workflowName}`);
	console.log(`Project slug: ${summary.slug}`);
	console.log(`Description: ${summary.description}`);
	console.log(`Author: ${summary.author || '(not set)'}`);
	console.log(`Development workflow name: ${summary.developmentName}`);
	console.log(`Create development workflow: ${summary.createDevelopmentWorkflow ? 'yes' : 'no'}`);
	console.log(`Save .env.development: ${summary.saveEnv ? 'yes' : 'no'}`);

	if (summary.n8nConfig) {
		console.log(`n8n base URL: ${summary.n8nConfig.baseUrl}`);
		console.log(`n8n API key: ${mask(summary.n8nConfig.apiKey)}`);
	}
}

async function existingWorkflowSetup(prompter, envValues, manifest) {
	const n8nConfig = await getN8nConfig(prompter, envValues);
	const workflowRef = await promptRequired(prompter, 'Production workflow URL or workflow ID');
	const productionWorkflowId = parseWorkflowId(workflowRef);
	const remoteWorkflow = await n8nRequest(
		n8nConfig,
		'GET',
		workflowApiUrl(n8nConfig.baseUrl, productionWorkflowId)
	);
	const pulledWorkflow = normalizeWorkflow(remoteWorkflow);
	const workflowName = pulledWorkflow.name;
	const slug = slugify(workflowName);
	const developmentName = developmentWorkflowName(slug);
	const description = await promptRequired(prompter, 'Description', manifest.description || '');
	const author = await promptOptional(prompter, 'Author (optional)', manifest.author || '');
	const createDevelopmentWorkflow = await promptYesNo(prompter, 'Create a separate development workflow now?', true);
	const saveEnv = await promptYesNo(prompter, 'Save n8n values to .env.development?', false);

	const summary = {
		mode: 'existing n8n workflow',
		workflowName,
		slug,
		description,
		author,
		developmentName,
		createDevelopmentWorkflow,
		saveEnv,
		n8nConfig
	};
	printSummary(summary);

	if (!await promptYesNo(prompter, 'Proceed?', true)) {
		console.log('Setup cancelled.');
		return;
	}

	let developmentWorkflowId = null;

	if (createDevelopmentWorkflow) {
		const created = await n8nRequest(
			n8nConfig,
			'POST',
			workflowApiUrl(n8nConfig.baseUrl),
			workflowPayload(pulledWorkflow, developmentName)
		);
		developmentWorkflowId = clean(created?.id);
		if (!developmentWorkflowId) {
			throw new Error('n8n did not return an ID for the created development workflow.');
		}
	}

	const nextManifest = updateManifest({
		manifest,
		slug,
		displayName: workflowName,
		description,
		author,
		developmentName,
		developmentBaseUrl: createDevelopmentWorkflow ? n8nConfig.baseUrl : null,
		developmentWorkflowId,
		production: {
			baseUrl: n8nConfig.baseUrl,
			workflowId: productionWorkflowId,
			workflowName
		}
	});

	writeJson(WORKFLOW_PATH, pulledWorkflow);
	writeJson(MANIFEST_PATH, nextManifest);
	fs.writeFileSync(TODO_PATH, todoContent());

	if (saveEnv) {
		fs.writeFileSync(ENV_PATH, envFileContent({
			baseUrl: n8nConfig.baseUrl,
			apiKey: n8nConfig.apiKey,
			workflowId: developmentWorkflowId,
			workflowName: developmentName
		}));
	}

	console.log('\nSetup complete.');
	console.log('Next: review TODO.md and inspect the workflow before adding development test webhook metadata.');
}

async function scratchSetup(prompter, envValues, manifest) {
	const workflowName = await promptRequired(prompter, 'Workflow name');
	const slug = slugify(workflowName);
	const developmentName = developmentWorkflowName(slug);
	const description = await promptRequired(prompter, 'Description', manifest.description || '');
	const author = await promptOptional(prompter, 'Author (optional)', manifest.author || '');
	const createDevelopmentWorkflow = await promptYesNo(prompter, 'Create an empty development workflow in n8n now?', true);
	const n8nConfig = createDevelopmentWorkflow ? await getN8nConfig(prompter, envValues) : null;
	const saveEnv = n8nConfig ? await promptYesNo(prompter, 'Save n8n values to .env.development?', false) : false;

	const summary = {
		mode: 'start from scratch',
		workflowName,
		slug,
		description,
		author,
		developmentName,
		createDevelopmentWorkflow,
		saveEnv,
		n8nConfig
	};
	printSummary(summary);

	if (!await promptYesNo(prompter, 'Proceed?', true)) {
		console.log('Setup cancelled.');
		return;
	}

	const blankWorkflow = normalizeWorkflow(readJson(WORKFLOW_PATH), workflowName);
	let developmentWorkflowId = null;

	if (createDevelopmentWorkflow) {
		const created = await n8nRequest(
			n8nConfig,
			'POST',
			workflowApiUrl(n8nConfig.baseUrl),
			workflowPayload(blankWorkflow, developmentName)
		);
		developmentWorkflowId = clean(created?.id);
		if (!developmentWorkflowId) {
			throw new Error('n8n did not return an ID for the created development workflow.');
		}
	}

	const nextManifest = updateManifest({
		manifest,
		slug,
		displayName: workflowName,
		description,
		author,
		developmentName,
		developmentBaseUrl: createDevelopmentWorkflow ? n8nConfig.baseUrl : null,
		developmentWorkflowId,
		production: null
	});

	writeJson(WORKFLOW_PATH, blankWorkflow);
	writeJson(MANIFEST_PATH, nextManifest);
	fs.writeFileSync(TODO_PATH, todoContent());

	if (saveEnv) {
		fs.writeFileSync(ENV_PATH, envFileContent({
			baseUrl: n8nConfig.baseUrl,
			apiKey: n8nConfig.apiKey,
			workflowId: developmentWorkflowId,
			workflowName: developmentName
		}));
	}

	console.log('\nSetup complete.');
	console.log('Next: review TODO.md and build the workflow before adding development test webhook metadata.');
}

async function main() {
	const prompter = new Prompter();

	try {
		const envValues = {
			...loadDotEnv(repoPath('.env.local')),
			...loadDotEnv(ENV_PATH)
		};
		const manifest = readJson(MANIFEST_PATH);
		const mode = await promptMode(prompter);

		if (mode === 'existing') {
			await existingWorkflowSetup(prompter, envValues, manifest);
		} else {
			await scratchSetup(prompter, envValues, manifest);
		}
	} finally {
		prompter.close();
	}
}

main().catch(error => {
	console.error(`Setup failed: ${error.message}`);
	process.exit(1);
});
