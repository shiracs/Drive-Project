#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}--- Starting Comprehensive Folder & Files Integration Test ---${NC}"

# ============================================================================
# 1. SETUP & AUTHENTICATION
# ============================================================================
echo -e "\n[1/7] Setting up User..."

# Register
curl -s -X POST "$BASE_URL/users" -H "$CONTENT_TYPE" \
  -d '{"username":"tester", "password":"123", "fullName":"Test User", "profilePic":"pic"}' > /dev/null

# Login
TOKEN=$(curl -s -X POST "$BASE_URL/tokens" -H "$CONTENT_TYPE" \
  -d '{"username":"tester", "password":"123"}' | grep -oP '(?<="id":")[^"]+')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Login failed! Exiting.${NC}"
    exit 1
fi
echo "Logged in with Token: $TOKEN"


# ============================================================================
# 2. HIERARCHY CREATION (Files & Folders)
# ============================================================================
echo -e "\n[2/7] Creating File Hierarchy..."

# A. Create Root File
echo "   Creating 'root_note.txt' (FILE)..."
ROOT_FILE_RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN" \
    -d '{"filename": "root_note.txt", "content": "I am at the root"}')
ROOT_FILE_ID=$(echo $ROOT_FILE_RES | grep -oP '(?<="id":")[^"]+')

# B. Create Root Folder
echo "   Creating 'Docs' (FOLDER)..."
ROOT_FOLDER_RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN" \
    -d '{"filename": "Docs", "type": "FOLDER"}')
ROOT_FOLDER_ID=$(echo $ROOT_FOLDER_RES | grep -oP '(?<="id":")[^"]+')

# C. Create File INSIDE Root Folder
echo "   Creating 'work.txt' inside 'Docs'..."
NESTED_FILE_RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN" \
    -d "{\"filename\": \"work.txt\", \"content\": \"Important work stuff\", \"type\": \"FILE\", \"parentId\": \"$ROOT_FOLDER_ID\"}")
NESTED_FILE_ID=$(echo $NESTED_FILE_RES | grep -oP '(?<="id":")[^"]+')

# D. Create Sub-Folder INSIDE Root Folder
echo "   Creating 'Archives' (FOLDER) inside 'Docs'..."
NESTED_FOLDER_RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN" \
    -d "{\"filename\": \"Archives\", \"type\": \"FOLDER\", \"parentId\": \"$ROOT_FOLDER_ID\"}")
NESTED_FOLDER_ID=$(echo $NESTED_FOLDER_RES | grep -oP '(?<="id":")[^"]+')

# E. Create Deep File INSIDE Sub-Folder
echo "   Creating 'old_secret.txt' inside 'Archives'..."
DEEP_FILE_RES=$(curl -s -X POST "$BASE_URL/files" -H "$CONTENT_TYPE" -H "Authorization: $TOKEN" \
    -d "{\"filename\": \"old_secret.txt\", \"content\": \"Hidden deep content\", \"type\": \"FILE\", \"parentId\": \"$NESTED_FOLDER_ID\"}")
DEEP_FILE_ID=$(echo $DEEP_FILE_RES | grep -oP '(?<="id":")[^"]+')

echo -e "${GREEN}Hierarchy Created Successfully!${NC}"


# ============================================================================
# 3. VERIFY LISTING & NAVIGATION
# ============================================================================
echo -e "\n[3/7] Verifying Directory Listing..."

# Verify Root Listing
echo "   Checking Root (Should see 'Docs' and 'root_note.txt')..."
ROOT_LIST=$(curl -s -X GET "$BASE_URL/files" -H "Authorization: $TOKEN")
if [[ $ROOT_LIST == *"Docs"* && $ROOT_LIST == *"root_note.txt"* && $ROOT_LIST != *"work.txt"* ]]; then
    echo -e "   ${GREEN}[PASS] Root listing is correct.${NC}"
else
    echo -e "   ${RED}[FAIL] Root listing incorrect: $ROOT_LIST${NC}"
fi

# Verify 'Docs' Listing
echo "   Checking 'Docs' folder (Should see 'work.txt' and 'Archives')..."
DOCS_LIST=$(curl -s -X GET "$BASE_URL/files?parentId=$ROOT_FOLDER_ID" -H "Authorization: $TOKEN")
if [[ $DOCS_LIST == *"work.txt"* && $DOCS_LIST == *"Archives"* ]]; then
    echo -e "   ${GREEN}[PASS] 'Docs' listing is correct.${NC}"
else
    echo -e "   ${RED}[FAIL] 'Docs' listing incorrect: $DOCS_LIST${NC}"
fi


# ============================================================================
# 4. CONTENT & LOGIC CHECKS
# ============================================================================
echo -e "\n[4/7] Testing Content & Logic Rules..."

# A. Get Content of File (Should succeed)
echo "   Fetching content of 'work.txt'..."
CONTENT=$(curl -s -X GET "$BASE_URL/files/$NESTED_FILE_ID" -H "Authorization: $TOKEN")
if [[ $CONTENT == *"Important work stuff"* ]]; then
    echo -e "   ${GREEN}[PASS] File content retrieved.${NC}"
else
    echo -e "   ${RED}[FAIL] Wrong content: $CONTENT${NC}"
fi

# B. Get Content of FOLDER (Should return children names JSON)
echo "   Fetching content of 'Docs' folder (Should return children names)..."
FOLDER_CONTENT=$(curl -s -X GET "$BASE_URL/files/$ROOT_FOLDER_ID" -H "Authorization: $TOKEN")
if [[ $FOLDER_CONTENT == *"work.txt"* && $FOLDER_CONTENT == *"Archives"* ]]; then
    echo -e "   ${GREEN}[PASS] Folder 'content' returned children names correctly.${NC}"
else
    echo -e "   ${RED}[FAIL] Folder content unexpected: $FOLDER_CONTENT${NC}"
fi

# C. Try to UPDATE a Folder (Should Fail)
echo "   Attempting to update 'Docs' folder content (Should Fail 400)..."
UPDATE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/files/$ROOT_FOLDER_ID" \
    -H "$CONTENT_TYPE" -H "Authorization: $TOKEN" -d '{"content": "hacking"}')

if [[ $UPDATE_RES == "400" ]]; then
    echo -e "   ${GREEN}[PASS] Blocked folder update correctly.${NC}"
else
    echo -e "   ${RED}[FAIL] Server allowed folder update or wrong error! Code: $UPDATE_RES${NC}"
fi


# ============================================================================
# 5. SEARCH TEST (Hybrid)
# ============================================================================
echo -e "\n[5/7] Testing Hybrid Search..."

# Search for "Archives" (Name match - Folder)
SEARCH1=$(curl -s -X GET "$BASE_URL/search/Archives" -H "Authorization: $TOKEN")
if [[ $SEARCH1 == *"Archives"* ]]; then
    echo -e "   ${GREEN}[PASS] Found folder by name.${NC}"
else
    echo -e "   ${RED}[FAIL] Search failed for folder name.${NC}"
fi

# Search for "Hidden" (Content match - Deep File)
SEARCH2=$(curl -s -X GET "$BASE_URL/search/Hidden" -H "Authorization: $TOKEN")
if [[ $SEARCH2 == *"old_secret.txt"* ]]; then
    echo -e "   ${GREEN}[PASS] Found deeply nested file by content.${NC}"
else
    echo -e "   ${RED}[FAIL] Search failed for file content.${NC}"
fi


# ============================================================================
# 6. RECURSIVE DELETION TEST (The Big One)
# ============================================================================
echo -e "\n[6/7] Testing Recursive Deletion..."
echo "   Deleting 'Docs' folder (Should delete EVERYTHING inside it)..."

curl -s -X DELETE "$BASE_URL/files/$ROOT_FOLDER_ID" -H "Authorization: $TOKEN" > /dev/null

# ============================================================================
# 7. FINAL VERIFICATION (Ghosts Check)
# ============================================================================
echo -e "\n[7/7] Verifying Cleanup..."

# Check Root List (Should only have root_note.txt, Docs should be gone)
FINAL_ROOT=$(curl -s -X GET "$BASE_URL/files" -H "Authorization: $TOKEN")
if [[ $FINAL_ROOT != *"Docs"* && $FINAL_ROOT == *"root_note.txt"* ]]; then
    echo -e "   ${GREEN}[PASS] 'Docs' folder removed from root.${NC}"
else
    echo -e "   ${RED}[FAIL] 'Docs' still in root!${NC}"
fi

# Check Nested File (Should be 404/Empty or Permission Denied)
# We expect 403 Forbidden because permissions are gone, or 404/Empty if handled differently
CHECK_NESTED=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$NESTED_FILE_ID" -H "Authorization: $TOKEN")
if [[ $CHECK_NESTED == "403" || $CHECK_NESTED == "404" || $CHECK_NESTED == "500" ]]; then
    echo -e "   ${GREEN}[PASS] Nested file 'work.txt' is inaccessible (Code: $CHECK_NESTED).${NC}"
else
    echo -e "   ${RED}[FAIL] Nested file still accessible! Code: $CHECK_NESTED${NC}"
fi

# Check Deep File
CHECK_DEEP=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/files/$DEEP_FILE_ID" -H "Authorization: $TOKEN")
if [[ $CHECK_DEEP == "403" || $CHECK_DEEP == "404" ]]; then
    echo -e "   ${GREEN}[PASS] Deep file 'old_secret.txt' is inaccessible.${NC}"
else
    echo -e "   ${RED}[FAIL] Deep file still accessible!${NC}"
fi

echo -e "\n${GREEN}--- TEST COMPLETED SUCCESSFULLY ---${NC}"