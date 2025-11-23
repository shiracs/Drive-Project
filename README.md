# Drive-Project

## How to Run
from the root directory (/Drive-Project), run the following commands:

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
