const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_WORKFLOW_PATH = 'workflow.json';
const DEFAULT_REMOTE_SNAPSHOT_PATH = 'tmp/n8n-development-workflow.remote.json';
const DEFAULT_DEVELOPMENT_VARIANT_PATH = 'tmp/n8n-development-workflow.generated.json';
const MANIFEST_PATH = 'manifest.json';

function clean(value) {
	return String(value || '').trim();
}

function envFlag(name) {
	return clean(process.env[name]).toLowerCase() === 'true';
}

function repoPath(relativePath) {
	return path.resolve(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
	return JSON.parse(fs.readFileSync(repoPath(relativePath), 'utf8'));
}

function writeJson(relativePath, data) {
	const fullPath = repoPath(relativePath);
	fs.mkdirSync(path.dirname(fullPath), { recursive: true });
	fs.writeFileSync(fullPath, `${JSON.stringify(data, null, 2)}\n`);
}

function loadDotEnv(filePath) {
	if (!fs.existsSync(filePath)) return;

	for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
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

		if (!process.env[key]) process.env[key] = value;
	}
}

function loadLocalEnv() {
	loadDotEnv(path.join(REPO_ROOT, '.env.development'));
	loadDotEnv(path.join(REPO_ROOT, '.env.local'));
}

function getDevelopmentTestWebhookPath(manifest) {
	return clean(manifest.environments?.development?.entrypoints?.testWebhookPath) ||
		`${slugPart(manifest.name)}-development-test`;
}

function requireDevelopmentTestWebhookPath(manifest) {
	const testWebhookPath = getDevelopmentTestWebhookPath(manifest);
	if (!testWebhookPath) {
		throw new Error(
			'manifest.json is missing environments.development.entrypoints.testWebhookPath; configure it before running Layer 3 workflow tests.'
		);
	}
	return testWebhookPath;
}

function getDevelopmentWebhookSecretHeader() {
	return clean(process.env.N8N_DEVELOPMENT_WEBHOOK_SECRET_HEADER) ||
		'X-N8N-Development-Webhook-Secret';
}

function getDevelopmentWebhookSecret() {
	return clean(process.env.N8N_DEVELOPMENT_WEBHOOK_SECRET);
}

function requireDevelopmentWebhookSecret() {
	const secret = getDevelopmentWebhookSecret();

	if (!secret) {
		throw new Error([
			'Missing required development webhook secret.',
			'Set N8N_DEVELOPMENT_WEBHOOK_SECRET before running Layer 3 workflow tests.'
		].join(' '));
	}

	return secret;
}

function requireDevelopmentEnv(options = {}) {
	loadLocalEnv();

	const manifest = readJson(MANIFEST_PATH);
	const developmentEnvironment = manifest.environments?.development || {};
	const requireTestWebhook = options.requireTestWebhook === true;

	const environment = clean(process.env.N8N_ENVIRONMENT);
	const workflowId = clean(
		process.env.N8N_DEVELOPMENT_WORKFLOW_ID ||
		developmentEnvironment.workflowId
	);
	const workflowName = clean(
		process.env.N8N_DEVELOPMENT_WORKFLOW_NAME ||
		developmentEnvironment.workflowName
	);
	const baseUrl = clean(
		process.env.N8N_BASE_URL ||
		developmentEnvironment.baseUrl
	).replace(/\/+$/, '');
	const localWorkflowPath = clean(
		process.env.N8N_LOCAL_WORKFLOW_PATH ||
		manifest.source
	) || DEFAULT_WORKFLOW_PATH;

	const config = {
		manifest,
		baseUrl,
		apiKey: clean(process.env.N8N_API_KEY),
		environment,
		workflowId,
		workflowName,
		localWorkflowPath,
		testWebhookPath: getDevelopmentTestWebhookPath(manifest),
		developmentWebhookSecretHeader: getDevelopmentWebhookSecretHeader(),
		developmentWebhookSecret: getDevelopmentWebhookSecret(),
		activateDevelopmentWorkflow: envFlag('N8N_ACTIVATE_DEVELOPMENT_WORKFLOW'),
		requireActiveWorkflow: envFlag('N8N_REQUIRE_ACTIVE_WORKFLOW'),
		developmentVariantPath: clean(process.env.N8N_DEVELOPMENT_VARIANT_PATH) ||
			DEFAULT_DEVELOPMENT_VARIANT_PATH,
		remoteSnapshotPath: clean(process.env.N8N_REMOTE_SNAPSHOT_PATH) || DEFAULT_REMOTE_SNAPSHOT_PATH
	};

	const missing = [];
	if (!config.baseUrl) missing.push('N8N_BASE_URL or environments.development.baseUrl');
	if (!config.apiKey) missing.push('N8N_API_KEY');
	if (!config.workflowId) missing.push('N8N_DEVELOPMENT_WORKFLOW_ID or environments.development.workflowId');
	if (!config.workflowName) missing.push('N8N_DEVELOPMENT_WORKFLOW_NAME or environments.development.workflowName');
	if (requireTestWebhook && !config.testWebhookPath) {
		missing.push('environments.development.entrypoints.testWebhookPath');
	}

	if (missing.length > 0) {
		throw new Error(`Missing required development values: ${missing.join(', ')}`);
	}

	if (config.environment !== 'development') {
		throw new Error('Refusing to call n8n unless N8N_ENVIRONMENT=development.');
	}

	return config;
}

function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}

function isWebhookNode(node) {
	return node?.type === 'n8n-nodes-base.webhook';
}

function isTriggerLikeNode(node) {
	const type = clean(node?.type).toLowerCase();
	return type.includes('trigger') || type === 'n8n-nodes-base.webhook';
}

function getWebhookPath(node) {
	return clean(node?.parameters?.path || node?.parameters?.options?.path);
}

function slugPart(value) {
	return clean(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'development-test';
}

function uniqueNodeName(nodes, baseName) {
	const existing = new Set(nodes.map(node => clean(node?.name)).filter(Boolean));
	if (!existing.has(baseName)) return baseName;

	let index = 2;
	while (existing.has(`${baseName} ${index}`)) {
		index += 1;
	}

	return `${baseName} ${index}`;
}

function triggerAnchorPosition(workflow) {
	const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : [];
	const triggerNodes = nodes
		.filter(isTriggerLikeNode)
		.sort((left, right) => {
			const leftY = Number(left.position?.[1] || 0);
			const rightY = Number(right.position?.[1] || 0);
			const leftX = Number(left.position?.[0] || 0);
			const rightX = Number(right.position?.[0] || 0);
			return leftY - rightY || leftX - rightX;
		});

	if (triggerNodes.length === 0) {
		return [0, 0];
	}

	const [x = 0, y = 0] = triggerNodes[0].position || [0, 0];
	return [x, y + 180];
}

function createDevelopmentTestWebhookNode(workflow, manifest) {
	const testWebhookPath = getDevelopmentTestWebhookPath(manifest);
	if (!testWebhookPath) return null;

	const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : [];
	return {
		parameters: {
			httpMethod: 'POST',
			path: testWebhookPath,
			responseMode: 'responseNode',
			options: {}
		},
		id: `development-test-webhook-${slugPart(testWebhookPath)}`,
		name: uniqueNodeName(nodes, 'Development Test Webhook'),
		type: 'n8n-nodes-base.webhook',
		typeVersion: 2.1,
		position: triggerAnchorPosition(workflow),
		webhookId: testWebhookPath
	};
}

function addDevelopmentTestWebhookIfMissing(workflow, manifest) {
	const testWebhookPath = getDevelopmentTestWebhookPath(manifest);
	if (!testWebhookPath) {
		return {
			added: false,
			reason: 'not configured',
			node: null
		};
	}

	if (findDevelopmentTestWebhookNodes(workflow, manifest).length > 0) {
		return {
			added: false,
			reason: 'already present',
			node: null
		};
	}

	if (!Array.isArray(workflow.nodes)) workflow.nodes = [];

	const node = createDevelopmentTestWebhookNode(workflow, manifest);
	workflow.nodes.push(node);

	return {
		added: true,
		reason: 'created development variant webhook',
		node
	};
}

function findDevelopmentTestWebhookNodes(workflow, manifest) {
	const testWebhookPath = getDevelopmentTestWebhookPath(manifest);
	if (!testWebhookPath) return [];

	return (Array.isArray(workflow?.nodes) ? workflow.nodes : [])
		.filter(isWebhookNode)
		.filter(node => getWebhookPath(node) === testWebhookPath);
}

function findFirstDevelopmentTestWebhookNode(workflow, manifest) {
	return findDevelopmentTestWebhookNodes(workflow, manifest)[0] || null;
}

function assertDevelopmentTestWebhookIfPresent(workflow, manifest) {
	const testWebhookPath = getDevelopmentTestWebhookPath(manifest);
	if (!testWebhookPath) {
		return { checked: false, reason: 'not configured', nodes: [] };
	}

	const matchingNodes = findDevelopmentTestWebhookNodes(workflow, manifest);
	if (matchingNodes.length === 0) {
		return { checked: false, reason: 'workflow has no matching development test webhook', nodes: [] };
	}

	return {
		checked: true,
		nodes: matchingNodes.map(node => node.name || '(unnamed Webhook)')
	};
}

function preserveDevelopmentTestWebhookAuth(targetWorkflow, remoteWorkflow, manifest) {
	const targetNode = findFirstDevelopmentTestWebhookNode(targetWorkflow, manifest);
	const remoteNode = findFirstDevelopmentTestWebhookNode(remoteWorkflow, manifest);
	const remoteAuthentication = clean(remoteNode?.parameters?.authentication);

	if (!targetNode || !remoteNode || !remoteAuthentication) {
		return {
			preserved: false
		};
	}

	if (!targetNode.parameters) targetNode.parameters = {};
	targetNode.parameters.authentication = remoteAuthentication;

	if (remoteNode.credentials) {
		targetNode.credentials = cloneJson(remoteNode.credentials);
	}

	return {
		preserved: true,
		authentication: remoteAuthentication,
		credentialTypes: Object.keys(remoteNode.credentials || {})
	};
}

function assertWorkflowHasDevelopmentTestWebhook(workflow, manifest) {
	const testWebhookPath = requireDevelopmentTestWebhookPath(manifest);
	const nodes = findDevelopmentTestWebhookNodes(workflow, manifest);

	if (nodes.length === 0) {
		throw new Error(`Workflow is missing development test webhook path "${testWebhookPath}".`);
	}

	return nodes;
}

function validateRemoteDevelopmentWorkflow(config, remoteWorkflow) {
	const remoteId = clean(remoteWorkflow?.id);
	const remoteName = clean(remoteWorkflow?.name);
	const expectedId = clean(config.workflowId);
	const expectedName = clean(config.workflowName);

	if (!remoteWorkflow || typeof remoteWorkflow !== 'object') {
		throw new Error('n8n returned an invalid workflow response.');
	}

	if (remoteId && remoteId !== expectedId) {
		throw new Error(`Refusing to update workflow ${remoteId}; expected development workflow ${expectedId}.`);
	}

	if (remoteName !== expectedName) {
		throw new Error(`Refusing to update workflow named "${remoteName}"; expected "${expectedName}".`);
	}

	if (!expectedName.toLowerCase().includes('development')) {
		throw new Error('Development workflow name must contain "development".');
	}
}

function assertDevelopmentActivationSafety(workflow, config) {
	const workflowName = clean(workflow?.name || config.workflowName);
	if (!workflowName.toLowerCase().includes('development')) {
		throw new Error('Refusing to activate a workflow whose name does not contain "development".');
	}

	return assertDevelopmentTestWebhookIfPresent(workflow, config.manifest);
}

function createDevelopmentWorkflowVariant(sourceWorkflow, config) {
	const workflow = cloneJson(sourceWorkflow);
	workflow.name = config.workflowName || workflow.name;
	const developmentTestWebhook = addDevelopmentTestWebhookIfMissing(workflow, config.manifest);

	return {
		workflow,
		variantPath: config.developmentVariantPath,
		developmentTestWebhook,
		rewrittenFormTriggers: 0,
		testWebhookCheck: assertDevelopmentTestWebhookIfPresent(workflow, config.manifest)
	};
}

function workflowApiUrl(config) {
	return `${config.baseUrl}/api/v1/workflows/${encodeURIComponent(config.workflowId)}`;
}

function workflowActionApiUrl(config, action) {
	return `${workflowApiUrl(config)}/${encodeURIComponent(action)}`;
}

function credentialsApiUrl(config) {
	return `${config.baseUrl}/api/v1/credentials`;
}

async function n8nRequest(config, method, body, url = workflowApiUrl(config)) {
	const response = await fetch(url, {
		method,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-N8N-API-KEY': config.apiKey
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

async function createDevelopmentWebhookCredential(config) {
	const headerName = getDevelopmentWebhookSecretHeader();
	const secret = requireDevelopmentWebhookSecret();
	const credentialName = `${config.workflowName} development webhook header`;
	const credential = await n8nRequest(
		config,
		'POST',
		{
			name: credentialName,
			type: 'httpHeaderAuth',
			data: {
				name: headerName,
				value: secret
			}
		},
		credentialsApiUrl(config)
	);
	const credentialId = clean(credential?.id);

	if (!credentialId) {
		throw new Error('n8n did not return an ID for the created development webhook Header Auth credential.');
	}

	return {
		id: credentialId,
		name: clean(credential?.name) || credentialName
	};
}

function applyDevelopmentWebhookCredential(targetWorkflow, manifest, credential) {
	const nodes = findDevelopmentTestWebhookNodes(targetWorkflow, manifest);

	for (const node of nodes) {
		if (!node.parameters) node.parameters = {};
		node.parameters.authentication = 'headerAuth';
		node.credentials = {
			...(node.credentials || {}),
			httpHeaderAuth: {
				id: credential.id,
				name: credential.name
			}
		};
	}

	return nodes;
}

async function ensureDevelopmentTestWebhookAuth(targetWorkflow, remoteWorkflow, config) {
	const preserved = preserveDevelopmentTestWebhookAuth(targetWorkflow, remoteWorkflow, config.manifest);
	if (preserved.preserved) return preserved;

	const targetNodes = findDevelopmentTestWebhookNodes(targetWorkflow, config.manifest);
	if (targetNodes.length === 0) {
		return {
			preserved: false,
			created: false,
			reason: 'workflow has no matching development test webhook'
		};
	}

	const localAuthNodes = targetNodes.filter(node => {
		return clean(node?.parameters?.authentication) && Object.keys(node?.credentials || {}).length > 0;
	});
	if (localAuthNodes.length > 0) {
		return {
			preserved: false,
			created: false,
			reason: 'development test webhook already has local authentication'
		};
	}

	const credential = await createDevelopmentWebhookCredential(config);
	applyDevelopmentWebhookCredential(targetWorkflow, config.manifest, credential);

	return {
		preserved: false,
		created: true,
		authentication: 'headerAuth',
		credentialTypes: ['httpHeaderAuth'],
		credentialName: credential.name
	};
}

async function activateDevelopmentWorkflow(config) {
	if (config.environment !== 'development') {
		throw new Error('Refusing to activate n8n workflow unless N8N_ENVIRONMENT=development.');
	}

	if (!clean(config.workflowName).toLowerCase().includes('development')) {
		throw new Error('Refusing to activate a workflow whose configured name does not contain "development".');
	}

	return n8nRequest(config, 'POST', undefined, workflowActionApiUrl(config, 'activate'));
}

function workflowUpdatePayload(localWorkflow, config = {}) {
	const required = ['name', 'nodes', 'connections', 'settings'];
	const missing = required.filter(key => localWorkflow[key] === undefined);

	if (missing.length > 0) {
		throw new Error(`Local workflow is missing required field(s): ${missing.join(', ')}`);
	}

	return {
		name: config.workflowName || localWorkflow.name,
		nodes: localWorkflow.nodes,
		connections: localWorkflow.connections,
		settings: localWorkflow.settings
	};
}

function comparableWorkflow(workflow) {
	return {
		name: workflow.name,
		nodes: workflow.nodes,
		connections: workflow.connections,
		settings: workflow.settings
	};
}

function stableJson(value) {
	return JSON.stringify(value, null, 2);
}

module.exports = {
	activateDevelopmentWorkflow,
	assertDevelopmentActivationSafety,
	assertDevelopmentTestWebhookIfPresent,
	assertWorkflowHasDevelopmentTestWebhook,
	comparableWorkflow,
	createDevelopmentWorkflowVariant,
	ensureDevelopmentTestWebhookAuth,
	getDevelopmentTestWebhookPath,
	loadLocalEnv,
	n8nRequest,
	preserveDevelopmentTestWebhookAuth,
	readJson,
	requireDevelopmentEnv,
	requireDevelopmentTestWebhookPath,
	requireDevelopmentWebhookSecret,
	stableJson,
	validateRemoteDevelopmentWorkflow,
	workflowUpdatePayload,
	writeJson
};
