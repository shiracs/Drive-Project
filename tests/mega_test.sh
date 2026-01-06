#!/bin/bash

# ============================================================================
# CONFIGURATION
# ============================================================================
BASE_URL="http://localhost:5000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}   FULL MEGA TEST: DEEP TREES, DUPLICATES & PERMS            ${NC}"
echo -e "${BLUE}=============================================================${NC}"

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

# חילוץ ערכים מ-JSON או מה-Location Header
get_json_value() {
    echo "$1" | node -e "
        try {
            const input = require('fs').readFileSync(0, 'utf-8');
            // חילוץ מ-Location Header (עבור 201 Created)
            const locMatch = input.match(/location: \/api\/files\/([^\s\r\n]+)/i);
            if (locMatch) { console.log(locMatch[1]); process.exit(0); }
            
            // חילוץ מגוף ה-JSON
            const body = input.split('\r\n\r\n').pop();
            const json = JSON.parse(body || input);
            console.log(json['$2'] || json['id'] || '');
        } catch (e) { console.log(''); }
    "
}

# חילוץ מזהה הרשאה (pId) עבור משתמש ספציפי על קובץ ספציפי
get_perm_id() {
    local fileId=$1
    local targetUserId=$2
    local token=$3
    local res=$(curl -s -X GET "$BASE_URL/files/$fileId/permissions" -H "Authorization: $token")
    echo "$res" | node -e "
        try {
            const list = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
            const p = list.find(x => x.userId === '$targetUserId');
            console.log(p ? p.id : '');
        } catch(e) { console.log(''); }
    "
}

check_status() {
    local actual=$1
    local expected=$2
    local context=$3
    if [ "$actual" -eq "$expected" ]; then
        echo -e "${GREEN}   [PASS] $context ($actual)${NC}"
    else
        echo -e "${RED}   [FAIL] $context - Expected $expected but got $actual${NC}"
    fi
}

# ============================================================================
# 1. SETUP USERS
# ============================================================================
echo -e "\n${YELLOW}[Step 1] Creating Users...${NC}"

create_user() {
    local name=$1
    local res=$(curl -s -i -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
        -d "{\"username\":\"${name,,}\", \"password\":\"123\", \"fullName\":\"$name User\", \"profilePic\":\"pic\"}")
    get_json_value "$res" "id"
}

ID_ALICE=$(create_user "Alice")
ID_BOB=$(create_user "Bob")
ID_CHARLIE=$(create_user "Charlie")
ID_DAVE=$(create_user "Dave")

echo "   Users Created: Alice, Bob, Charlie, Dave"

# ============================================================================
# 2. COMPLEX TREE CREATION
# ============================================================================
echo -e "\n${YELLOW}[Step 2] Building Complex Tree...${NC}"

create_res() {
    local name=$1
    local type=$2
    local parent=$3
    local content=$4
    local res=$(curl -s -i -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
        -d "{\"name\": \"$name\", \"type\": \"$type\", \"parentId\": \"$parent\", \"content\": \"$content\"}")
    get_json_value "$res" "id"
}

ID_ROOT=$(create_res "Root" "FOLDER" "")
ID_DEPT_DEV=$(create_res "Dept_Dev" "FOLDER" "$ID_ROOT")
ID_PROJ_A=$(create_res "Project_A" "FOLDER" "$ID_DEPT_DEV")
ID_PROJ_B=$(create_res "Project_B" "FOLDER" "$ID_DEPT_DEV")

# יצירת קבצים עם אותו שם בתוך Project_A
ID_FILE_1=$(create_res "spec.txt" "FILE" "$ID_PROJ_A" "Version 1")
ID_FILE_2=$(create_res "spec.txt" "FILE" "$ID_PROJ_A" "Version 2")

echo "   Tree Built: Root -> Dept_Dev -> Project_A -> [spec.txt (1), spec.txt (2)]"

# ============================================================================
# 3. LAYERED PERMISSIONS
# ============================================================================
echo -e "\n${YELLOW}[Step 3] Granting Layered Permissions...${NC}"

# Bob -> READER on Dept_Dev (Inherited to all children)
curl -s -X POST "$BASE_URL/files/$ID_DEPT_DEV/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"READER\"}" > /dev/null

# Charlie -> WRITER on Project_A
curl -s -X POST "$BASE_URL/files/$ID_PROJ_A/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_CHARLIE\", \"role\": \"WRITER\"}" > /dev/null

# Dave -> READER on File 1 only
curl -s -X POST "$BASE_URL/files/$ID_FILE_1/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_DAVE\", \"role\": \"READER\"}" > /dev/null

# Verify Access
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_2" -H "Authorization: $ID_BOB")
check_status $CODE 200 "Bob reads File 2 (Inherited)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_FILE_1" -H "$CONTENT_TYPE" -H "Authorization: $ID_CHARLIE" -d '{"content":"New Content"}')
check_status $CODE 204 "Charlie updates File 1 (Parent WRITER)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_2" -H "Authorization: $ID_DAVE")
check_status $CODE 403 "Dave blocked from File 2"

# ============================================================================
# 4. MID-TREE REVOCATION
# ============================================================================
echo -e "\n${YELLOW}[Step 4] Revoking Bob from Project_A...${NC}"

PERM_ID=$(get_perm_id "$ID_PROJ_A" "$ID_BOB" "$ID_ALICE")
if [ -n "$PERM_ID" ]; then
    curl -s -X DELETE "$BASE_URL/files/$ID_PROJ_A/permissions/$PERM_ID" -H "Authorization: $ID_ALICE" > /dev/null
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_1" -H "Authorization: $ID_BOB")
    check_status $CODE 403 "Bob blocked after revoke"
else
    echo -e "${RED}   [FAIL] Permission ID for Bob not found${NC}"
fi

# ============================================================================
# 5. DELETION & SEARCH
# ============================================================================
echo -e "\n${YELLOW}[Step 5] Deleting Folder & Search Verification...${NC}"

curl -s -X DELETE "$BASE_URL/files/$ID_PROJ_A" -H "Authorization: $ID_ALICE" > /dev/null

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_1" -H "Authorization: $ID_ALICE")
check_status $CODE 404 "File 1 deleted"

RES=$(curl -s -X GET "$BASE_URL/search/spec.txt" -H "Authorization: $ID_ALICE")
if [[ $RES == "[]" ]]; then
    echo -e "${GREEN}   [PASS] Search empty for deleted files${NC}"
else
    echo -e "${RED}   [FAIL] Search still finds deleted files${NC}"
fi

echo -e "\n${BLUE}=============================================================${NC}"