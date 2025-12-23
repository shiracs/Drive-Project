#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

echo "--- Starting Comprehensive EX3 Integration Test ---"

# 1. Register Users (Owner, Writer, Reader)
echo "[1/10] Registering 3 Users..."
curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" -d '{"username":"shira", "password":"123", "fullName":"Shira Owner", "profilePic":"img_a"}' > /dev/null
curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" -d '{"username":"yossi", "password":"456", "fullName":"Yossi Writer", "profilePic":"img_b"}' > /dev/null
curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" -d '{"username":"dani", "password":"789", "fullName":"Dani Reader", "profilePic":"img_c"}' > /dev/null

# 2. Login to get Tokens
echo "[2/10] Logging in to retrieve tokens..."
TOKEN_OWNER=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d '{"username":"shira", "password":"123"}' | grep -oP '(?<="id":")[^"]+')
TOKEN_WRITER=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d '{"username":"yossi", "password":"456"}' | grep -oP '(?<="id":")[^"]+')
TOKEN_READER=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d '{"username":"dani", "password":"789"}' | grep -oP '(?<="id":")[^"]+')

# 3. Owner uploads a file
echo "[3/10] Owner uploading file..."
FILE_RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_OWNER" \
    -d '{"filename": "shared.txt", "content": "Original Content"}')
FILE_ID=$(echo $FILE_RES | grep -oP '(?<="id":")[^"]+')
echo "File created: $FILE_ID"

# 4. Set up Permissions (Writer & Reader)
echo "[4/10] Granting WRITER to User B and READER to User C..."
curl -s -X POST "$BASE_URL/files/$FILE_ID/permissions" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_OWNER" \
    -d "{\"targetUserId\": \"$TOKEN_WRITER\", \"role\": \"WRITER\"}" > /dev/null
curl -s -X POST "$BASE_URL/files/$FILE_ID/permissions" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_OWNER" \
    -d "{\"targetUserId\": \"$TOKEN_READER\", \"role\": \"READER\"}" > /dev/null

# 5. Verify Metadata access
echo "[5/10] Checking if Reader can see metadata (GET /api/files/:id)..."
curl -i -s -X GET "$BASE_URL/files/$FILE_ID" -H "Authorization: $TOKEN_READER" | grep "200 OK"

# 6. Test Writer Role (PATCH Success)
echo "[6/10] Testing WRITER role update (Should succeed)..."
curl -s -X PATCH "$BASE_URL/files/$FILE_ID" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_WRITER" \
    -d '{"content": "Content updated by Writer"}' > /dev/null
# Verify the content actually changed
UPDATED_CONTENT=$(curl -s -X GET "$BASE_URL/files/$FILE_ID" -H "Authorization: $TOKEN_OWNER")
if [[ $UPDATED_CONTENT == *"Content updated by Writer"* ]]; then
    echo "   [PASS] Content updated successfully."
else
    echo "   [FAIL] Content was not updated."
fi

# 7. Test Reader Role (PATCH Forbidden)
echo "[7/10] Testing READER role update (Should fail - 403)..."
curl -i -s -X PATCH "$BASE_URL/files/$FILE_ID" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_READER" \
    -d '{"content": "Reader trying to hack"}' | grep "403 Forbidden"

# 8. Test Writer Deletion (Forbidden)
echo "[8/10] Testing WRITER role delete (Should fail - 403)..."
curl -i -s -X DELETE "$BASE_URL/files/$FILE_ID" -H "Authorization: $TOKEN_WRITER" | grep "403 Forbidden"

# 9. Test Owner Deletion (Success)
echo "[9/10] Testing OWNER role delete (Should succeed - 204)..."
curl -i -s -X DELETE "$BASE_URL/files/$FILE_ID" -H "Authorization: $TOKEN_OWNER" | grep "204 No Content"

# 10. Final Verification (Ghost Data Check)
echo "[10/10] Verifying file is gone from list (Should be empty)..."
LIST=$(curl -s -X GET "$BASE_URL/files" -H "Authorization: $TOKEN_OWNER")
if [[ $LIST == "[]" ]]; then
    echo "   [PASS] Global metadata cleaned up."
else
    echo "   [FAIL] File still appears in list."
fi

echo "--- Full System Integration Test Completed ---"
