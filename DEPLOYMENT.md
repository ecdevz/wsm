# 🚀 Deployment Guide

This guide explains how to deploy the `baileys-session-manager-mongodb` package to NPM using GitHub Actions.

## 🔧 Setup Requirements

### 1. NPM Token

You need to create an NPM access token and add it to your GitHub repository secrets.

#### Creating NPM Token:
1. Login to [npmjs.com](https://www.npmjs.com/)
2. Go to **Account Settings** → **Access Tokens**
3. Click **Generate New Token**
4. Select **Automation** type
5. Copy the generated token

#### Adding to GitHub Secrets:
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your NPM token
6. Click **Add secret**

### 2. Repository Settings

Ensure your repository has the following settings:
- **Actions** are enabled
- **Write permissions** for GITHUB_TOKEN (Settings → Actions → General → Workflow permissions)

## 📦 Deployment Methods

### Method 1: Automatic Deployment (Recommended)

Automatically deploy when you create a GitHub release:

1. **Create a new release:**
   ```bash
   # Create and push a new tag
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **Create GitHub Release:**
   - Go to your repository on GitHub
   - Click **Releases** → **Create a new release**
   - Choose the tag you just created
   - Fill in release title and description
   - Click **Publish release**

3. **Automatic deployment:**
   - GitHub Actions will automatically trigger
   - Run tests across Node.js versions (16, 18, 20)
   - Build and publish to NPM
   - Create release notes

### Method 2: Manual Deployment

Manually trigger deployment using GitHub Actions:

1. **Go to Actions tab** in your GitHub repository
2. **Select** "📦 Publish to NPM" workflow
3. **Click** "Run workflow"
4. **Configure options:**
   - **Version type:** `patch`, `minor`, `major`, or `prerelease`
   - **NPM tag:** `latest`, `beta`, or `alpha`
   - **Dry run:** Check to test without publishing
5. **Click** "Run workflow"

## 🏷️ Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/) (SemVer):

- **Patch (1.0.1):** Bug fixes, documentation updates
- **Minor (1.1.0):** New features, backwards compatible
- **Major (2.0.0):** Breaking changes
- **Prerelease (1.0.1-beta.1):** Pre-release versions

### NPM Tags

- **`latest`:** Stable releases (default)
- **`beta`:** Beta releases for testing
- **`alpha`:** Alpha releases for early testing

## 📋 Deployment Process

The GitHub Actions workflow performs the following steps:

### 1. Testing & Validation
- ✅ Install dependencies
- ✅ Run ESLint checks
- ✅ Check code formatting
- ✅ Build TypeScript
- ✅ Run tests (if available)
- ✅ Test on multiple Node.js versions

### 2. Publishing
- ✅ Package integrity check
- ✅ Determine version and tag
- ✅ Update package.json (manual trigger)
- ✅ Publish to NPM
- ✅ Create GitHub release (manual trigger)
- ✅ Generate release notes

## 🔍 Testing Deployments

### Dry Run

Test your deployment without actually publishing:

1. Go to **Actions** → **📦 Publish to NPM**
2. Click **Run workflow**
3. **Check "Dry run"** option
4. Configure other options as needed
5. Click **Run workflow**

This will:
- Run all tests and validations
- Show what would be published
- Not actually publish to NPM

### Local Testing

Test your package locally before deployment:

```bash
# Build the package
npm run build

# Test the package
npm pack --dry-run

# Install locally for testing
npm pack
npm install -g baileys-session-manager-mongodb-1.0.0.tgz
```

## 📊 Monitoring Deployments

### GitHub Actions

Monitor deployment progress:
1. Go to **Actions** tab
2. Click on the running workflow
3. Monitor each step in real-time
4. Check logs for any issues

### NPM Package

Verify successful deployment:
- **NPM Package:** https://www.npmjs.com/package/baileys-session-manager-mongodb
- **Bundle Size:** https://bundlephobia.com/package/baileys-session-manager-mongodb
- **Download Stats:** https://npm-stat.com/charts.html?package=baileys-session-manager-mongodb

## 🚨 Troubleshooting

### Common Issues

#### 1. NPM Token Invalid
```
Error: npm ERR! code E401
```
**Solution:** Regenerate NPM token and update GitHub secret

#### 2. Version Already Exists
```
Error: npm ERR! You cannot publish over the previously published versions
```
**Solution:** Increment version number or use different tag

#### 3. Build Failures
```
Error: TypeScript compilation failed
```
**Solution:** Fix TypeScript errors and run `npm run build` locally

#### 4. Test Failures
```
Error: Tests failed
```
**Solution:** Fix failing tests and run `npm test` locally

### Debug Steps

1. **Check workflow logs** in GitHub Actions
2. **Run commands locally** to reproduce issues
3. **Verify NPM token** has correct permissions
4. **Check package.json** for correct configuration
5. **Ensure clean git state** before deployment

## 📝 Best Practices

### Before Deployment

- ✅ Test your changes locally
- ✅ Update documentation
- ✅ Update CHANGELOG.md
- ✅ Ensure clean git working directory
- ✅ Run full test suite
- ✅ Verify build works correctly

### Release Notes

Create meaningful release notes:
```markdown
## 🚀 Release v1.0.1

### 🐛 Bug Fixes
- Fixed MongoDB connection timeout issue
- Improved error handling for session data

### 📚 Documentation
- Updated README with new examples
- Added troubleshooting guide

### 🔧 Internal
- Updated dependencies
- Improved TypeScript types
```

### Versioning Strategy

- **Patch:** Weekly bug fixes and small improvements
- **Minor:** Monthly feature releases
- **Major:** Quarterly major updates with breaking changes
- **Prerelease:** As needed for testing new features

## 🔄 Automation

### Branch Protection

Set up branch protection rules:
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Require:
   - Pull request reviews
   - Status checks (GitHub Actions)
   - Up-to-date branches

### Release Templates

Create release templates in `.github/RELEASE_TEMPLATE.md`:
```markdown
## What's Changed
- 

## Breaking Changes
- 

## Migration Guide
- 

## Contributors
- 
```

This ensures consistent and informative releases for your users.

---

## 📞 Support

If you encounter issues with deployment:

1. Check this documentation
2. Review GitHub Actions logs
3. Check NPM package status
4. Create an issue in the repository

Happy deploying! 🚀