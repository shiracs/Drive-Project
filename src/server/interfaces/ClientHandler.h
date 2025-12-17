#ifndef CLIENTHANDLER_H
#define CLIENTHANDLER_H

#include <memory>
#include "Storage.h"
#include "Compressor.h"
#include "ThreadPool.h"

class ClientHandler {
    private:
        ThreadPool pool;
public:
    // Constructor that initializes the thread pool with 5 threads
    ClientHandler() : pool(5) {}
    // Handles a new client connection
    void handle(int clientSocket, std::shared_ptr<Storage> storage, std::shared_ptr<Compressor> compressor);
};

#endif