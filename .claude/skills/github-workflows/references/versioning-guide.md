# Versioning Guide Reference

## Semantic Versioning (SemVer)

**Format:** `MAJOR.MINOR.PATCH[-prerelease][+build]`

**Official spec:** https://semver.org

---

## Core Rules

| Version Part | When to Bump | Example |
|-------------|-------------|---------|
| **MAJOR** | Breaking change to public API | `1.2.3 → 2.0.0` |
| **MINOR** | New backwards-compatible feature | `1.2.3 → 1.3.0` |
| **PATCH** | Backwards-compatible bug fix | `1.2.3 → 1.2.4` |

**When MAJOR bumps:** reset MINOR and PATCH to 0 (`2.0.0`)
**When MINOR bumps:** reset PATCH to 0 (`1.3.0`)

---

## Every Case with Examples

### Breaking Changes → MAJOR
```
feat!: remove support for Node 14          1.5.2 → 2.0.0
feat!: rename User.id to User.userId       1.5.2 → 2.0.0
BREAKING CHANGE: auth token format changed 1.5.2 → 2.0.0
```

### New Features → MINOR
```
feat: add dark mode toggle                 1.2.3 → 1.3.0
feat: export reports as PDF                1.2.3 → 1.3.0
feat: OAuth2 login support                 1.2.3 → 1.3.0
```

### Bug Fixes → PATCH
```
fix: correct null pointer in cart checkout 1.2.3 → 1.2.4
fix: resolve race condition in session     1.2.3 → 1.2.4
perf: reduce API response time by 40ms    1.2.3 → 1.2.4
```

### No Version Bump (internal only)
```
chore: upgrade dev dependencies
docs: update README
test: add unit tests for auth module
refactor: extract helper function (no API change)
```

---

## Pre-Release Versions

Used to signal "not yet stable" before a major release.

**Ordering:** `alpha < beta < rc < release`

```
1.3.0-alpha.1   ← early internal testing, may have major bugs
1.3.0-alpha.2   ← second alpha (alpha.N increments)
1.3.0-beta.1    ← feature complete, external testing begins
1.3.0-beta.2
1.3.0-rc.1      ← release candidate, should be production-ready
1.3.0-rc.2      ← only if critical fix needed in RC
1.3.0           ← final stable release
```

**Rules:**
- Pre-release versions have lower precedence than the release: `1.3.0-rc.1 < 1.3.0`
- Always increment the number, never reuse: `alpha.1, alpha.2, ...`
- Don't skip stages unnecessarily; rc implies "this could ship"

---

## Build Metadata

Appended after `+`. Ignored in version precedence comparisons.

```
1.3.0+build.42          ← CI build number
1.3.0+sha.a1b2c3d       ← git short SHA
1.3.0-beta.1+20240315   ← date stamp
```

Rarely needed in application projects. Common in libraries and packages.

---

## 0.x.x Phase

During initial development before first stable release:
- `0.1.0` = first public prototype
- `0.x.x` MINOR bumps **may include breaking changes**
- `1.0.0` = commitment to stability, public API is locked

**Signal `1.0.0` when:**
- The public API is intentional and stable
- You are willing to bump MAJOR for breaking changes going forward
- The product is used in production

---

## CalVer (Calendar Versioning)

**Format:** `YYYY.MM.DD` or `YYYY.MM.MINOR`

**Use CalVer when:**
- Releases are time-driven (monthly, quarterly)
- Version communicates "when" not "what changed"
- Examples: Ubuntu (`24.04`), pip

**Avoid CalVer when:**
- You have a public API with compatibility guarantees
- Consumers need to know if they need to upgrade carefully

---

## Node.js Specifics

**Location:** `package.json` → `"version"` field

**npm commands:**
```bash
npm version patch    # 1.2.3 → 1.2.4
npm version minor    # 1.2.3 → 1.3.0
npm version major    # 1.2.3 → 2.0.0
npm version 1.3.0-beta.1   # set exact pre-release version
```

`npm version` automatically:
1. Updates `package.json`
2. Creates a git commit: `chore(release): 1.3.0`
3. Creates a git tag: `v1.3.0`

**Recommended:** use `npm version` in release workflow, then push manually.

---

## Python Specifics

**Location:** `pyproject.toml`
```toml
[project]
version = "1.3.0"
```

Or `setup.py`:
```python
setup(version="1.3.0", ...)
```

Or `__version__` in `__init__.py`:
```python
__version__ = "1.3.0"
```

**Tool:** [bump2version](https://github.com/c4urself/bump2version) or [poetry version](https://python-poetry.org/docs/cli/#version)

---

## GitHub Release vs Git Tag

| | Git Tag | GitHub Release |
|--|---------|----------------|
| What it is | A pointer to a commit | A GitHub UI object wrapping a tag |
| Contains | Tag name + optional message | Tag + title + markdown release notes + assets |
| Created with | `git tag -a vX.Y.Z` | GitHub UI or `gh release create` |
| When to use | Always (source of truth) | When distributing binaries or detailed changelogs |

**Best practice:** always create the annotated git tag first, then optionally create a GitHub Release from it.

```bash
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin v1.3.0
gh release create v1.3.0 --generate-notes
```

---

## CHANGELOG-Driven Release Notes

When using Conventional Commits, map to Keep a Changelog sections:

| Commit Type | CHANGELOG Section |
|-------------|------------------|
| `feat` | Added |
| `fix` | Fixed |
| `perf` | Changed |
| `refactor` | Changed |
| `docs` | (omit or include under Changed) |
| `BREAKING CHANGE` | **top of section, bold** |
| `security` | Security |
| `deprecated` | Deprecated |
| removal of feature | Removed |
