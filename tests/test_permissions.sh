#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

echo "--- Starting Advanced Permissions & Lifecycle Test ---"

# 1. Setup Users
echo "[1/10] Registering Owner (Shira) and Target User (Yossi)..."
curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" -d '{"username":"shira", "password":"123", "fullName":"Shira", "profilePic":"p1"}' > /dev/null
curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" -d '{"username":"yossi", "password":"456", "fullName":"Yossi", "profilePic":"p2"}' > /dev/null

TOKEN_OWNER=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d '{"username":"shira", "password":"123"}' | grep -oP '(?<="id":")[^"]+')
TOKEN_USER=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d '{"username":"yossi", "password":"456"}' | grep -oP '(?<="id":")[^"]+')

# 2. Create File
echo "[2/10] Owner uploading file..."
FILE_RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_OWNER" \
    -d '{"filename": "contract.txt", "content": "Initial Version"}')
FILE_ID=$(echo $FILE_RES | grep -oP '(?<="id":")[^"]+')

# 3. Grant Initial READER Access
echo "[3/10] Granting initial READER role to Yossi..."
curl -s -X POST "$BASE_URL/files/$FILE_ID/permissions" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_OWNER" \
    -d "{\"targetUserId\": \"$TOKEN_USER\", \"role\": \"READER\"}" > /dev/null

# 4. Identify Permission ID (pId)
# We fetch the list and extract the pId for Yossi
PID=$(curl -s -X GET "$BASE_URL/files/$FILE_ID/permissions" -H "Authorization: $TOKEN_OWNER" | grep -oP '(?<="id":")[^"]+' | tail -n 1)
echo "   Target Permission ID (pId) found: $PID"

# 5. Check Edge Case: READER cannot PATCH file
echo "[4/10] Verifying READER cannot edit file (Should fail - 403)..."
curl -i -s -X PATCH "$BASE_URL/files/$FILE_ID" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_USER" \
    -d '{"content": "hack"}' | grep "403 Forbidden"

# 6. Test New PATCH Endpoint: Upgrade to WRITER
echo "[5/10] Upgrading Yossi to WRITER (PATCH /permissions/:pId)..."
curl -i -s -X PATCH "$BASE_URL/files/$FILE_ID/permissions/$PID" \
    -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_OWNER" \
    -d '{"role": "WRITER"}' | grep "200 OK"

# 7. Verify Cohesion: New WRITER can now PATCH file
echo "[6/10] Verifying upgraded WRITER can now edit file (Should succeed)..."
curl -i -s -X PATCH "$BASE_URL/files/$FILE_ID" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_USER" \
    -d '{"content": "Updated by upgraded writer"}' | grep "200 OK"

# 8. Test Edge Case: Invalid Role Upgrade
echo "[7/10] Testing invalid role validation (Should fail - 400)..."
curl -i -s -X PATCH "$BASE_URL/files/$FILE_ID/permissions/$PID" \
    -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_OWNER" \
    -d '{"role": "ADMIN_HACKER"}' | grep "400 Bad Request"

# 9. Test New DELETE Endpoint: Revoke Access
echo "[8/10] Revoking Yossi's access (DELETE /permissions/:pId)..."
curl -i -s -X DELETE "$BASE_URL/files/$FILE_ID/permissions/$PID" \
    -H "Authorization: $TOKEN_OWNER" | grep "204 No Content"

# 10. Verify Revocation: Yossi can no longer GET file
echo "[9/10] Verifying Yossi is blocked from GET after revocation (Should fail - 403)..."
curl -i -s -X GET "$BASE_URL/files/$FILE_ID" -H "Authorization: $TOKEN_USER" | grep "403 Forbidden"

# 11. Final Cleanup
echo "[10/10] Final cleanup: Owner deleting file..."
curl -i -s -X DELETE "$BASE_URL/files/$FILE_ID" -H "Authorization: $TOKEN_OWNER" | grep "204 No Content"

echo "--- Advanced Test Completed ---"