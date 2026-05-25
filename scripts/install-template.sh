#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${N8N_WORKFLOW_FRAMEWORK_REPO_URL:-https://github.com/TheRealJamesRussell/n8n-workflow-agentic-development-framework.git}"
REF="${N8N_WORKFLOW_FRAMEWORK_REF:-development}"
LOCAL_SOURCE="${N8N_WORKFLOW_FRAMEWORK_LOCAL_SOURCE:-}"
TARGET_DIR="${1:-.}"

usage() {
	cat <<'USAGE'
Install the n8n workflow agentic development template into a directory.

Usage:
  install-template.sh [target-directory]

Examples:
  curl -fsSL https://raw.githubusercontent.com/TheRealJamesRussell/n8n-workflow-agentic-development-framework/development/scripts/install-template.sh | bash
  curl -fsSL https://raw.githubusercontent.com/TheRealJamesRussell/n8n-workflow-agentic-development-framework/development/scripts/install-template.sh | bash -s -- ./my-workflow

Environment:
  N8N_WORKFLOW_FRAMEWORK_REF          Git ref to install from. Defaults to development.
  N8N_WORKFLOW_FRAMEWORK_REPO_URL     Git repository URL.
  N8N_WORKFLOW_FRAMEWORK_LOCAL_SOURCE Local maintainer repo path for testing this installer.
USAGE
}

if [[ "${TARGET_DIR}" == "-h" || "${TARGET_DIR}" == "--help" ]]; then
	usage
	exit 0
fi

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

copy_template() {
	local source_template="$1"
	local target="$2"

	if [[ ! -d "${source_template}" ]]; then
		echo "Template source not found: ${source_template}" >&2
		exit 1
	fi

	mkdir -p "${target}"

	if find "${target}" -mindepth 1 -maxdepth 1 | read -r _; then
		echo "Target directory is not empty: ${target}" >&2
		echo "Choose an empty directory or run from an empty project folder." >&2
		exit 1
	fi

	cp -R "${source_template}/." "${target}/"
}

main() {
	local target_path
	target_path="$(mkdir -p "${TARGET_DIR}" && cd "${TARGET_DIR}" && pwd)"

	if [[ -n "${LOCAL_SOURCE}" ]]; then
		copy_template "${LOCAL_SOURCE%/}/template" "${target_path}"
	else
		require_command git

		local temp_dir
		temp_dir="$(mktemp -d)"
		trap 'rm -rf "${temp_dir}"' EXIT

		git clone --depth 1 --filter=blob:none --sparse --branch "${REF}" "${REPO_URL}" "${temp_dir}/repo" >/dev/null
		git -C "${temp_dir}/repo" sparse-checkout set template >/dev/null

		copy_template "${temp_dir}/repo/template" "${target_path}"
	fi

	echo "Installed n8n workflow template into ${target_path}"
	echo "Next: cd ${target_path} && npm run setup"
}

main
