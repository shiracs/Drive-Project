#include <thread>
#include <iostream>
#include "../interfaces/ClientHandler.h"
#include "../interfaces/System.h"
#include "../interfaces/SocketIOHandler.h"

void ClientHandler::handle(int clientSocket, std::shared_ptr<Storage> storage, std::shared_ptr<Compressor> compressor) {

    // create thread to handle the client
    pool.addTask([clientSocket, storage, compressor]() {
        try {
            auto io = std::make_shared<SocketIOHandler>(clientSocket);
            // Create and run the system for this client
            // Each client gets its own System instance, that uses the shared Storage and Compressor instances.
            System app(io, storage, compressor);
            app.run();
        } catch (...) {
        }
    });
}