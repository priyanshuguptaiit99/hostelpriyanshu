#!/bin/bash

# Test Warden Request API Endpoints
# Make sure server is running on port 5000

echo "🧪 Testing Warden Request API"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5000/api"

echo "📝 Step 1: Login as Student"
echo "----------------------------"
read -p "Enter student email: " STUDENT_EMAIL
read -sp "Enter student password: " STUDENT_PASSWORD
echo ""

STUDENT_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"$STUDENT_PASSWORD\"}")

STUDENT_TOKEN=$(echo $STUDENT_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${RED}❌ Student login failed${NC}"
  echo "Response: $STUDENT_LOGIN"
  exit 1
else
  echo -e "${GREEN}✅ Student logged in successfully${NC}"
  STUDENT_NAME=$(echo $STUDENT_LOGIN | grep -o '"name":"[^"]*' | cut -d'"' -f4)
  echo "Name: $STUDENT_NAME"
fi

echo ""
echo "📝 Step 2: Submit Warden Request"
echo "----------------------------"

SUBMIT_RESULT=$(curl -s -X POST "$BASE_URL/warden-requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

echo "Response: $SUBMIT_RESULT"

if echo "$SUBMIT_RESULT" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Request submitted successfully${NC}"
else
  echo -e "${YELLOW}⚠️ Request may already exist or failed${NC}"
fi

echo ""
echo "📝 Step 3: Check My Request Status"
echo "----------------------------"

MY_REQUEST=$(curl -s -X GET "$BASE_URL/warden-requests/my-request" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

echo "Response: $MY_REQUEST"

echo ""
echo "📝 Step 4: Login as Admin"
echo "----------------------------"
read -p "Enter admin email: " ADMIN_EMAIL
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""

ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Admin login failed${NC}"
  echo "Response: $ADMIN_LOGIN"
  exit 1
else
  echo -e "${GREEN}✅ Admin logged in successfully${NC}"
  ADMIN_NAME=$(echo $ADMIN_LOGIN | grep -o '"name":"[^"]*' | cut -d'"' -f4)
  echo "Name: $ADMIN_NAME"
fi

echo ""
echo "📝 Step 5: Get All Warden Requests (Admin)"
echo "----------------------------"

ALL_REQUESTS=$(curl -s -X GET "$BASE_URL/warden-requests" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Response: $ALL_REQUESTS"

if echo "$ALL_REQUESTS" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Successfully fetched requests${NC}"
  
  # Extract stats
  TOTAL=$(echo $ALL_REQUESTS | grep -o '"total":[0-9]*' | cut -d':' -f2)
  PENDING=$(echo $ALL_REQUESTS | grep -o '"pending":[0-9]*' | cut -d':' -f2)
  APPROVED=$(echo $ALL_REQUESTS | grep -o '"approved":[0-9]*' | cut -d':' -f2)
  REJECTED=$(echo $ALL_REQUESTS | grep -o '"rejected":[0-9]*' | cut -d':' -f2)
  
  echo ""
  echo "📊 Stats:"
  echo "  Total: $TOTAL"
  echo "  Pending: $PENDING"
  echo "  Approved: $APPROVED"
  echo "  Rejected: $REJECTED"
else
  echo -e "${RED}❌ Failed to fetch requests${NC}"
fi

echo ""
echo "📝 Step 6: Get Pending Requests Only"
echo "----------------------------"

PENDING_REQUESTS=$(curl -s -X GET "$BASE_URL/warden-requests?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Response: $PENDING_REQUESTS"

echo ""
echo "================================"
echo "✅ Test completed!"
echo ""
echo "💡 Tips:"
echo "  - Check server logs for detailed information"
echo "  - Open browser console to see frontend logs"
echo "  - Use test-warden-api.html for interactive testing"
