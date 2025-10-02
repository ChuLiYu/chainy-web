#!/bin/bash

# Chainy Frontend Deployment Script
# This script deploys the frontend to S3 and CloudFront without custom domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Chainy Frontend Deployment${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the chainy-web directory${NC}"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Get API endpoint from backend
echo -e "${BLUE}🔍 Getting API endpoint from backend...${NC}"
API_ENDPOINT=$(cd /Users/liyu/Programing/aws/chainy && terraform output -raw api_endpoint 2>/dev/null || echo "https://9qwxcajqf9.execute-api.ap-northeast-1.amazonaws.com")

if [ -z "$API_ENDPOINT" ]; then
    echo -e "${RED}❌ Could not get API Gateway endpoint${NC}"
    echo -e "${YELLOW}⚠️  Please make sure the backend is deployed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ API Gateway endpoint: ${API_ENDPOINT}${NC}"

# Create S3 bucket for frontend
BUCKET_NAME="chainy-prod-web-$(date +%s)"
echo -e "${BLUE}📦 Creating S3 bucket: ${BUCKET_NAME}${NC}"

aws s3 mb s3://${BUCKET_NAME} --region ap-northeast-1

# Configure S3 bucket for static website hosting
echo -e "${BLUE}⚙️  Configuring S3 bucket for static website hosting...${NC}"

aws s3api put-bucket-website \
    --bucket ${BUCKET_NAME} \
    --website-configuration '{
        "IndexDocument": {"Suffix": "index.html"},
        "ErrorDocument": {"Key": "index.html"}
    }'

# Disable block public access settings
echo -e "${BLUE}🔓 Disabling block public access settings...${NC}"

aws s3api delete-public-access-block --bucket ${BUCKET_NAME}

# Set bucket policy for public read access
echo -e "${BLUE}🔒 Setting bucket policy for public read access...${NC}"

cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket ${BUCKET_NAME} --policy file://bucket-policy.json
rm bucket-policy.json

# Build the frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"

# Set API endpoint for build
echo "VITE_CHAINY_API=${API_ENDPOINT}" > .env.production

# Install dependencies and build
npm ci
npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Upload to S3
echo -e "${BLUE}📤 Uploading files to S3...${NC}"

aws s3 sync dist/ s3://${BUCKET_NAME} --delete

echo -e "${GREEN}✅ Files uploaded to S3${NC}"

# Get S3 website URL
S3_WEBSITE_URL="http://${BUCKET_NAME}.s3-website-ap-northeast-1.amazonaws.com"

echo ""
echo -e "${GREEN}🎉 Frontend Deployment Complete!${NC}"
echo "=================================="

echo -e "${BLUE}📋 Deployment Details:${NC}"
echo -e "  S3 Bucket: ${BUCKET_NAME}"
echo -e "  S3 Website URL: ${S3_WEBSITE_URL}"
echo -e "  API Endpoint: ${API_ENDPOINT}"
echo ""

echo -e "${BLUE}🧪 Testing Commands:${NC}"
echo "====================="
echo ""
echo -e "${BLUE}Test S3 website:${NC}"
echo "curl -I ${S3_WEBSITE_URL}"
echo ""
echo -e "${BLUE}Test API integration:${NC}"
echo "curl -I ${API_ENDPOINT}/"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test the S3 website URL above"
echo "2. (Optional) Set up CloudFront distribution for better performance"
echo "3. (Optional) Configure custom domain with CloudFlare"
echo "4. Update your frontend code to use the new API endpoint"
echo ""

echo -e "${BLUE}🔧 CloudFront Setup (Optional):${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}To set up CloudFront for better performance:${NC}"
echo "1. Go to AWS CloudFront console"
echo "2. Create a new distribution"
echo "3. Set origin domain to: ${BUCKET_NAME}.s3-website-ap-northeast-1.amazonaws.com"
echo "4. Set default root object to: index.html"
echo "5. Configure custom error pages for SPA routing"
echo ""

echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "- S3 Console: https://s3.console.aws.amazon.com/s3/buckets/${BUCKET_NAME}"
echo "- CloudFront Console: https://console.aws.amazon.com/cloudfront"
echo "- API Gateway Console: https://console.aws.amazon.com/apigateway"
echo ""

echo -e "${GREEN}✅ Happy coding! 🚀${NC}"
