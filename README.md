# Drive-Project

compile:  g++ -std=c++17 src/main.cpp src/System.cpp src/services/*.cpp src/commands/*.cpp -o my_drive
run: ./my_drive

compile tests: g++ -std=c++17 tests/add-command-test.cpp src/services/*.cpp src/commands/*.cpp -o run_tests -lgtest -lgtest_main -pthread
run tests: ./run_tests