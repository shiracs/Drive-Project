#!/bin/bash

# ============================================================================
# CONFIGURATION
# ============================================================================
BASE_URL="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for nice output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}       FINAL SYSTEM INTEGRATION TEST (CORRECTED)             ${NC}"
echo -e "${BLUE}=============================================================${NC}"

# ------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------

# Extracts a value from a JSON response using Node.js (Robust)
get_json_value() {
    echo "$1" | node -e "
        try {
            const input = require('fs').readFileSync(0, 'utf-8');
            const json = JSON.parse(input);
            console.log(json['$2'] || '');
        } catch (e) { console.log(''); }
    "
}

# Checks HTTP Status Code
check_status() {
    local expected=$2
    local actual=$1
    local context=$3
    if [ "$actual" -eq "$expected" ]; then
        echo -e "${GREEN}   [PASS] $context (Status: $actual)${NC}"
    else
        echo -e "${RED}   [FAIL] $context - Expected $expected but got $actual${NC}"
    fi
}

# ============================================================================
# 1. USER SETUP (Alice, Bob, Charlie)
# ============================================================================
echo -e "\n${YELLOW}[Step 1] Creating Users & Tokens...${NC}"

# --- Create Alice ---
# Note: registerUser returns the user object (with id), generateToken returns { id: ... }
# Since Authorization header is the userId, we can use the ID from register directly.

# 1. Register Alice
RES_ALICE=$(curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
    -d '{"username":"alice", "password":"123", "fullName":"Alice Admin", "profilePic":"img1"}')
ID_ALICE=$(get_json_value "$RES_ALICE" "id")

if [ -z "$ID_ALICE" ]; then
    echo -e "${RED}Critical Error: Failed to create Alice. Server might be down or user exists.${NC}"
    echo "Response: $RES_ALICE"
    exit 1
fi

# 2. Login Alice (To verify token generation works)
RES_LOGIN=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d '{"username":"alice", "password":"123"}')
TOKEN_ALICE=$(get_json_value "$RES_LOGIN" "id") # UserController returns { id: ... }

# --- Create Bob ---
RES_BOB=$(curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
    -d '{"username":"bob", "password":"123", "fullName":"Bob Worker", "profilePic":"img2"}')
ID_BOB=$(get_json_value "$RES_BOB" "id")
# Login Bob
RES_LOGIN_BOB=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d '{"username":"bob", "password":"123"}')
TOKEN_BOB=$(get_json_value "$RES_LOGIN_BOB" "id")

# --- Create Charlie ---
RES_CHARLIE=$(curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
    -d '{"username":"charlie", "password":"123", "fullName":"Charlie Guest", "profilePic":"img3"}')
ID_CHARLIE=$(get_json_value "$RES_CHARLIE" "id")
TOKEN_CHARLIE=$ID_CHARLIE # Shortcut, ID is the token in this system

echo "   Alice ID/Token: $TOKEN_ALICE"
echo "   Bob ID/Token:   $TOKEN_BOB"
echo "   Charlie ID:     $ID_CHARLIE"

# ============================================================================
# 2. HIERARCHY & DUPLICATES
# ============================================================================
echo -e "\n${YELLOW}[Step 2] Alice creating deep folder structure...${NC}"

# 1. Create Root Folder "Work"
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_ALICE" \
    -d '{"filename": "Work", "type": "FOLDER"}')
ID_ROOT=$(get_json_value "$RES" "id")
echo "   Created Root Folder 'Work' ($ID_ROOT)"

# 2. Create SUB Folder "Projects" inside "Work"
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_ALICE" \
    -d "{\"filename\": \"Projects\", \"type\": \"FOLDER\", \"parentId\": \"$ID_ROOT\"}")
ID_PROJECTS=$(get_json_value "$RES" "id")
echo "   Created 'Projects' inside 'Work' ($ID_PROJECTS)"

# 3. Create FILE "notes.txt" inside "Projects" (Deep nesting)
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_ALICE" \
    -d "{\"filename\": \"notes.txt\", \"content\": \"Original Deep Content\", \"type\": \"FILE\", \"parentId\": \"$ID_PROJECTS\"}")
ID_FILE_DEEP=$(get_json_value "$RES" "id")
echo "   Created 'notes.txt' inside 'Projects' ($ID_FILE_DEEP)"

# 4. Create DUPLICATE FILE "notes.txt" inside "Work" (Same name, different location)
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_ALICE" \
    -d "{\"filename\": \"notes.txt\", \"content\": \"Root Note Content\", \"type\": \"FILE\", \"parentId\": \"$ID_ROOT\"}")
ID_FILE_ROOT=$(get_json_value "$RES" "id")
echo "   Created duplicate 'notes.txt' inside 'Work' ($ID_FILE_ROOT)"

# ============================================================================
# 3. VERIFY ISOLATION (No Permissions yet)
# ============================================================================
echo -e "\n${YELLOW}[Step 3] Verifying Isolation...${NC}"

# Bob tries to read deep file
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_DEEP" -H "Authorization: $TOKEN_BOB")
check_status $CODE 403 "Bob tries to read 'notes.txt' before permissions (Should Fail)"

# ============================================================================
# 4. RECURSIVE PERMISSION GRANT (READER)
# ============================================================================
echo -e "\n${YELLOW}[Step 4] Alice grants READER to Bob on ROOT 'Work'...${NC}"
# This should allow Bob to see Work, Projects, and read both notes.txt files

curl -s -X POST "$BASE_URL/files/$ID_ROOT/permissions" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"READER\"}" > /dev/null

# Test 1: Bob reads Root listing
LIST=$(curl -s -X GET "$BASE_URL/files?parentId=$ID_ROOT" -H "Authorization: $TOKEN_BOB")
# Check if output contains the ID of the subfolder or file
if [[ $LIST == *"$ID_PROJECTS"* && $LIST == *"$ID_FILE_ROOT"* ]]; then
    echo -e "${GREEN}   [PASS] Bob can list contents of Root${NC}"
else
    echo -e "${RED}   [FAIL] Bob cannot see contents of Root. Got: $LIST${NC}"
fi

# Test 2: Bob reads Deep File Content
CONTENT=$(curl -s -X GET "$BASE_URL/files/$ID_FILE_DEEP" -H "Authorization: $TOKEN_BOB")
if [[ $CONTENT == "Original Deep Content" ]]; then
    echo -e "${GREEN}   [PASS] Bob read deep file content (Recursive Permission Success)${NC}"
else
    echo -e "${RED}   [FAIL] Bob failed to read content. Got: $CONTENT${NC}"
fi

# Test 3: Bob tries to UPDATE Deep File (Should FAIL - he is only READER)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_FILE_DEEP" \
    -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_BOB" -d '{"content": "Hacked"}')
check_status $CODE 403 "Bob tries to write as READER (Should Fail)"

# ============================================================================
# 5. PERMISSION UPDATE (READER -> WRITER)
# ============================================================================
echo -e "\n${YELLOW}[Step 5] Upgrading Bob to WRITER on the Deep File...${NC}"

# Alice grants WRITER specifically on the Deep File (or Parent, doesn't matter, we test logic)
curl -s -X POST "$BASE_URL/files/$ID_FILE_DEEP/permissions" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"WRITER\"}" > /dev/null

# Test: Bob tries to UPDATE Deep File again
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_FILE_DEEP" \
    -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_BOB" -d '{"content": "Bob Was Here"}')
check_status $CODE 200 "Bob tries to write as WRITER (Should Success)"

# Verify Content Change
NEW_CONTENT=$(curl -s -X GET "$BASE_URL/files/$ID_FILE_DEEP" -H "Authorization: $TOKEN_ALICE")
if [[ $NEW_CONTENT == "Bob Was Here" ]]; then
    echo -e "${GREEN}   [PASS] File content successfully updated${NC}"
else
    echo -e "${RED}   [FAIL] File content did not change! Got: $NEW_CONTENT${NC}"
fi

# ============================================================================
# 6. FOLDER LOGIC GUARDS
# ============================================================================
echo -e "\n${YELLOW}[Step 6] Testing logic guards...${NC}"
# Try to update content of a FOLDER (should be blocked by FileController logic)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_PROJECTS" \
    -H "$CONTENT_TYPE" -H "Authorization: $TOKEN_ALICE" -d '{"content": "bad"}')
check_status $CODE 400 "Attempt to update folder content (Should Fail)"

# ============================================================================
# 7. RECURSIVE DELETE & VERIFICATION
# ============================================================================
echo -e "\n${YELLOW}[Step 7] Testing Recursive Deletion...${NC}"

# Alice deletes ROOT "Work" folder
curl -s -X DELETE "$BASE_URL/files/$ID_ROOT" -H "Authorization: $TOKEN_ALICE" > /dev/null
echo "   Alice deleted root folder."

# Verify Deep File is gone (Expect 404 from server because FileModel.findById will return undefined)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_DEEP" -H "Authorization: $TOKEN_ALICE")
# Note: depending on your controller implementation, if file not found it might return 404 or just crash/empty.
# Assuming standard 404 or 403.
if [[ "$CODE" == "404" ]]; then
     echo -e "${GREEN}   [PASS] Deep file is gone (404)${NC}"
else
     echo -e "${RED}   [FAIL] Deep file still reachable! Code: $CODE${NC}"
fi

# Verify Permissions are cleaned up
# Bob checks access. Should be 404 (File not found) or 403 (No access).
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_DEEP" -H "Authorization: $TOKEN_BOB")
if [[ "$CODE" == "404" ]]; then
     echo -e "${GREEN}   [PASS] Bob gets 404 on deleted file${NC}"
else
     echo -e "${RED}   [FAIL] Unexpected code for Bob: $CODE${NC}"
fi

echo -e "\n${BLUE}=============================================================${NC}"
echo -e "${BLUE}                  TESTS COMPLETED SUCCESSFULLY               ${NC}"
echo -e "${BLUE}=============================================================${NC}"