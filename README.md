# Drive-Project (Client-Server Architecture)

## How to Run (with Docker Compose)

The easiest way to run the project is using **Docker Compose**, which handles the network, storage volumes, and dependencies automatically.

from the root directory (/Drive-Project), run the following commands:


### 1. Build the images
First, build the Docker images for the Server, Client, and Tests.
```bash
docker-compose build
```

### 2. Run the Server
Start the server in the background (detached mode). It will listen on port 8080.
```bash
docker-compose up -d server
```

### 3. Run the Client
Launch the client interactive shell. It will automatically connect to the server.
```bash
docker-compose run --rm client
```
You can now type commands like post, get, search, etc.
To exit the client, type exit or press Ctrl+C.

### 4. Run the Unit Tests
To run the automated test suite (Google Test) in an isolated container:
```bash
docker-compose run --rm tests
```

### 5. Stop and Clean Up
To stop the server and remove the containers:
```bash
docker-compose down
```

## Execution Example
Supported commands:
post <filename> <content> : Save a compressed file.
get <filename> : Retrieve and decompress a file.
search <text> : Search for text inside files.
delete <filename> : Delete a file.

![Execution Demo](execution_demo.png)