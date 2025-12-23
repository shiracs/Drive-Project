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
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}    ROBUST SYSTEM TEST: NESTED FOLDERS & COMPLEX PERMS       ${NC}"
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

# Helper to find a Permission ID (pId) given a fileId and userId
# Necessary for the DELETE /permissions endpoint
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
# 1. USER CREATION (Alice, Bob, Charlie, Dave)
# ============================================================================
echo -e "\n${YELLOW}[Step 1] Creating 4 Users...${NC}"

create_user() {
    local name=$1
    local lower=$(echo "$name" | tr '[:upper:]' '[:lower:]')
    local res=$(curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
        -d "{\"username\":\"$lower\", \"password\":\"123\", \"fullName\":\"$name User\", \"profilePic\":\"pic\"}")
    local id=$(get_json_value "$res" "id")
    # Login to verify/get token format
    local login=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" -d "{\"username\":\"$lower\", \"password\":\"123\"}")
    local token=$(get_json_value "$login" "id")
    echo "$id"
}

ID_ALICE=$(create_user "Alice")
ID_BOB=$(create_user "Bob")
ID_CHARLIE=$(create_user "Charlie")
ID_DAVE=$(create_user "Dave")

echo "   Alice (Owner): $ID_ALICE"
echo "   Bob (Finance): $ID_BOB"
echo "   Charlie (IT):  $ID_CHARLIE"
echo "   Dave (Guest):  $ID_DAVE"

# ============================================================================
# 2. BUILDING COMPLEX HIERARCHY
# ============================================================================
echo -e "\n${YELLOW}[Step 2] Building 3-Layer Hierarchy...${NC}"

# ROOT: CorpData
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" -d '{"filename": "CorpData", "type": "FOLDER"}')
ID_ROOT=$(get_json_value "$RES" "id")
echo "   1. Root 'CorpData' created ($ID_ROOT)"

# LEVEL 1: Finance (Folder) & IT (Folder)
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"filename\": \"Finance\", \"type\": \"FOLDER\", \"parentId\": \"$ID_ROOT\"}")
ID_FINANCE=$(get_json_value "$RES" "id")

RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"filename\": \"IT\", \"type\": \"FOLDER\", \"parentId\": \"$ID_ROOT\"}")
ID_IT=$(get_json_value "$RES" "id")
echo "   2. Subfolders 'Finance' & 'IT' created"

# LEVEL 2: Files in Finance
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"filename\": \"budget.txt\", \"content\": \"1M USD\", \"type\": \"FILE\", \"parentId\": \"$ID_FINANCE\"}")
ID_BUDGET=$(get_json_value "$RES" "id")
echo "   3. File 'budget.txt' in Finance created"

# LEVEL 2: Folder in IT
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"filename\": \"Logs\", \"type\": \"FOLDER\", \"parentId\": \"$ID_IT\"}")
ID_LOGS=$(get_json_value "$RES" "id")

# LEVEL 3: File in Logs
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"filename\": \"server.log\", \"content\": \"System OK\", \"type\": \"FILE\", \"parentId\": \"$ID_LOGS\"}")
ID_SERVER_LOG=$(get_json_value "$RES" "id")
echo "   4. Deep file 'server.log' in IT/Logs created ($ID_SERVER_LOG)"


# ============================================================================
# 3. GRANTING PERMISSIONS (Complex Scenarios)
# ============================================================================
echo -e "\n${YELLOW}[Step 3] Granting Permissions...${NC}"

# A. Bob gets WRITER on Finance (Should allow reading/writing budget.txt)
echo "   -> Granting Bob WRITER on 'Finance'..."
curl -s -X POST "$BASE_URL/files/$ID_FINANCE/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"WRITER\"}" > /dev/null

# B. Charlie gets READER on IT (Should allow reading server.log)
echo "   -> Granting Charlie READER on 'IT'..."
curl -s -X POST "$BASE_URL/files/$ID_IT/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_CHARLIE\", \"role\": \"READER\"}" > /dev/null

# C. Dave gets READER on server.log DIRECTLY (bypassing folder permissions)
echo "   -> Granting Dave READER on 'server.log' (Directly)..."
curl -s -X POST "$BASE_URL/files/$ID_SERVER_LOG/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_DAVE\", \"role\": \"READER\"}" > /dev/null

# ============================================================================
# 4. VERIFYING ACCESS (The "Happy Path")
# ============================================================================
echo -e "\n${YELLOW}[Step 4] Verifying Access Control...${NC}"

# 1. Bob writes to budget (Should succeed)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_BUDGET" \
    -H "$CONTENT_TYPE" -H "Authorization: $ID_BOB" -d '{"content": "2M USD"}')
check_status $CODE 200 "Bob writes to budget.txt (Recursive Writer)"

# 2. Bob tries to access IT (Should fail)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_SERVER_LOG" -H "Authorization: $ID_BOB")
check_status $CODE 403 "Bob tries to read IT logs (Should be blocked)"

# 3. Charlie reads server.log (Should succeed)
CONTENT=$(curl -s -X GET "$BASE_URL/files/$ID_SERVER_LOG" -H "Authorization: $ID_CHARLIE")
if [[ $CONTENT == "System OK" ]]; then
    echo -e "${GREEN}   [PASS] Charlie reads deep log file${NC}"
else
    echo -e "${RED}   [FAIL] Charlie failed to read log${NC}"
fi

# 4. Charlie tries to WRITE server.log (Should fail - only READER)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_SERVER_LOG" \
    -H "$CONTENT_TYPE" -H "Authorization: $ID_CHARLIE" -d '{"content": "Hacked"}')
check_status $CODE 403 "Charlie tries to write (Should be blocked)"

# ============================================================================
# 5. UPDATING PERMISSIONS (Upgrade & Downgrade)
# ============================================================================
echo -e "\n${YELLOW}[Step 5] Modifying Permissions...${NC}"

# A. Upgrade Charlie to WRITER on IT
echo "   -> Upgrading Charlie to WRITER on 'IT'..."
curl -s -X POST "$BASE_URL/files/$ID_IT/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_CHARLIE\", \"role\": \"WRITER\"}" > /dev/null

# Test Charlie Write
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_SERVER_LOG" \
    -H "$CONTENT_TYPE" -H "Authorization: $ID_CHARLIE" -d '{"content": "Log Updated"}')
check_status $CODE 200 "Charlie writes to log after upgrade"

# B. Downgrade Bob to READER on Finance
echo "   -> Downgrading Bob to READER on 'Finance'..."
curl -s -X POST "$BASE_URL/files/$ID_FINANCE/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"READER\"}" > /dev/null

# Test Bob Write (Should Fail now)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_BUDGET" \
    -H "$CONTENT_TYPE" -H "Authorization: $ID_BOB" -d '{"content": "3M USD"}')
check_status $CODE 403 "Bob tries to write after downgrade (Should fail)"

# ============================================================================
# 6. REVOKING PERMISSIONS
# ============================================================================
echo -e "\n${YELLOW}[Step 6] Revoking Permissions...${NC}"

# Revoke Charlie from 'IT'
echo "   -> Revoking Charlie from 'IT'..."
# 1. Get Permission ID for Charlie on IT Folder
PERM_ID=$(get_perm_id "$ID_IT" "$ID_CHARLIE" "$ID_ALICE")

if [ -z "$PERM_ID" ]; then
    echo -e "${RED}   [FAIL] Could not find permission ID for Charlie${NC}"
else
    # 2. Delete it (Recursive revoke)
    curl -s -X DELETE "$BASE_URL/files/$ID_IT/permissions/$PERM_ID" -H "Authorization: $ID_ALICE" > /dev/null
    
    # 3. Verify Charlie cannot access server.log anymore
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_SERVER_LOG" -H "Authorization: $ID_CHARLIE")
    check_status $CODE 403 "Charlie accesses log after revoke (Should fail)"
fi

# Verify Dave STILL HAS ACCESS (He was granted directly on the file, outside IT folder logic)
# Note: If your deletePermission logic recurses down, it removes permissions for that user on descendants.
# Dave was granted on server.log directly. Charlie was granted on IT. 
# Revoking Charlie on IT should NOT affect Dave on server.log.
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_SERVER_LOG" -H "Authorization: $ID_DAVE")
check_status $CODE 200 "Dave (Direct Access) checks log (Should still succeed)"

# ============================================================================
# 7. DESTRUCTIVE ACTIONS
# ============================================================================
echo -e "\n${YELLOW}[Step 7] Recursive Deletion...${NC}"

echo "   -> Alice deletes ROOT 'CorpData'..."
curl -s -X DELETE "$BASE_URL/files/$ID_ROOT" -H "Authorization: $ID_ALICE" > /dev/null

# 1. Check File Gone
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_SERVER_LOG" -H "Authorization: $ID_ALICE")
check_status $CODE 404 "Deep file existence check (404)"

# 2. Check Dave Access (Should be 404 Not Found, NOT 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_SERVER_LOG" -H "Authorization: $ID_DAVE")
check_status $CODE 404 "Dave access after delete (404)"


echo -e "\n${CYAN}=============================================================${NC}"
echo -e "${CYAN}                  ROBUST TEST COMPLETED                      ${NC}"
echo -e "${CYAN}=============================================================${NC}"