#!/bin/bash

# Test script for Peso Tracker Backend API
BASE_URL="http://localhost:3000/api"

echo "🚀 Testing Peso Tracker Backend API"
echo "=================================="

# Test Health Check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq .
echo ""

# Test User Registration
echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "password123"
  }')

echo $REGISTER_RESPONSE | jq .
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# Test User Login
echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123"
  }')

echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo ""

# Test Create Weight
echo "4. Testing Create Weight..."
WEIGHT_RESPONSE=$(curl -s -X POST "$BASE_URL/weights" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "weight": 72.5,
    "date": "2025-01-25",
    "notes": "Peso de prueba"
  }')

echo $WEIGHT_RESPONSE | jq .
WEIGHT_ID=$(echo $WEIGHT_RESPONSE | jq -r '.id')
echo ""

# Test Get Weights
echo "5. Testing Get Weights..."
curl -s -X GET "$BASE_URL/weights?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Get Single Weight
echo "6. Testing Get Single Weight..."
curl -s -X GET "$BASE_URL/weights/$WEIGHT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Create Main Goal
echo "7. Testing Create Main Goal..."
GOAL_RESPONSE=$(curl -s -X POST "$BASE_URL/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetWeight": 68.0,
    "targetDate": "2025-07-01",
    "type": "main"
  }')

echo $GOAL_RESPONSE | jq .
GOAL_ID=$(echo $GOAL_RESPONSE | jq -r '.id')
echo ""

# Test Create Milestone Goal
echo "8. Testing Create Milestone Goal..."
curl -s -X POST "$BASE_URL/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetWeight": 70.0,
    "targetDate": "2025-06-01",
    "type": "milestone",
    "parentGoalId": '$GOAL_ID',
    "milestoneNumber": 1
  }' | jq .
echo ""

# Test Get All Goals
echo "9. Testing Get All Goals..."
curl -s -X GET "$BASE_URL/goals" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Get Single Goal
echo "10. Testing Get Single Goal..."
curl -s -X GET "$BASE_URL/goals/$GOAL_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Update Goal
echo "11. Testing Update Goal..."
curl -s -X PATCH "$BASE_URL/goals/$GOAL_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetWeight": 67.5,
    "targetDate": "2025-08-01"
  }' | jq .
echo ""

# Test Upload Photo (create a test image file first)
echo "12. Testing Upload Photo..."
# Create a small test image file
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test_image.png

PHOTO_RESPONSE=$(curl -s -X POST "$BASE_URL/photos/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@test_image.png" \
  -F "weightId=$WEIGHT_ID" \
  -F "description=Foto de prueba")

echo $PHOTO_RESPONSE | jq .
PHOTO_ID=$(echo $PHOTO_RESPONSE | jq -r '.id')
echo ""

# Test Get All Photos
echo "13. Testing Get All Photos..."
curl -s -X GET "$BASE_URL/photos?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Get Photos by Weight ID
echo "14. Testing Get Photos by Weight ID..."
curl -s -X GET "$BASE_URL/photos?page=1&limit=10&weightId=$WEIGHT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Get Single Photo
echo "15. Testing Get Single Photo..."
curl -s -X GET "$BASE_URL/photos/$PHOTO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Delete Photo
echo "16. Testing Delete Photo..."
curl -s -X DELETE "$BASE_URL/photos/$PHOTO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test Delete Goal
echo "17. Testing Delete Goal..."
curl -s -X DELETE "$BASE_URL/goals/$GOAL_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Clean up test image
rm -f test_image.png

echo "✅ API Testing Complete!"