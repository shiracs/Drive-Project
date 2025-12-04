#include <iostream>
#include <thread>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>
#include <memory>

// Include logic components
#include "System.h"
#include "services/SocketIOHandler.h"
#include "services/FileStorage.h"
#include "services/RleCompressor.h"

// Function to handle individual client connection on a separate thread
void handleClient(int clientSocket, std::shared_ptr<Storage> storage, std::shared_ptr<Compressor> compressor) {
    // Create socket-based IO handler
    auto io = std::make_shared<SocketIOHandler>(clientSocket);
    
    // Initialize System with shared storage/compressor but unique IO
    System app(io, storage, compressor);
    
    // Run the main application loop
    app.run();
}

int main(int argc, char* argv[]) {
    // Check arguments
    if (argc < 2) {
        std::cerr << "Usage: server_app <port>" << std::endl;
        return 1;
    }
    
    int port = std::atoi(argv[1]);
    
    // 1. Check the environment variable for storage path. default is "./my_storage"
    const char* envVar = std::getenv("STORAGE_PATH");
    std::string path = envVar ? envVar : "./my_storage";
    
    // Create shared resources (Thread-Safe Storage and Compressor)
    auto sharedStorage = std::make_shared<FileStorage>(path);
    auto sharedCompressor = std::make_shared<RleCompressor>();

    // Setup TCP Server Socket
    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket == -1) {
        perror("Socket creation failed");
        return 1;
    }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) < 0) {
        perror("Bind failed");
        return 1;
    }

    if (listen(serverSocket, 5) < 0) {
        perror("Listen failed");
        return 1;
    }

    std::cout << "Server listening on port " << port << "..." << std::endl;

    // Accept loop
    while (true) {
        sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);
        int clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientLen);

        if (clientSocket < 0) {
            perror("Accept failed");
            continue;
        }

        // Spawn a new thread for the connected client
        std::thread clientThread(handleClient, clientSocket, sharedStorage, sharedCompressor);
        clientThread.detach(); // Detach to allow independent execution
    }

    close(serverSocket);
    return 0;
}