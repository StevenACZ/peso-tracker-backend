#!/bin/bash

# Debug test for goals endpoint
BASE_URL="http://localhost:3000/api"

echo "🔍 Debug Test for Goals API"
echo "=========================="

# Test User Login first
echo "1. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123"
  }')

echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# Test Create Simple Goal (only required fields)
echo "2. Testing Create Simple Goal..."
curl -s -X POST "$BASE_URL/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetWeight": 70.0,
    "targetDate": "2025-06-01"
  }' | jq .
echo ""

# Test Create Goal with type
echo "3. Testing Create Goal with type..."
curl -s -X POST "$BASE_URL/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetWeight": 68.0,
    "targetDate": "2025-07-01",
    "type": "main"
  }' | jq .
echo ""

# Test Get Goals
echo "4. Testing Get Goals..."
curl -s -X GET "$BASE_URL/goals" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ Debug Test Complete!"