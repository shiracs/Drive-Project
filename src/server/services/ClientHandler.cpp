#include "../interfaces/ClientHandler.h"
#include <thread>
#include <iostream>

// Include necessary implementations
#include "../interfaces/System.h"
#include "../interfaces/SocketIOHandler.h"

void ClientHandler::handle(int clientSocket, std::shared_ptr<Storage> storage, std::shared_ptr<Compressor> compressor) {

    // create thread to handle the client
    std::thread t([clientSocket, storage, compressor]() {
        try {
            auto io = std::make_shared<SocketIOHandler>(clientSocket);
            System app(io, storage, compressor);
            app.run();
        } catch (...) {
        }
    });

    // detach the thread so it runs independently
    t.detach();
}