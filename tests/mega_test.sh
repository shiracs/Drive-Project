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
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}   ULTRA COMPLEX TEST: DEEP TREES, DUPLICATES & PERMS        ${NC}"
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
# 1. SETUP USERS
# ============================================================================
echo -e "\n${YELLOW}[Step 1] Creating Users...${NC}"

create_user() {
    local name=$1
    local lower=$(echo "$name" | tr '[:upper:]' '[:lower:]')
    local res=$(curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
        -d "{\"username\":\"$lower\", \"password\":\"123\", \"fullName\":\"$name User\", \"profilePic\":\"pic\"}")
    local id=$(get_json_value "$res" "id")
    echo "$id"
}

ID_ALICE=$(create_user "Alice")     # Owner
ID_BOB=$(create_user "Bob")         # Dept Level Access
ID_CHARLIE=$(create_user "Charlie") # Project Level Access
ID_DAVE=$(create_user "Dave")       # File Level Access (Leaf)

echo "   Alice (Owner):   $ID_ALICE"
echo "   Bob (Dept):      $ID_BOB"
echo "   Charlie (Proj):  $ID_CHARLIE"
echo "   Dave (File):     $ID_DAVE"

if [ -z "$ID_ALICE" ]; then
    echo -e "${RED}FATAL: Failed to create users. Did you restart the server?${NC}"
    exit 1
fi

# ============================================================================
# 2. COMPLEX TREE CREATION
# ============================================================================
echo -e "\n${YELLOW}[Step 2] Building Complex Tree...${NC}"

# Root
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" -d '{"name": "Root", "type": "FOLDER"}')
ID_ROOT=$(get_json_value "$RES" "id")

# Level 1: Dept_Dev, Dept_HR
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" -d "{\"name\": \"Dept_Dev\", \"type\": \"FOLDER\", \"parentId\": \"$ID_ROOT\"}")
ID_DEPT_DEV=$(get_json_value "$RES" "id")

RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" -d "{\"name\": \"Dept_HR\", \"type\": \"FOLDER\", \"parentId\": \"$ID_ROOT\"}")
ID_DEPT_HR=$(get_json_value "$RES" "id")

# Level 2: Project_A, Project_B inside Dept_Dev
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" -d "{\"name\": \"Project_A\", \"type\": \"FOLDER\", \"parentId\": \"$ID_DEPT_DEV\"}")
ID_PROJ_A=$(get_json_value "$RES" "id")

RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" -d "{\"name\": \"Project_B\", \"type\": \"FOLDER\", \"parentId\": \"$ID_DEPT_DEV\"}")
ID_PROJ_B=$(get_json_value "$RES" "id")

# Level 3: Duplicate Files in Project_A (Same Name!)
# File 1
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"name\": \"spec.txt\", \"content\": \"Version 1 (Legacy)\", \"type\": \"FILE\", \"parentId\": \"$ID_PROJ_A\"}")
ID_FILE_1=$(get_json_value "$RES" "id")

# File 2 (Same name, same folder)
RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"name\": \"spec.txt\", \"content\": \"Version 2 (New)\", \"type\": \"FILE\", \"parentId\": \"$ID_PROJ_A\"}")
ID_FILE_2=$(get_json_value "$RES" "id")

echo "   Tree Built:"
echo "   Root -> Dept_Dev -> Project_A -> spec.txt ($ID_FILE_1)"
echo "                                 -> spec.txt ($ID_FILE_2)"
echo "                    -> Project_B"

# ============================================================================
# 3. LAYERED PERMISSIONS
# ============================================================================
echo -e "\n${YELLOW}[Step 3] Granting Layered Permissions...${NC}"

# Bob gets READER on Dept_Dev (Should recurse to Project_A, Project_B and both Files)
echo "   -> Granting Bob READER on 'Dept_Dev'..."
curl -s -X POST "$BASE_URL/files/$ID_DEPT_DEV/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_BOB\", \"role\": \"READER\"}" > /dev/null

# Charlie gets WRITER on Project_A (Should override Bob's Reader logic conceptually, but they are different users)
echo "   -> Granting Charlie WRITER on 'Project_A'..."
curl -s -X POST "$BASE_URL/files/$ID_PROJ_A/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_CHARLIE\", \"role\": \"WRITER\"}" > /dev/null

# Dave gets READER specifically on File 1 (The Legacy one)
echo "   -> Granting Dave READER on 'spec.txt' (Legacy)..."
curl -s -X POST "$BASE_URL/files/$ID_FILE_1/permissions" -H "$CONTENT_TYPE" -H "Authorization: $ID_ALICE" \
    -d "{\"targetUserId\": \"$ID_DAVE\", \"role\": \"READER\"}" > /dev/null

# Verify Access
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_2" -H "Authorization: $ID_BOB")
check_status $CODE 200 "Bob reads File 2 (Inherited)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ID_FILE_1" -H "$CONTENT_TYPE" -H "Authorization: $ID_CHARLIE" -d '{"content":"C"}')
check_status $CODE 204 "Charlie updates File 1 (Direct Parent WRITER)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_2" -H "Authorization: $ID_DAVE")
check_status $CODE 403 "Dave blocked from File 2 (Has only File 1)"

# ============================================================================
# 4. MID-TREE REVOCATION
# ============================================================================
echo -e "\n${YELLOW}[Step 4] Revoking Permissions from Middle of Tree...${NC}"

# Alice revokes Bob's access to 'Project_A' ONLY.
# Bob has access to 'Dept_Dev' (Parent). Can we revoke a child?
# In this implementation, permissions are distinct records. 
# When we granted on Dept_Dev, we created records for Project_A etc.
# So deleting the permission on Project_A should work and block access, even if Dept_Dev perm exists.
# (Logic: checkPermission finds ANY record. If we delete the Project_A record, does he still have Dept_Dev record?)
# Wait! checkPermission logic: "find the permission record for userId and resourceId".
# It checks specific resource. It doesn't check parent.
# So if we delete the record on Project_A, Bob loses access to Project_A! 
# Even though he "technically" has permission on Dept_Dev. The recursive grant created explicit records.
# THIS IS THE KEY TEST FOR MATERIALIZED PATH / RECURSIVE LOGIC.

echo "   -> Revoking Bob from 'Project_A'..."
PERM_ID=$(get_perm_id "$ID_PROJ_A" "$ID_BOB" "$ID_ALICE")
if [ -n "$PERM_ID" ]; then
    curl -s -X DELETE "$BASE_URL/files/$ID_PROJ_A/permissions/$PERM_ID" -H "Authorization: $ID_ALICE" > /dev/null
else
    echo -e "${RED}   [FAIL] Could not find Bob's permission on Project_A${NC}"
fi

# Verify Bob LOST access to Project_A files
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_1" -H "Authorization: $ID_BOB")
# Since deletePermission is recursive, it should have deleted Bob's permission on ID_FILE_1 too.
if [ "$CODE" -eq 403 ]; then
    echo -e "${GREEN}   [PASS] Bob blocked from Project_A files (Mid-tree revoke works)${NC}"
else
    echo -e "${RED}   [FAIL] Bob still has access! Code: $CODE${NC}"
fi

# Verify Bob STILL HAS access to Project_B (inherited from Dept_Dev and NOT revoked)
# Note: Since Project_B was under Dept_Dev, and we didn't touch it, the original recursive grant remains.
# We didn't create a file there in setup, let's verify he can see the folder Project_B.
# Listing Project_B requires permission on Project_B.
RES=$(curl -s -X GET "$BASE_URL/files?parentId=$ID_DEPT_DEV" -H "Authorization: $ID_BOB")
# He should see Project_B in the list? Actually, getFilesByUserId checks if user has perm on the FILE.
# Does Bob have perm on Project_B? Yes, from step 3. We didn't revoke it.
if [[ $RES == *"$ID_PROJ_B"* ]]; then
    echo -e "${GREEN}   [PASS] Bob still sees Project_B (Sibling untouched)${NC}"
else
    echo -e "${RED}   [FAIL] Bob lost access to Project_B too!${NC}"
fi

# ============================================================================
# 5. MID-TREE DELETION (THE ULTIMATE TEST)
# ============================================================================
echo -e "\n${YELLOW}[Step 5] Deleting a Folder from Middle of Tree...${NC}"

# Alice deletes 'Project_A'
# This should delete spec.txt (1) and spec.txt (2).
# Dept_Dev remains. Project_B remains.
echo "   -> Deleting 'Project_A'..."
curl -s -X DELETE "$BASE_URL/files/$ID_PROJ_A" -H "Authorization: $ID_ALICE" > /dev/null

# A. Verify Files Gone (404)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_1" -H "Authorization: $ID_ALICE")
check_status $CODE 404 "File 1 deleted"

# B. Verify Charlie (who had WRITER on Project_A) gets 404 (not 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_1" -H "Authorization: $ID_CHARLIE")
check_status $CODE 404 "Charlie sees 404"

# C. Verify Dave (who had DIRECT access to File 1) gets 404
# The file is physically gone. Dave's permission is irrelevant.
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_FILE_1" -H "Authorization: $ID_DAVE")
check_status $CODE 404 "Dave sees 404 (Direct permission is void)"

# D. Verify Dept_Dev still exists
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$ID_DEPT_DEV" -H "Authorization: $ID_ALICE")
check_status $CODE 200 "Parent folder Dept_Dev still exists"

# ============================================================================
# 6. SEARCH AFTER CHAOS
# ============================================================================
echo -e "\n${YELLOW}[Step 6] Search Verification...${NC}"

# Search for "spec.txt" - Should return NOTHING (deleted)
RES=$(curl -s -X GET "$BASE_URL/search/spec.txt" -H "Authorization: $ID_ALICE")
if [[ $RES == "[]" || $RES == "" ]]; then
    echo -e "${GREEN}   [PASS] Search returned empty for deleted files${NC}"
else
    echo -e "${RED}   [FAIL] Ghost files found in search! $RES${NC}"
fi

# ============================================================================
# 7. CLEANUP
# ============================================================================
echo -e "\n${YELLOW}[Step 7] Final Cleanup...${NC}"
curl -s -X DELETE "$BASE_URL/files/$ID_ROOT" -H "Authorization: $ID_ALICE" > /dev/null
echo "   Root deleted."

echo -e "\n${CYAN}=============================================================${NC}"
echo -e "${CYAN}             ULTRA TEST COMPLETED SUCCESSFULLY               ${NC}"
echo -e "${CYAN}=============================================================${NC}"