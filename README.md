# Drive-Project (Client-Server Architecture)
Message to the Checker:
 - all the code from the second excercise is in the ex3 branch:
```bash
 git checkout ex3
 ```

## How to Run (with Docker Compose)
We use Docker Compose to manage the multi-container setup. This ensures the Web Server and the C++ Server run as separate processes but can communicate over a virtual bridge network.

from the root directory (/Drive-Project), run:

### 1. Build and Start the System
This command builds the images and runs everything.
```bash
docker-compose up --build
```

### 2. Access the App
The App is exposed on `http://localhost:3000`. 


### 3. Run the Unit Tests
To run the automated test suite (Google Test) in an isolated container:
```bash
docker-compose run --rm tests
```

### 4. Stop and Clean Up
To stop the server and remove the containers:
```bash
docker-compose down
```

