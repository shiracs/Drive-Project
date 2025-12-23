#!/bin/bash

# ============================================================================
# CONFIGURATION
# ============================================================================
BASE_URL="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}   ULTIMATE STRESS TEST: DUPLICATES, PERMS & SEARCH          ${NC}"
echo -e "${BLUE}=============================================================${NC}"

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
get_json_value() {
    echo "$1" | node -e "
        try {
            const input = require('fs').readFileSync(0, 'utf-8');
            const json = JSON.parse(input);
            console.log(json['$2'] || '');
        } catch (e) { console.log(''); }
    "
}

# Helper to find permission ID needed for revocation
get_perm_id() {
    local fileId=$1
    local targetUserId=$2
    local token=$3
    curl -s -X GET "$BASE_URL/files/$fileId/permissions" -H "Authorization: $token" | \
    node -e "
        try {
            const input = require('fs').readFileSync(0, 'utf-8');
            const list = JSON.parse(input);
            const p = list.find(x => x.userId === '$targetUserId');
            console.log(p ? p.id : '');
        } catch(e) { console.log(''); }
    "
}

check_status() {
    local expected=$2
    local actual=$1
    local context=$3
    if [ "$actual" -eq "$expected" ]; then
        echo -e "${GREEN}   [PASS] $context ($actual)${NC}"
    else
        echo -e "${RED}   [FAIL] $context - Expected $expected but got $actual${NC}"
    fi
}

# ============================================================================
# 1. SETUP USERS (Alice, Bob, Charlie, Dave)
# ============================================================================
echo -e "\n${YELLOW}[Step 1] Creating 4 Users...${NC}"

create_user() {
    local name=$1
    local lower=$(echo "$name" | tr '[:upper:]' '[:lower:]')
    local res=$(curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
        -d "{\"username\":\"$lower\", \"password\":\"123\", \"fullName\":\"$name User\", \"profilePic\":\"pic\"}")
    local id=$(get_json_value "$res" "id")
    echo "$id"
}

ID_ALICE=$(create_user "Alice")   # The Owner
ID_BOB=$(create_user "Bob")       # Has access to File A
ID_CHARLIE=$(create_user "Charlie") # Has access to File B
ID_DAVE=$(create_user "Dave")     # Has access to the whole Folder

echo "   Alice (Owner):   $ID_ALICE"
echo "   Bob (File A):    $ID_BOB"
echo "   Charlie (File B):$ID_CHARLIE"
echo "   Dave (Folder):   $ID_DAVE"

if [ -z "$ID_ALICE" ]; then
    echo -e "${RED}FATAL: Failed to create users. Did you restart the server?${NC}"
    exit 1
fi

# ============================================================================
# 2. CREATE THE "CONFUSING" STRUCTURE
# ============================================================================
echo -e "\n${YELLOW}[Step 2] Creating Duplicate Files Structure...${NC}"

# Root Folder
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" -d '{"filename": "Confidential", "type": "FOLDER"}')
ID_ROOT=$(get_json_value "$RES" "id")

# File A: "secret.txt" (Content: "Version 1 - For Bob")
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"filename\": \"secret.txt\", \"content\": \"Version 1 - For Bob\", \"type\": \"FILE\", \"parentId\": \"$ID_ROOT\"}")
ID_FILE_A=$(get_json_value "$RES" "id")

# File B: "secret.txt" (Content: "Version 2 - For Charlie") - SAME NAME, SAME FOLDER!
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"filename\": \"secret.txt\", \"content\": \"Version 2 - For Charlie\", \"type\": \"FILE\", \"parentId\": \"$ID_ROOT\"}")
ID_FILE_B=$(get_json_value "$RES" "id")

echo "   Created File A (ID: $ID_FILE_A)"
echo "   Created File B (ID: $ID_FILE_B)"
echo "   (Both are named 'secret.txt' inside 'Confidential')"

if [ "$ID_FILE_A" == "$ID_FILE_B" ]; then
    echo -e "${RED}[FAIL] IDs are identical! System failed to handle duplicates.${NC}"
    exit 1
fi

# ============================================================================
# 3. GRANULAR PERMISSION GRANTS
# ============================================================================
echo -e "\n${YELLOW}[Step 3] Granting Specific Permissions...${NC}"

# Bob gets READER on File A ONLY
curl -s -X POST "$BASE_URL/files/$ID_FILE_A/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"READER\"}" > /dev/null

# Charlie gets READER on File B ONLY
curl -s -X POST "$BASE_URL/files/$ID_FILE_B/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_CHARLIE\", \"role\": \"READER\"}" > /dev/null

# Dave gets READER on the whole ROOT FOLDER (Should see both)
curl -s -X POST "$BASE_URL/files/$ID_ROOT/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_DAVE\", \"role\": \"READER\"}" > /dev/null

# ============================================================================
# 4. VERIFY ACCESS ISOLATION (CRITICAL TEST)
# ============================================================================
echo -e "\n${YELLOW}[Step 4] Verifying Access Isolation (The 'Duplicate' Test)...${NC}"

# Test Bob (Should see V1, Fail on V2)
CONTENT=$(curl -s -X GET "$BASE_URL/files/$ID_FILE_A" -H "Authorization: $ID_BOB")
if [[ $CONTENT == *"Version 1"* ]]; then
    echo -e "${GREEN}   [PASS] Bob can read File A${NC}"
else
    echo -e "${RED}   [FAIL] Bob cannot read File A${NC}"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_B" -H "Authorization: $ID_BOB")
check_status $CODE 403 "Bob trying to read File B (Should Fail)"


# Test Charlie (Should see V2, Fail on V1)
CONTENT=$(curl -s -X GET "$BASE_URL/files/$ID_FILE_B" -H "Authorization: $ID_CHARLIE")
if [[ $CONTENT == *"Version 2"* ]]; then
    echo -e "${GREEN}   [PASS] Charlie can read File B${NC}"
else
    echo -e "${RED}   [FAIL] Charlie cannot read File B${NC}"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_A" -H "Authorization: $ID_CHARLIE")
check_status $CODE 403 "Charlie trying to read File A (Should Fail)"


# Test Dave (Should see BOTH because he has Folder access)
CONTENT_A=$(curl -s -X GET "$BASE_URL/files/$ID_FILE_A" -H "Authorization: $ID_DAVE")
CONTENT_B=$(curl -s -X GET "$BASE_URL/files/$ID_FILE_B" -H "Authorization: $ID_DAVE")

if [[ $CONTENT_A == *"Version 1"* && $CONTENT_B == *"Version 2"* ]]; then
    echo -e "${GREEN}   [PASS] Dave can read BOTH files (Folder Permission works)${NC}"
else
    echo -e "${RED}   [FAIL] Dave failed to read one or both files${NC}"
fi

# ============================================================================
# 5. PERMISSION UPDATES (UPGRADE & REVOKE)
# ============================================================================
echo -e "\n${YELLOW}[Step 5] Complex Permission Changes...${NC}"

# A. Upgrade Bob to WRITER on File A
echo "   -> Upgrading Bob to WRITER on File A..."
curl -s -X POST "$BASE_URL/files/$ID_FILE_A/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"WRITER\"}" > /dev/null

# Bob Updates File A
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_FILE_A" \
    -H "$CONTENT_TYPE" -H "Authorization: $ID_BOB" -d '{"content": "Bob Updated V1"}')
check_status $CODE 204 "Bob writes to File A"

# B. Revoke Dave from Root Folder
echo "   -> Revoking Dave from Root Folder..."
PERM_ID=$(get_perm_id "$ID_ROOT" "$ID_DAVE" "$ID_ALICE")
curl -s -X DELETE "$BASE_URL/files/$ID_ROOT/permissions/$PERM_ID" -H "Authorization: $ID_ALICE" > /dev/null

# Check Dave Access (Should be gone for both files)
CODE_A=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_A" -H "Authorization: $ID_DAVE")
CODE_B=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_B" -H "Authorization: $ID_DAVE")

if [[ $CODE_A == "403" && $CODE_B == "403" ]]; then
    echo -e "${GREEN}   [PASS] Dave successfully revoked from all files${NC}"
else
    echo -e "${RED}   [FAIL] Dave still has access! A:$CODE_A B:$CODE_B${NC}"
fi

# ============================================================================
# 6. SEARCH SCOPE TEST
# ============================================================================
echo -e "\n${YELLOW}[Step 6] Testing Search Scope (Who finds what?)...${NC}"

# Search query: "secret" (Both files are named secret.txt)

# Bob searches (Should find ONLY File A)
SEARCH_BOB=$(curl -s -X GET "$BASE_URL/search/secret" -H "Authorization: $ID_BOB")
COUNT_BOB=$(echo $SEARCH_BOB | grep -o "id" | wc -l)

if [[ $SEARCH_BOB == *"$ID_FILE_A"* && $SEARCH_BOB != *"$ID_FILE_B"* ]]; then
    echo -e "${GREEN}   [PASS] Bob found only his authorized file${NC}"
else
    echo -e "${RED}   [FAIL] Bob search incorrect. Got: $SEARCH_BOB${NC}"
fi

# Alice searches (Should find BOTH)
SEARCH_ALICE=$(curl -s -X GET "$BASE_URL/search/secret" -H "Authorization: $ID_ALICE")
COUNT_ALICE=$(echo $SEARCH_ALICE | grep -o "id" | wc -l)

if [[ $COUNT_ALICE -ge 2 ]]; then
    echo -e "${GREEN}   [PASS] Alice found both duplicates${NC}"
else
    echo -e "${RED}   [FAIL] Alice didn't find both. Got: $SEARCH_ALICE${NC}"
fi

# Dave searches (Should find NOTHING)
SEARCH_DAVE=$(curl -s -X GET "$BASE_URL/search/secret" -H "Authorization: $ID_DAVE")
if [[ $SEARCH_DAVE == "[]" || $SEARCH_DAVE == "" ]]; then
    echo -e "${GREEN}   [PASS] Dave found nothing (Correct)${NC}"
else
    echo -e "${RED}   [FAIL] Dave found something! $SEARCH_DAVE${NC}"
fi

# ============================================================================
# 7. CLEANUP
# ============================================================================
echo -e "\n${YELLOW}[Step 7] Cleanup...${NC}"
curl -s -X DELETE "$BASE_URL/files/$ID_ROOT" -H "Authorization: $ID_ALICE" > /dev/null

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_A" -H "Authorization: $ID_ALICE")
check_status $CODE 404 "Verify Deletion"

echo -e "\n${MAGENTA}=============================================================${NC}"
echo -e "${MAGENTA}                ULTIMATE TEST PASSED                         ${NC}"
echo -e "${MAGENTA}=============================================================${NC}"