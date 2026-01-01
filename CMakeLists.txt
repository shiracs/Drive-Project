cmake_minimum_required(VERSION 3.14)

# The name of our project
project(DriveProject)

# Using C++17 because I used the <filesystem> library in my code
set(CMAKE_CXX_STANDARD 17)

# -----Core Logic Setup (Server Library)-----

# Gathering all the source files (Logic, Services, Commands).
file(GLOB_RECURSE SERVER_SOURCES 
    "server/System.cpp"
    "server/services/*.cpp" 
    "server/commands/*.cpp"
)

# Creating a shared library from the sources.
# this allows me to link this code to both the main app (server) and the tests.
add_library(core_logic ${SERVER_SOURCES})

# -----Server Application-----

# Creating the executable for the server app.
add_executable(server_app server/main.cpp)
# This links server.cpp with the core logic library and pthread (for threading).
target_link_libraries(server_app core_logic pthread)

# -----Client Application-----

# Creating the executable for the client app.
add_executable(client_app 
    client/main.cpp
    client/CliHandler.cpp
)
# Client is standalone, does not need core logic library.

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

add_executable(run_tests 
    ${TEST_SOURCES}
    client/CliHandler.cpp 
)

# Link the test runner to:
# 1. core_logic
# 2. GTest::gtest_main (Google's library, which includes its own main function)
# 3. pthread
target_link_libraries(run_tests core_logic GTest::gtest_main pthread)