#!/usr/bin/env bash
# Pre-deployment check script for Netlify
# This script validates the environment and catches common deployment errors

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error counter
ERRORS=0
WARNINGS=0

echo -e "${BLUE}🔍 Netlify Pre-deployment Check${NC}"
echo "======================================="

# Function to log errors
log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

# Function to log warnings
log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

# Function to log success
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to log info
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check Node.js version
echo
log_info "Checking Node.js version..."
NODE_VERSION=$(node --version)
if [[ ! "$NODE_VERSION" =~ ^v2[2-9] ]] && [[ ! "$NODE_VERSION" =~ ^v[3-9] ]]; then
    log_error "Node.js version $NODE_VERSION may not be compatible with Netlify. Recommended: v22+"
else
    log_success "Node.js version $NODE_VERSION is compatible"
fi

# Check if package.json exists
echo
log_info "Checking package.json..."
if [[ ! -f "package.json" ]]; then
    log_error "package.json not found"
else
    log_success "package.json found"
fi

# Check for required dependencies
echo
log_info "Checking dependencies..."
required_deps=("@netlify/functions" "@types/react" "typescript" "vite")
for dep in "${required_deps[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        log_success "$dep is installed"
    else
        log_warning "$dep is not installed or not listed in package.json"
    fi
done

# Check environment variables
echo
log_info "Checking environment variables..."
required_env_vars=("VITE_LINE_LIFF_ID" "VITE_LINE_CHANNEL_ID")
for var in "${required_env_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        if [[ -f ".env" ]] && grep -q "^$var=" .env; then
            log_success "$var is defined in .env file"
        else
            log_error "$var is not set and not found in .env file"
        fi
    else
        log_success "$var is set in environment"
    fi
done

# Validate .env format
if [[ -f ".env" ]]; then
    echo
    log_info "Validating .env file format..."
    
    # Check for invalid line endings
    if file .env | grep -q "CRLF"; then
        log_warning ".env file has Windows line endings (CRLF). Consider converting to Unix (LF)"
    fi
    
    # Check for lines without proper format
    invalid_lines=$(grep -n "^[^#].*[^=]$" .env | grep -v "^[A-Za-z_][A-Za-z0-9_]*=" || true)
    if [[ -n "$invalid_lines" ]]; then
        log_warning ".env file contains potentially invalid lines: $invalid_lines"
    else
        log_success ".env file format looks valid"
    fi
fi

# TypeScript compilation check
echo
log_info "Checking TypeScript compilation..."
if [[ -f "tsconfig.json" ]]; then
    if npx tsc --noEmit --skipLibCheck; then
        log_success "TypeScript compilation check passed"
    else
        log_error "TypeScript compilation check failed"
    fi
else
    log_warning "tsconfig.json not found"
fi

# Check Functions directory and files
echo
log_info "Checking Netlify Functions..."
if [[ -d "netlify/functions" ]]; then
    function_files=$(find netlify/functions -name "*.ts" -o -name "*.js" | wc -l)
    if [[ $function_files -gt 0 ]]; then
        log_success "Found $function_files function file(s)"
        
        # Check if Functions have proper exports
        for func_file in netlify/functions/*.ts netlify/functions/*.js; do
            if [[ -f "$func_file" ]]; then
                if grep -q "export.*handler" "$func_file"; then
                    log_success "$(basename "$func_file") has proper handler export"
                else
                    log_error "$(basename "$func_file") missing handler export"
                fi
            fi
        done
    else
        log_warning "No function files found in netlify/functions"
    fi
else
    log_warning "netlify/functions directory not found"
fi

# Check build configuration
echo
log_info "Checking build configuration..."
if [[ -f "netlify.toml" ]]; then
    log_success "netlify.toml found"
    
    # Check key configurations
    if grep -q "publish.*=.*\"dist\"" netlify.toml; then
        log_success "Publish directory is set to 'dist'"
    else
        log_warning "Publish directory not set to 'dist' in netlify.toml"
    fi
    
    if grep -q "command.*=.*\"npm.*build\"" netlify.toml; then
        log_success "Build command is properly configured"
    else
        log_warning "Build command may not be properly configured"
    fi
else
    log_warning "netlify.toml not found - using default Netlify settings"
fi

# Check for common problematic files
echo
log_info "Checking for problematic files..."
problematic_patterns=("node_modules" ".DS_Store" "*.log" "npm-debug.log*")
for pattern in "${problematic_patterns[@]}"; do
    if [[ -f "$pattern" ]] || [[ -d "$pattern" ]]; then
        log_warning "Found $pattern - ensure it's in .gitignore"
    fi
done

# Try a test build (optional, can be skipped with --skip-build)
if [[ "${1:-}" != "--skip-build" ]]; then
    echo
    log_info "Running test build..."
    if npm run build; then
        log_success "Test build completed successfully"
        
        # Check if dist directory was created
        if [[ -d "dist" ]]; then
            log_success "dist directory created"
            
            # Check if index.html exists in dist
            if [[ -f "dist/index.html" ]]; then
                log_success "index.html found in dist"
            else
                log_error "index.html not found in dist directory"
            fi
        else
            log_error "dist directory not created by build"
        fi
    else
        log_error "Test build failed"
    fi
else
    log_info "Skipping test build (--skip-build flag provided)"
fi

# Final summary
echo
echo "======================================="
if [[ $ERRORS -eq 0 ]]; then
    log_success "Pre-deployment check completed!"
    echo -e "${GREEN}Ready for deployment! ✨${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}Note: $WARNINGS warning(s) found. Review them if needed.${NC}"
    fi
    exit 0
else
    log_error "Pre-deployment check failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo -e "${RED}Please fix the errors before deploying.${NC}"
    exit 1
fi