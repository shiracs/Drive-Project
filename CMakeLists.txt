# We need version 3.14 or later to use FetchContent below
cmake_minimum_required(VERSION 3.14)

# The name of our project
project(DriveProject)

# Using C++17 because I used the <filesystem> library in my code
set(CMAKE_CXX_STANDARD 17)

# -----Core Logic Setup-----

# Gathering all the source files (Logic, Services, Commands).
file(GLOB_RECURSE SOURCES 
    "src/System.cpp"
    "src/services/*.cpp" 
    "src/commands/*.cpp"
)

# Creating a shared library from the sources.
# this allows me to link this code to both the main app and the tests.
add_library(core_logic ${SOURCES})

# -----Main Application-----

# Creating the executable for the main app.
add_executable(my_drive src/main.cpp)
# This links main.cpp with the core logic library.
target_link_libraries(my_drive core_logic)

# -----Google Test Setup-----

# download Google Test from github automatically.
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/heads/main.zip
)

# prevents some linking issues on Windows
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

# Actually downloads and builds GTest now
FetchContent_MakeAvailable(googletest)

# -----Tests Setup-----

enable_testing()

# Find all the test files in the tests folder
file(GLOB TEST_SOURCES "tests/*.cpp")

# Create the test runner executable
add_executable(run_tests ${TEST_SOURCES})

# Link the test runner to:
# 1. core_logic
# 2. GTest::gtest_main (Google's library, which includes its own main function)
target_link_libraries(run_tests core_logic GTest::gtest_main)