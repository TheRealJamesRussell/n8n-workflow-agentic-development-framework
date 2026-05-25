const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_FIXTURE_ROOT = 'tests/development-fixtures';

function repoPath(relativePath) {
	return path.resolve(REPO_ROOT, relativePath);
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function discoverFixtures(relativeRoot = DEFAULT_FIXTURE_ROOT) {
	const root = repoPath(relativeRoot);
	if (!fs.existsSync(root)) return [];

	return fs.readdirSync(root, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
		.sort()
		.map(name => {
			const dir = path.join(root, name);
			const fixturePath = path.join(dir, 'fixture.json');

			if (!fs.existsSync(fixturePath)) {
				throw new Error(`Fixture ${name} is missing ${path.relative(REPO_ROOT, fixturePath)}`);
			}

			return {
				name,
				dir,
				...readJson(fixturePath)
			};
		});
}

module.exports = {
	DEFAULT_FIXTURE_ROOT,
	discoverFixtures
};
