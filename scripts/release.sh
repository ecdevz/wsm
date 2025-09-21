#!/bin/bash

# 🚀 Local Release Script for baileys-session-manager-mongodb
# This script helps you create releases locally that will trigger GitHub Actions deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "package.json not found. Make sure you're in the project root."
    exit 1
fi

# Check if git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    error "Git working directory is not clean. Please commit your changes first."
    git status --short
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warning "You are on branch '$CURRENT_BRANCH'. Consider creating releases from 'main' branch."
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Release cancelled"
        exit 1
    fi
fi

header "Local Release Helper"
echo "This script will help you create a release that triggers GitHub Actions deployment."
echo

# Get version type
echo "Select version type:"
echo "1) patch (1.0.0 → 1.0.1) - Bug fixes"
echo "2) minor (1.0.0 → 1.1.0) - New features"
echo "3) major (1.0.0 → 2.0.0) - Breaking changes"
echo "4) prerelease (1.0.0 → 1.0.1-0) - Pre-release version"
echo

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        VERSION_TYPE="prerelease"
        ;;
    *)
        error "Invalid choice"
        exit 1
        ;;
esac

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Current version: $CURRENT_VERSION"

# Calculate new version (for display only)
NEW_VERSION=$(npm version $VERSION_TYPE --dry-run | sed 's/^v//')
log "New version will be: $NEW_VERSION"

echo
read -p "Do you want to create this release? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Release cancelled"
    exit 1
fi

# Run validation
log "Running validation..."
npm run validate

success "Validation passed"

# Update version
log "Updating version..."
npm version $VERSION_TYPE

# Get the actual new version
ACTUAL_VERSION=$(node -p "require('./package.json').version")
TAG="v$ACTUAL_VERSION"

success "Version updated to: $ACTUAL_VERSION"

# Push changes
log "Pushing changes to GitHub..."
git push origin main
git push origin $TAG

success "Changes pushed to GitHub"

# Instructions
header "Next Steps"
echo "1. 🔄 GitHub Actions will automatically:"
echo "   - Run tests on multiple Node.js versions"
echo "   - Build the project"
echo "   - Publish to NPM when you create a GitHub release"
echo
echo "2. 🏷️ Create a GitHub release:"
echo "   - Go to: https://github.com/yourusername/baileys-session-manager-mongodb/releases/new"
echo "   - Choose tag: $TAG"
echo "   - Fill in release notes"
echo "   - Click 'Publish release'"
echo
echo "3. 📦 Or trigger manual deployment:"
echo "   - Go to Actions tab in your repository"
echo "   - Select '📦 Publish to NPM' workflow"
echo "   - Click 'Run workflow'"
echo

success "Release preparation complete!"
log "Tag created: $TAG"
log "Monitor deployment: https://github.com/yourusername/baileys-session-manager-mongodb/actions"