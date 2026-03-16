# Instructies Super Claude Tool

## Coding Style

### Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate existing ones:

```
// Pseudocode
WRONG:  modify(original, field, value) → changes original in-place
CORRECT: update(original, field, value) → returns new copy with change
```

Rationale: Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

### File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large modules
- Organize by feature/domain, not by type

### Error Handling

ALWAYS handle errors comprehensively:
- Handle errors explicitly at every level
- Provide user-friendly error messages in UI-facing code
- Log detailed error context on the server side
- Never silently swallow errors

### Input Validation

ALWAYS validate at system boundaries:
- Validate all user input before processing
- Use schema-based validation where available
- Fail fast with clear error messages
- Never trust external data (API responses, user input, file content)

### Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values (use constants or config)
- [ ] No mutation (immutable patterns used)

---

## Git Workflow

### Commit Message Format
```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

### Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

---

## Testing Requirements

### Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (framework chosen per language)

### Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

---

## Performance Optimization

### Model Selection Strategy

**Haiku 4.5** (90% of Sonnet capability, 3x cost savings):
- Lightweight agents with frequent invocation
- Pair programming and code generation
- Worker agents in multi-agent systems

**Sonnet 4.6** (Best coding model):
- Main development work
- Orchestrating multi-agent workflows
- Complex coding tasks

**Opus 4.5** (Deepest reasoning):
- Complex architectural decisions
- Maximum reasoning requirements
- Research and analysis tasks

### Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

---

## Common Patterns

### Skeleton Projects

When implementing new functionality:
1. Search for battle-tested skeleton projects
2. Use parallel agents to evaluate options:
   - Security assessment
   - Extensibility analysis
   - Relevance scoring
   - Implementation planning
3. Clone best match as foundation
4. Iterate within proven structure

### Design Patterns

#### Repository Pattern

Encapsulate data access behind a consistent interface:
- Define standard operations: findAll, findById, create, update, delete
- Concrete implementations handle storage details (database, API, file, etc.)
- Business logic depends on the abstract interface, not the storage mechanism
- Enables easy swapping of data sources and simplifies testing with mocks

#### API Response Format

Use a consistent envelope for all API responses:
- Include a success/status indicator
- Include the data payload (nullable on error)
- Include an error message field (nullable on success)
- Include metadata for paginated responses (total, page, limit)

---

## Development Workflow

### Feature Implementation Workflow

0. **Research & Reuse** _(mandatory before any new implementation)_
   - GitHub code search first
   - Library docs second
   - Exa only when the first two are insufficient
   - Check package registries
   - Search for adaptable implementations

1. **Plan First**
   - Use planner agent to create implementation plan
   - Generate planning docs before coding: PRD, architecture, system_design, tech_doc, task_list
   - Identify dependencies and risks
   - Break down into phases

2. **TDD Approach**
   - Use tdd-guide agent
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

3. **Code Review**
   - Use code-reviewer agent immediately after writing code
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format

---

## Agent Orchestration

### Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |

### Immediate Agent Usage

No user prompt needed:
1. Complex feature requests - Use **planner** agent
2. Code just written/modified - Use **code-reviewer** agent
3. Bug fix or new feature - Use **tdd-guide** agent
4. Architectural decision - Use **architect** agent

### Parallel Task Execution

ALWAYS use parallel Task execution for independent operations.

---

## Security Guidelines

### Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

### Secret Management

- NEVER hardcode secrets in source code
- ALWAYS use environment variables or a secret manager
- Validate that required secrets are present at startup
- Rotate any secrets that may have been exposed

### Security Response Protocol

If security issue found:
1. STOP immediately
2. Use security-reviewer agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues

---

## Everything Claude Code — Mapstructuur

```
everything-claude-code/
|-- .claude-plugin/   # Plugin and marketplace manifests
|   |-- plugin.json         # Plugin metadata and component paths
|   |-- marketplace.json    # Marketplace catalog for /plugin marketplace add
|
|-- agents/           # Specialized subagents for delegation
|   |-- planner.md           # Feature implementation planning
|   |-- architect.md         # System design decisions
|   |-- tdd-guide.md         # Test-driven development
|   |-- code-reviewer.md     # Quality and security review
|   |-- security-reviewer.md # Vulnerability analysis
|   |-- build-error-resolver.md
|   |-- e2e-runner.md        # Playwright E2E testing
|   |-- refactor-cleaner.md  # Dead code cleanup
|   |-- doc-updater.md       # Documentation sync
|   |-- go-reviewer.md       # Go code review
|   |-- go-build-resolver.md # Go build error resolution
|   |-- python-reviewer.md   # Python code review (NEW)
|   |-- database-reviewer.md # Database/Supabase review (NEW)
|
|-- skills/           # Workflow definitions and domain knowledge
|   |-- coding-standards/
|   |-- clickhouse-io/
|   |-- backend-patterns/
|   |-- frontend-patterns/
|   |-- frontend-slides/
|   |-- article-writing/
|   |-- content-engine/
|   |-- market-research/
|   |-- investor-materials/
|   |-- investor-outreach/
|   |-- continuous-learning/
|   |-- continuous-learning-v2/
|   |-- iterative-retrieval/
|   |-- strategic-compact/
|   |-- tdd-workflow/
|   |-- security-review/
|   |-- eval-harness/
|   |-- verification-loop/
|   |-- videodb/
|   |-- golang-patterns/
|   |-- golang-testing/
|   |-- cpp-coding-standards/
|   |-- cpp-testing/
|   |-- django-patterns/
|   |-- django-security/
|   |-- django-tdd/
|   |-- django-verification/
|   |-- python-patterns/
|   |-- python-testing/
|   |-- springboot-patterns/
|   |-- springboot-security/
|   |-- springboot-tdd/
|   |-- springboot-verification/
|   |-- configure-ecc/
|   |-- security-scan/
|   |-- java-coding-standards/
|   |-- jpa-patterns/
|   |-- postgres-patterns/
|   |-- nutrient-document-processing/
|   |-- project-guidelines-example/
|   |-- database-migrations/
|   |-- api-design/
|   |-- deployment-patterns/
|   |-- docker-patterns/
|   |-- e2e-testing/
|   |-- content-hash-cache-pattern/
|   |-- cost-aware-llm-pipeline/
|   |-- regex-vs-llm-structured-text/
|   |-- swift-actor-persistence/
|   |-- swift-protocol-di-testing/
|   |-- search-first/
|   |-- skill-stocktake/
|   |-- liquid-glass-design/
|   |-- foundation-models-on-device/
|   |-- swift-concurrency-6-2/
|   |-- perl-patterns/
|   |-- perl-security/
|   |-- perl-testing/
|   |-- autonomous-loops/
|   |-- plankton-code-quality/
|
|-- commands/         # Slash commands voor snelle uitvoering
|   |-- tdd.md              # /tdd
|   |-- plan.md             # /plan
|   |-- e2e.md              # /e2e
|   |-- code-review.md      # /code-review
|   |-- build-fix.md        # /build-fix
|   |-- refactor-clean.md   # /refactor-clean
|   |-- learn.md            # /learn
|   |-- learn-eval.md       # /learn-eval (NEW)
|   |-- checkpoint.md       # /checkpoint
|   |-- verify.md           # /verify
|   |-- setup-pm.md         # /setup-pm
|   |-- go-review.md        # /go-review (NEW)
|   |-- go-test.md          # /go-test (NEW)
|   |-- go-build.md         # /go-build (NEW)
|   |-- skill-create.md     # /skill-create (NEW)
|   |-- instinct-status.md  # /instinct-status (NEW)
|   |-- instinct-import.md  # /instinct-import (NEW)
|   |-- instinct-export.md  # /instinct-export (NEW)
|   |-- evolve.md           # /evolve
|   |-- pm2.md              # /pm2 (NEW)
|   |-- multi-plan.md       # /multi-plan (NEW)
|   |-- multi-execute.md    # /multi-execute (NEW)
|   |-- multi-backend.md    # /multi-backend (NEW)
|   |-- multi-frontend.md   # /multi-frontend (NEW)
|   |-- multi-workflow.md   # /multi-workflow (NEW)
|   |-- orchestrate.md      # /orchestrate
|   |-- sessions.md         # /sessions
|   |-- eval.md             # /eval
|   |-- test-coverage.md    # /test-coverage
|   |-- update-docs.md      # /update-docs
|   |-- update-codemaps.md  # /update-codemaps
|   |-- python-review.md    # /python-review (NEW)
|
|-- rules/            # Altijd-geldende richtlijnen
|   |-- README.md
|   |-- common/
|   |   |-- coding-style.md
|   |   |-- git-workflow.md
|   |   |-- testing.md
|   |   |-- performance.md
|   |   |-- patterns.md
|   |   |-- hooks.md
|   |   |-- agents.md
|   |   |-- security.md
|   |-- typescript/
|   |-- python/
|   |-- golang/
|   |-- swift/
|   |-- php/               # (NEW)
|
|-- hooks/            # Trigger-gebaseerde automatiseringen
|   |-- README.md
|   |-- hooks.json
|   |-- memory-persistence/
|   |-- strategic-compact/
|
|-- scripts/          # Cross-platform Node.js scripts (NEW)
|   |-- lib/
|   |   |-- utils.js
|   |   |-- package-manager.js
|   |-- hooks/
|   |   |-- session-start.js
|   |   |-- session-end.js
|   |   |-- pre-compact.js
|   |   |-- suggest-compact.js
|   |   |-- evaluate-session.js
|   |-- setup-package-manager.js
|
|-- tests/            # Testsuite (NEW)
|   |-- lib/
|   |-- hooks/
|   |-- run-all.js
|
|-- contexts/         # Dynamische system prompt injectie
|   |-- dev.md
|   |-- review.md
|   |-- research.md
|
|-- examples/         # Voorbeeldconfiguraties
|   |-- CLAUDE.md
|   |-- user-CLAUDE.md
|   |-- saas-nextjs-CLAUDE.md
|   |-- go-microservice-CLAUDE.md
|   |-- django-api-CLAUDE.md
|   |-- rust-api-CLAUDE.md         # (NEW)
|
|-- mcp-configs/      # MCP server configuraties
|   |-- mcp-servers.json
|
|-- marketplace.json  # Self-hosted marketplace config
```
