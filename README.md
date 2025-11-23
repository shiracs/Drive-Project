# Drive-Project

## How to Run
from the root directory(/Drive-Project), run the following commands:

### 1. Build the Docker Image
First, build the image. This will download dependencies (GTest) and compile the code.
```bash
docker build -t drive-project .
```

### 2. Run the main application
To run the main program interactively:
```bash
docker run -it --rm drive-project
```

### 3. Run the Unit Tests
To run the tests separately (as required by the assignment):
```bash
docker run --rm drive-project ./run_tests
```




















compile:  g++ -std=c++17 src/main.cpp src/System.cpp src/services/*.cpp src/commands/*.cpp -o my_drive
run: ./my_drive

compile tests: g++ -std=c++17 tests/*.cpp src/services/*.cpp src/commands/*.cpp -o run_tests -lgtest -lgtest_main -pthread
run tests: ./run_tests