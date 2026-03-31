#!/bin/bash
# =============================================================================
# test-pipeline.sh — E2E test for the Factory scaffolding & component pipeline
#
# Usage:
#   ./test-pipeline.sh          # Phases 0-2 (filesystem only)
#   ./test-pipeline.sh --full   # Phases 0-3 (includes Docker & seeders)
# =============================================================================
set -e

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
LAB_CLI_BIN="node /Users/kim/Work/Labor/Lab-Cli/lab-cli/lib/index.js"    # Path to lab-cli binary
FACTORY_CORE_PATH="./factory-core"              # Relative path to factory-core
TEST_PROJECT_NAME="test-client-auto"            # Generated project folder name
COMPONENTS_TO_TEST=("PageHero" "Text")          # Components to inject
TYPO3_ADMIN_USER='labor'                        # TYPO3 admin user for setup
TYPO3_ADMIN_PASSWORD='Password1!'               # TYPO3 admin password for setup
APP_ENCRYPTION_KEY='test-encryption-key-0123456789abcdef0123456789abcdef'  # TYPO3 encryption key (Doppler secret)
APP_INSTALL_TOOL_PASSWORD='$argon2id$v=19$m=65536,t=4,p=1$SVE3eVUxS1VnUUF5VXQ0bw$jAw8MUNiCjRARsovanN/dFH4OuT8i2pt9hQS250PMAY'  # TYPO3 Install Tool password, argon2id hash of "Password1!" (Doppler secret)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROMPT_COLOR='\033[38;5;114m'

# Simulated typing effect
typewriter() {
	local text="$1"
	local delay="${2:-0.03}"
	for (( i=0; i<${#text}; i++ )); do
		printf "%s" "${text:$i:1}"
		sleep "$delay"
	done
}

# Print a fake terminal prompt that "types" a command, then runs it
fake_term() {
	local cmd_display="$1"
	shift
	echo ""
	echo -e "  ${DIM}┌──────────────────────────────────────────────────────────────┐${NC}"
	printf "  ${DIM}│${NC} ${PROMPT_COLOR}factory${NC}${DIM}:${NC}${CYAN}~${NC}${DIM}\$${NC} "
	typewriter "$cmd_display" 0.02
	echo ""
	echo -e "  ${DIM}│${NC}"
	# Run the actual command, indenting its output
	if [ $# -gt 0 ]; then
		"$@" 2>&1 | while IFS= read -r line; do
			echo -e "  ${DIM}│${NC}  ${DIM}${line}${NC}"
		done
		local status=${PIPESTATUS[0]}
	fi
	echo -e "  ${DIM}└──────────────────────────────────────────────────────────────┘${NC}"
	return ${status:-0}
}

# Print a fake terminal prompt for commands where we capture output
fake_term_capture() {
	local cmd_display="$1"
	echo ""
	echo -e "  ${DIM}┌──────────────────────────────────────────────────────────────┐${NC}"
	printf "  ${DIM}│${NC} ${PROMPT_COLOR}factory${NC}${DIM}:${NC}${CYAN}~${NC}${DIM}\$${NC} "
	typewriter "$cmd_display" 0.02
	echo ""
	echo -e "  ${DIM}│${NC}"
}

fake_term_line() {
	echo -e "  ${DIM}│${NC}  ${DIM}${1}${NC}"
}

fake_term_close() {
	echo -e "  ${DIM}└──────────────────────────────────────────────────────────────┘${NC}"
}

phase_header() {
	local phase="$1"
	local title="$2"
	local icon="$3"
	echo ""
	echo ""
	echo -e "  ${BOLD}${YELLOW}${icon}  Phase ${phase}: ${title}${NC}"
	echo -e "  ${DIM}$(printf '%.0s─' {1..50})${NC}"
}

info()  { echo -e "  ${BLUE}▸${NC} ${DIM}$1${NC}"; }
pass()  { echo -e "  ${GREEN}✔ $1${NC}"; }
fail()  { echo -e "  ${RED}✘ $1${NC}"; exit 1; }

assert_file_exists() {
	local file="$1"
	local label="${2:-$file}"
	[ -f "$file" ] || fail "Expected file not found: $label ($file)"
	pass "File exists: $label"
}

assert_json_contains() {
	local file="$1"
	local value="$2"
	jq -e --arg v "$value" '.active_components | index($v) != null' "$file" > /dev/null 2>&1 \
		|| fail "active_components in $file does not contain '$value'"
	pass "active_components contains '$value' in $file"
}

# Convert PascalCase to kebab-case (e.g. PageHero → page-hero)
to_kebab() {
	echo "$1" | sed -E 's/([a-z])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
echo ""
echo -e "  ${BOLD}${CYAN}    ______           __                   ${NC}"
echo -e "  ${BOLD}${CYAN}   / ____/___ ______/ /_____  _______  __ ${NC}"
echo -e "  ${BOLD}${CYAN}  / /_  / __ \`/ ___/ __/ __ \\/ ___/ / / / ${NC}"
echo -e "  ${BOLD}${CYAN} / __/ / /_/ / /__/ /_/ /_/ / /  / /_/ /  ${NC}"
echo -e "  ${BOLD}${CYAN}/_/    \\__,_/\\___/\\__/\\____/_/   \\__, /   ${NC}"
echo -e "  ${BOLD}${CYAN}                                /____/    ${NC}"
echo -e "  ${DIM}Test Pipeline — E2E scaffolding & component pipeline${NC}"

# ---------------------------------------------------------------------------
# Phase 0: Teardown
# ---------------------------------------------------------------------------
phase_header 0 "Teardown" "🧹"

if [ -d "$TEST_PROJECT_NAME" ]; then
	# Stop backend containers and remove volumes
	if [ -f "$TEST_PROJECT_NAME/backend/app/docker-compose.yml" ]; then
		pushd "$TEST_PROJECT_NAME/backend/app" > /dev/null
		fake_term "docker compose down -v" docker compose down -v 2>/dev/null || true
		popd > /dev/null
	fi
	# Stop frontend containers and remove volumes
	if [ -f "$TEST_PROJECT_NAME/frontend/app/docker-compose.yml" ]; then
		pushd "$TEST_PROJECT_NAME/frontend/app" > /dev/null
		fake_term "docker compose down -v" docker compose down -v 2>/dev/null || true
		popd > /dev/null
	fi
	fake_term "rm -rf $TEST_PROJECT_NAME" rm -rf "$TEST_PROJECT_NAME"
fi
pass "Clean slate ready"

# ---------------------------------------------------------------------------
# Phase 1: Scaffolding (factory:create)
# ---------------------------------------------------------------------------
phase_header 1 "Scaffolding" "🏗️"

fake_term "lab factory:create $TEST_PROJECT_NAME --force --json --secret APP_ENCRYPTION_KEY=... --secret APP_INSTALL_TOOL_PASSWORD=... --secret TYPO3_API_BASE_URL=..." \
	$LAB_CLI_BIN factory:create "$TEST_PROJECT_NAME" \
	--template-path "$FACTORY_CORE_PATH/templates" \
	--force \
	--json \
	--secret "APP_ENCRYPTION_KEY=$APP_ENCRYPTION_KEY" \
	--secret "APP_INSTALL_TOOL_PASSWORD=$APP_INSTALL_TOOL_PASSWORD" \
	--secret "TYPO3_API_BASE_URL=https://tes-cli-aut-bac.labor.systems"

assert_file_exists "$TEST_PROJECT_NAME/backend/app/src/factory.json" "backend factory.json"
assert_file_exists "$TEST_PROJECT_NAME/backend/app/src/composer.json" "backend composer.json"
assert_file_exists "$TEST_PROJECT_NAME/frontend/app/src/factory.json" "frontend factory.json"

# Symlink factory-core so the CLI can resolve the manifest
# CLI looks for ../factory-core/manifest.json relative to cwd (src/)
FACTORY_CORE_ABS="$(cd "$FACTORY_CORE_PATH" && pwd)"
fake_term "ln -sfn factory-core -> backend + frontend" \
	ln -sfn "$FACTORY_CORE_ABS" "$TEST_PROJECT_NAME/backend/app/factory-core"
ln -sfn "$FACTORY_CORE_ABS" "$TEST_PROJECT_NAME/frontend/app/factory-core"

# Write TYPO3_API_BASE_URL to the frontend .env.app (secrets file mounted into the container)
# Must NOT write to .env here — lab up needs to create .env from .env.template to populate
# all APP_* directory variables that docker-compose.yml volume mounts require.
TYPO3_API_BASE_URL="https://tes-cli-aut-bac.labor.systems"
echo "TYPO3_API_BASE_URL=$TYPO3_API_BASE_URL" >> "$TEST_PROJECT_NAME/frontend/app/.env.app"
info "Set TYPO3_API_BASE_URL=$TYPO3_API_BASE_URL in frontend .env.app"

pass "Phase 1 complete -- project scaffolded"

# ---------------------------------------------------------------------------
# Phase 2: Component Injection (factory:add)
# ---------------------------------------------------------------------------
phase_header 2 "Component Injection" "🧩"

for component in "${COMPONENTS_TO_TEST[@]}"; do
	# Backend (CLI needs composer.json in cwd)
	pushd "$TEST_PROJECT_NAME/backend/app/src" > /dev/null
	fake_term_capture "lab factory:add $component --json  # backend"
	result=$($LAB_CLI_BIN factory:add "$component" --json)
	echo "$result" | while IFS= read -r line; do fake_term_line "$line"; done
	echo "$result" | grep -q '"status":"error"' && { fake_term_close; fail "factory:add $component failed (backend)"; }
	fake_term_close
	popd > /dev/null

	# Frontend (CLI needs package.json in cwd)
	pushd "$TEST_PROJECT_NAME/frontend/app/src" > /dev/null
	fake_term_capture "lab factory:add $component --json  # frontend"
	result=$($LAB_CLI_BIN factory:add "$component" --json)
	echo "$result" | while IFS= read -r line; do fake_term_line "$line"; done
	echo "$result" | grep -q '"status":"error"' && { fake_term_close; fail "factory:add $component failed (frontend)"; }
	fake_term_close
	popd > /dev/null

	pass "Injected $component into backend + frontend"
done

# Verify components landed in factory.json (CLI stores PascalCase names)
info "Verifying active_components..."
for component in "${COMPONENTS_TO_TEST[@]}"; do
	assert_json_contains "$TEST_PROJECT_NAME/backend/app/src/factory.json" "$component"
	assert_json_contains "$TEST_PROJECT_NAME/frontend/app/src/factory.json" "$component"
done

pass "Phase 2 complete -- all components injected and verified"

# ---------------------------------------------------------------------------
# Phase 3: Docker & Bootstrapping (only with --full flag)
# ---------------------------------------------------------------------------
if [ "$1" == "--full" ]; then
	phase_header 3 "Docker & Bootstrapping" "🐳"

	BACKEND_DIR="$TEST_PROJECT_NAME/backend/app"
	FRONTEND_DIR="$TEST_PROJECT_NAME/frontend/app"

	# Pre-authenticate sudo so lab-cli can write /etc/hosts without blocking
	info "Requesting sudo for hosts file access..."
	sudo -v

	# Start containers via lab-cli
	pushd "$BACKEND_DIR" > /dev/null
	fake_term "lab up --yes --import  # backend" $LAB_CLI_BIN up --yes --import
	popd > /dev/null

	pushd "$FRONTEND_DIR" > /dev/null
	fake_term "lab up --yes  # frontend" $LAB_CLI_BIN up --yes
	popd > /dev/null

	# Wait for composer install to complete inside the container
	info "Waiting for composer install to finish..."
	pushd "$BACKEND_DIR" > /dev/null
	WAIT_SECONDS=0
	MAX_WAIT=300
	SPINNER_CHARS='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
	while ! docker compose exec -w / app test -f /var/www/html/vendor/autoload.php 2>/dev/null; do
		WAIT_SECONDS=$((WAIT_SECONDS + 1))
		if [ "$WAIT_SECONDS" -ge "$MAX_WAIT" ]; then
			fail "Timed out waiting for composer install (${MAX_WAIT}s)"
		fi
		idx=$(( (WAIT_SECONDS / 1) % ${#SPINNER_CHARS} ))
		printf "\r  ${CYAN}${SPINNER_CHARS:$idx:1}${NC} ${DIM}waiting for vendor/autoload.php... (${WAIT_SECONDS}s)${NC}  "
		sleep 1
	done
	printf "\r%60s\r" ""  # clear spinner line
	popd > /dev/null
	pass "Composer dependencies installed"

	# Set up TYPO3 (create database schema, build caches, initial config)
	pushd "$BACKEND_DIR" > /dev/null
	fake_term "typo3 setup --driver=mysqli --no-interaction --force" \
		docker compose exec -w /var/www/html app vendor/bin/typo3 setup \
		--driver=mysqli \
		--host="$(docker compose exec -w / app printenv APP_MYSQL_HOST | tr -d '\r')" \
		--port=3306 \
		--dbname="$(docker compose exec -w / app printenv APP_MYSQL_DATABASE | tr -d '\r')" \
		--username="$(docker compose exec -w / app printenv APP_MYSQL_USER | tr -d '\r')" \
		--password="$(docker compose exec -w / app printenv APP_MYSQL_PASS | tr -d '\r')" \
		--admin-username="$TYPO3_ADMIN_USER" \
		--admin-user-password="$TYPO3_ADMIN_PASSWORD" \
		--project-name="$TEST_PROJECT_NAME" \
		--server-type=apache \
		--no-interaction \
		--force

	fake_term "typo3 cache:flush" docker compose exec -w /var/www/html app vendor/bin/typo3 cache:flush
	popd > /dev/null
	pass "TYPO3 setup complete"

	# Run base seeder
	pushd "$BACKEND_DIR" > /dev/null
	fake_term "typo3 factory:seed:init --lang de,en" \
		docker compose exec -w /var/www/html app vendor/bin/typo3 factory:seed:init --lang de,en
	popd > /dev/null
	pass "Base seeder complete"

	# Seed active components on the ContentBlocks-Collection page
	pushd "$BACKEND_DIR" > /dev/null
	for component in "${COMPONENTS_TO_TEST[@]}"; do
		slug=$(to_kebab "$component")
		fake_term "typo3 factory:seed:component $slug" \
			docker compose exec -w /var/www/html app vendor/bin/typo3 factory:seed:component "$slug"
	done
	popd > /dev/null
	pass "Component seeders complete"

	pass "Phase 3 complete -- Docker bootstrapped and seeded"
else
	echo ""
	echo -e "  ${DIM}Skipping Phase 3 (Docker). Run with ${BOLD}--full${NC}${DIM} to include.${NC}"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo ""
echo -e "  ${GREEN}${BOLD}  ╔═══════════════════════════════════════════╗${NC}"
echo -e "  ${GREEN}${BOLD}  ║                                           ║${NC}"
echo -e "  ${GREEN}${BOLD}  ║   All tests passed successfully!          ║${NC}"
echo -e "  ${GREEN}${BOLD}  ║                                           ║${NC}"
echo -e "  ${GREEN}${BOLD}  ╚═══════════════════════════════════════════╝${NC}"
echo ""
