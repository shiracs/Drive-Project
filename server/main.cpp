#include <iostream>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>
#include <memory>

#include "interfaces/FileStorage.h"
#include "interfaces/RleCompressor.h"
#include "interfaces/ClientHandler.h" 

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << "Usage: server_app <port>" << std::endl;
        return 1;
    }
    
    int port = std::atoi(argv[1]);
    
    // create the shared Storage and Compressor instances
    auto sharedStorage = std::make_shared<FileStorage>("./my_storage");
    auto sharedCompressor = std::make_shared<RleCompressor>();
    
    // create the ClientHandler instance
    const char* poolSizeEnv = std::getenv("THREAD_POOL_SIZE");
    int poolSize = (poolSizeEnv != nullptr) ? std::atoi(poolSizeEnv) : 4; 
    ClientHandler clientHandler(poolSize);

    // set up the TCP server socket
    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket == -1) return 1;

    // We create a struct 'serverAddr' to hold the address configuration.
    // AF_INET: Use IPv4 protocol.
    // INADDR_ANY: Accept connections from ANY IP address
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    // bind the socket to the specified port and address and start listening
    if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) < 0) return 1;
    if (listen(serverSocket, 5) < 0) return 1;

    while (true) {
        sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);
        int clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientLen);

        if (clientSocket < 0) continue;

        // handle the client in a separate thread
        clientHandler.handle(clientSocket, sharedStorage, sharedCompressor);
    }

    close(serverSocket);
    return 0;
}