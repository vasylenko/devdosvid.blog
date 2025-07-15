#!/bin/bash

# BlogGPT Deployment Script
# Automated setup and deployment of the AI-powered blog ecosystem

set -e

echo "🤖 BlogGPT - AI-Powered Blog Ecosystem Deployment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check for wrangler
    if ! command -v wrangler &> /dev/null; then
        print_warning "Wrangler CLI not found. Installing..."
        npm install -g wrangler
    fi
    
    print_success "All dependencies are available"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Setup CloudFlare resources
setup_cloudflare_resources() {
    print_status "Setting up CloudFlare resources..."
    
    # Check if user is logged in to CloudFlare
    if ! wrangler whoami &> /dev/null; then
        print_warning "Please log in to CloudFlare first:"
        wrangler login
    fi
    
    # Create KV namespaces
    print_status "Creating KV namespaces..."
    
    KV_NAMESPACE=$(wrangler kv:namespace create "BLOG_METADATA" --json | jq -r '.id')
    KV_NAMESPACE_PREVIEW=$(wrangler kv:namespace create "BLOG_METADATA" --preview --json | jq -r '.id')
    
    print_success "KV namespaces created"
    print_status "Production KV ID: $KV_NAMESPACE"
    print_status "Preview KV ID: $KV_NAMESPACE_PREVIEW"
    
    # Create Vectorize index
    print_status "Creating Vectorize index..."
    wrangler vectorize create blog-content-vectors --dimensions=768 --metric=cosine
    print_success "Vectorize index created"
    
    # Update wrangler.toml with KV namespace IDs
    print_status "Updating wrangler.toml configuration..."
    sed -i.bak "s/id = \"blog_metadata_namespace\"/id = \"$KV_NAMESPACE\"/" wrangler.toml
    sed -i.bak "s/preview_id = \"blog_metadata_preview\"/preview_id = \"$KV_NAMESPACE_PREVIEW\"/" wrangler.toml
    rm wrangler.toml.bak
    
    print_success "CloudFlare resources setup complete"
}

# Configure secrets
configure_secrets() {
    print_status "Configuring secrets..."
    
    if [ -z "$GITHUB_TOKEN" ]; then
        print_warning "GitHub token not found in environment."
        echo "Please enter your GitHub Personal Access Token:"
        echo "(You can create one at: https://github.com/settings/tokens)"
        echo "Required permissions: repo (for repository access)"
        read -s GITHUB_TOKEN
        echo
    fi
    
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | wrangler secret put GITHUB_TOKEN
        print_success "GitHub token configured"
    else
        print_error "GitHub token is required for deployment"
        exit 1
    fi
    
    # Optional webhook secret
    if [ -n "$WEBHOOK_SECRET" ]; then
        echo "$WEBHOOK_SECRET" | wrangler secret put WEBHOOK_SECRET
        print_success "Webhook secret configured"
    fi
}

# Update configuration
update_configuration() {
    print_status "Updating configuration..."
    
    # Get repository information from git if available
    if git rev-parse --git-dir > /dev/null 2>&1; then
        REPO_URL=$(git config --get remote.origin.url)
        if [[ $REPO_URL =~ github\.com[:/]([^/]+)/([^/]+)(\.git)?$ ]]; then
            GITHUB_OWNER="${BASH_REMATCH[1]}"
            GITHUB_REPO="${BASH_REMATCH[2]%.git}"
            
            print_status "Detected GitHub repository: $GITHUB_OWNER/$GITHUB_REPO"
            
            # Update wrangler.toml with detected values
            sed -i.bak "s/GITHUB_REPO_OWNER = \"vasylenko\"/GITHUB_REPO_OWNER = \"$GITHUB_OWNER\"/" wrangler.toml
            sed -i.bak "s/GITHUB_REPO_NAME = \"devdosvid.blog\"/GITHUB_REPO_NAME = \"$GITHUB_REPO\"/" wrangler.toml
            rm wrangler.toml.bak
        fi
    fi
    
    # Ask for blog URL
    echo "Please enter your blog's base URL (e.g., https://yourblog.com):"
    read BLOG_URL
    
    if [ -n "$BLOG_URL" ]; then
        sed -i.bak "s|BLOG_BASE_URL = \"https://serhii.vasylenko.info\"|BLOG_BASE_URL = \"$BLOG_URL\"|" wrangler.toml
        rm wrangler.toml.bak
        print_success "Blog URL configured: $BLOG_URL"
    fi
}

# Deploy the worker
deploy_worker() {
    print_status "Deploying BlogGPT to CloudFlare Workers..."
    
    # Build the project
    npm run build
    
    # Deploy to CloudFlare
    wrangler deploy
    
    print_success "BlogGPT deployed successfully!"
    
    # Get the worker URL
    WORKER_URL=$(wrangler whoami | grep "Account ID" | awk '{print $3}')
    if [ -n "$WORKER_URL" ]; then
        print_success "Your BlogGPT is available at: https://bloggpt-ai-ecosystem.$WORKER_URL.workers.dev"
    fi
}

# Test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Wait a moment for deployment to propagate
    sleep 5
    
    # Test the status endpoint
    WORKER_URL="https://bloggpt-ai-ecosystem.$(wrangler whoami | grep "Account ID" | awk '{print $3}').workers.dev"
    
    if curl -s "$WORKER_URL/api/status" > /dev/null; then
        print_success "Deployment test passed!"
        print_status "Try your BlogGPT at: $WORKER_URL"
    else
        print_warning "Deployment test failed. Please check the worker logs."
    fi
}

# Main deployment flow
main() {
    echo
    print_status "Starting BlogGPT deployment process..."
    echo
    
    # Check if we're in the right directory
    if [ ! -f "wrangler.toml" ]; then
        print_error "wrangler.toml not found. Please run this script from the cloudflare-worker directory."
        exit 1
    fi
    
    # Run deployment steps
    check_dependencies
    install_dependencies
    setup_cloudflare_resources
    configure_secrets
    update_configuration
    deploy_worker
    test_deployment
    
    echo
    print_success "🎉 BlogGPT deployment completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Visit your worker URL to test the interface"
    echo "2. Try creating a blog post with natural language"
    echo "3. Check your GitHub repository for the generated content"
    echo "4. Configure any additional settings in wrangler.toml"
    echo
    echo "Example usage:"
    echo '  curl -X POST https://your-worker.workers.dev/api/chat \'
    echo '    -H "Content-Type: application/json" \'
    echo '    -d '"'"'{"message": "Write a blog post about CloudFlare Workers AI"}'"'"
    echo
    echo "For more information, see the README.md file."
    echo
}

# Handle script arguments
case "${1:-}" in
    "clean")
        print_status "Cleaning up deployment..."
        rm -rf node_modules
        npm cache clean --force
        print_success "Cleanup completed"
        ;;
    "dev")
        print_status "Starting development server..."
        wrangler dev
        ;;
    "logs")
        print_status "Showing worker logs..."
        wrangler tail
        ;;
    "help"|"-h"|"--help")
        echo "BlogGPT Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Deploy BlogGPT to CloudFlare Workers"
        echo "  clean      Clean up build artifacts and dependencies"
        echo "  dev        Start development server"
        echo "  logs       Show worker logs"
        echo "  help       Show this help message"
        echo ""
        ;;
    *)
        main
        ;;
esac