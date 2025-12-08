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
There are 2 clients: cpp client, and python client.
#### 3.1 to run the cpp-client: 
```bash
docker-compose run --rm client
```
#### 3.2 or, you can run the python-client: 
```bash
docker-compose run --rm client-python
```
You can now type commands like post, get, search, etc.
To exit the client, type exit or press Ctrl+C.

### 5. Run the Unit Tests
To run the automated test suite (Google Test) in an isolated container:
```bash
docker-compose run --rm tests
```

### 6. Stop and Clean Up
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

in the image we can see the server in the right terminal, and the two in the left are the cpp-client and the python-client, which are both being served simultaniousely
![Execution Demo](execution_demo.png)

## Design & Architecture (Reflection)

In this project, we tried to follow the SOLID principles to make sure future changes would be easy.
Here is how our design handled the changes from Ex1 (CLI) to Ex2 (Client-Server):

### 1. Changing Command Names ('add' -> 'post')
**Did we have to touch code that should be closed?**
No.
In `System.cpp`, we map strings to command objects.
so we simply changed the key string in the map from "add" to "post". The main loop that runs the commands didn't need to change at all because it just looks up whatever string it receives.

### 2. Adding New Commands ('delete')
**Did we have to touch code that should be closed?**
No.
The system treats all commands the same way (using the `Command` interface).
so we just created a new class `DeleteCommand` and added one line to register it in the map. The main logic of the system didn't change because it knows how to run any command that inherits from the base class.

### 3. Changing Output Format
**Did we have to touch code that should be closed?**
No.
The `System` class doesn't care what the output text is, it just passes it to the user.
so we only had to open the specific command file (like `AddCommand.cpp`) and change the string it sends back (e.g., to "201 Created"). The rest of the server code remained exactly the same.

### 4. Switching Input/Output (CLI -> Socket)
**Did we have to touch code that should be closed?**
No.
The `System` class doesn't communicate directly with `cin` or `cout`. Instead, it uses a generic `IOHandler` interface.
In Ex1, we gave the system a `CliHandler`. In Ex2, we gave it a `SocketIOHandler` instead. Since both implement the same functions (`input` and `output`), the core logic of the system didn't notice the difference and didn't need any changes.