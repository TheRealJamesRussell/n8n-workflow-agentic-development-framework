const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function writeReport(results) {
	const reportDir = path.join(REPO_ROOT, 'tmp', 'layer3-development-fixtures');
	fs.mkdirSync(reportDir, { recursive: true });

	const reportPath = path.join(reportDir, `report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
	fs.writeFileSync(reportPath, `${JSON.stringify({
		generatedAt: new Date().toISOString(),
		results
	}, null, 2)}\n`);

	return path.relative(REPO_ROOT, reportPath);
}

module.exports = {
	writeReport
};
