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
    ClientHandler clientHandler;

    // set up the TCP server socket
    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket == -1) return 1;

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) < 0) return 1;
    if (listen(serverSocket, 5) < 0) return 1;

    std::cout << "Server listening on port " << port << "..." << std::endl;

    while (true) {
        sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);
        int clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientLen);

        if (clientSocket < 0) continue;

        clientHandler.handle(clientSocket, sharedStorage, sharedCompressor);
    }

    close(serverSocket);
    return 0;
}