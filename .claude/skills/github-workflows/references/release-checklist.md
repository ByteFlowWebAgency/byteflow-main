# Release Checklist Reference

## Pre-Release Checks (All Strategies)

Before starting any release process, verify:

- [ ] All intended features/fixes are merged into the release source branch
- [ ] CI/CD pipeline is green (no failing tests or builds)
- [ ] Code coverage meets team threshold (typically 80%+)
- [ ] No known critical bugs in the release scope
- [ ] Security scan has been run (Dependabot, Snyk, or equivalent)
- [ ] Release notes / CHANGELOG draft is prepared or will be generated
- [ ] Team lead or release manager has approved the release scope

---

## GitFlow Release Checklist

### Step 1: Create Release Branch
```bash
git checkout develop
git pull origin develop
git checkout -b release/vX.Y.Z
```

### Step 2: Update Version Files
- [ ] Update `package.json`, `pyproject.toml`, or `VERSION` file
- [ ] Commit: `git commit -m "chore(release): bump version to vX.Y.Z"`

### Step 3: Update CHANGELOG
- [ ] Add new version section at top of CHANGELOG.md
- [ ] Categorize: Added, Changed, Fixed, Deprecated, Removed, Security
- [ ] Commit: `git commit -m "docs(changelog): update for vX.Y.Z"`

### Step 4: Final QA on Release Branch
- [ ] Deploy release branch to staging
- [ ] Smoke test critical user paths
- [ ] Fix any last-minute issues directly on release branch (not develop)

### Step 5: Merge to Main
```bash
git checkout main
git merge --no-ff release/vX.Y.Z
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

### Step 6: Merge Back to Develop
```bash
git checkout develop
git merge --no-ff release/vX.Y.Z
```

### Step 7: Cleanup
```bash
git branch -d release/vX.Y.Z
git push origin main develop --tags
```

---

## GitHub Flow Release Checklist

### Step 1: Ensure Main is Stable
```bash
git checkout main
git pull origin main
git status   # must be clean
```

### Step 2: Verify CI is Green
- [ ] All checks passing on latest main commit

### Step 3: Determine Version
```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
# Analyze commits for MAJOR/MINOR/PATCH decision
```

### Step 4: Update Version and CHANGELOG
- [ ] Edit version file
- [ ] Prepend new section to CHANGELOG.md
- [ ] Commit: `git commit -m "chore(release): bump version to vX.Y.Z"`

### Step 5: Tag and Push
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

---

## Hotfix Checklist (GitFlow)

Used for urgent production bugs that cannot wait for the next release cycle.

```bash
# Branch from main (NOT develop)
git checkout main
git pull origin main
git checkout -b hotfix/vX.Y.Z/brief-description

# Fix the issue
# ... make changes ...
git commit -m "fix: [description of fix]"

# Bump patch version
# Update version file, commit

# Merge to main
git checkout main
git merge --no-ff hotfix/vX.Y.Z/brief-description
git tag -a vX.Y.Z -m "Hotfix vX.Y.Z"

# Merge back to develop (critical — don't skip this)
git checkout develop
git merge --no-ff hotfix/vX.Y.Z/brief-description

# Cleanup
git branch -d hotfix/vX.Y.Z/brief-description
git push origin main develop --tags
```

⚠️ **Never branch hotfixes from `develop`** — hotfixes must fix what is in production (`main`).

---

## Post-Release Checklist

- [ ] Tags pushed to remote: `git push origin --tags`
- [ ] GitHub Release created with release notes
- [ ] Team notified (Slack, email, etc.)
- [ ] Milestone closed in GitHub Issues / Jira
- [ ] Deployment to production triggered or confirmed
- [ ] Monitoring dashboards checked 30 minutes post-deploy
- [ ] CHANGELOG.md committed and visible on main

---

## Rollback Procedure

If a release is critically broken:

### Option 1: Revert via new hotfix (preferred)
```bash
git checkout -b hotfix/vX.Y.Z-rollback
git revert <commit-sha>   # or revert the merge commit
git commit -m "revert: rollback vX.Y.Z due to [reason]"
# Follow hotfix checklist above
```

### Option 2: Deploy previous tag
```bash
git checkout vX.Y.Z-1   # previous stable version
# Deploy this commit through your CI/CD pipeline
```

⚠️ **Never force-push to `main`** to undo a release. Always move forward with a revert commit or hotfix — this preserves history and audit trail.
