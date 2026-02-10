#!/bin/bash

# Test script for multi-agent research system

set -e

echo "========================================="
echo "Multi-Agent Research System Test"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
COORDINATOR_URL="http://localhost:4000"
RESEARCHER_URL="http://localhost:4001"
SUMMARIZER_URL="http://localhost:4002"

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    if curl -s "$url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "Waiting for $name to start... "
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Ready${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ Timeout${NC}"
    return 1
}

echo "Step 1: Checking services"
echo "-------------------------"

# Check if services are running
services_ok=true
check_service "$COORDINATOR_URL" "Coordinator" || services_ok=false
check_service "$RESEARCHER_URL" "Researcher" || services_ok=false
check_service "$SUMMARIZER_URL" "Summarizer" || services_ok=false

if [ "$services_ok" = false ]; then
    echo ""
    echo -e "${YELLOW}Warning: Some services are not running${NC}"
    echo "Please start all agents before running this test:"
    echo "  Terminal 1: cd coordinator && npm start"
    echo "  Terminal 2: cd researcher && npm start"
    echo "  Terminal 3: cd summarizer && npm start"
    echo ""
    exit 1
fi

echo ""
echo "Step 2: Checking agent registration"
echo "------------------------------------"

agents_response=$(curl -s "$COORDINATOR_URL/agents")
echo "Registered agents:"
echo "$agents_response" | jq '.'

echo ""
echo "Step 3: Submitting research query"
echo "----------------------------------"

query="What are the latest developments in blockchain scalability?"
echo "Query: $query"
echo ""

response=$(curl -s -X POST "$COORDINATOR_URL/research" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"depth\": \"comprehensive\"}")

echo "Response:"
echo "$response" | jq '.'

# Extract task ID
task_id=$(echo "$response" | jq -r '.taskId')

if [ "$task_id" = "null" ] || [ -z "$task_id" ]; then
    echo -e "${RED}✗ Failed to create task${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Task created: $task_id${NC}"

echo ""
echo "Step 4: Checking task status"
echo "-----------------------------"

task_status=$(curl -s "$COORDINATOR_URL/task/$task_id")
echo "$task_status" | jq '.'

echo ""
echo "Step 5: Verifying results"
echo "-------------------------"

# Check if task completed successfully
status=$(echo "$task_status" | jq -r '.status')
if [ "$status" = "completed" ]; then
    echo -e "${GREEN}✓ Task completed successfully${NC}"
    
    # Display summary
    echo ""
    echo "Research Summary:"
    echo "----------------"
    echo "$task_status" | jq -r '.report.summary.executive'
    
    echo ""
    echo "Key Findings:"
    echo "$task_status" | jq -r '.report.summary.detailed.keyFindings[]' | while read -r line; do
        echo "  • $line"
    done
    
else
    echo -e "${RED}✗ Task status: $status${NC}"
    exit 1
fi

echo ""
echo "Step 6: System statistics"
echo "-------------------------"

stats=$(curl -s "$COORDINATOR_URL/stats")
echo "$stats" | jq '.'

echo ""
echo "========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "========================================="
