#ifndef CLIENTHANDLER_H
#define CLIENTHANDLER_H

#include <memory>
#include "Storage.h"
#include "Compressor.h"

class ClientHandler {
public:
    // Handles a new client connection
    void handle(int clientSocket, std::shared_ptr<Storage> storage, std::shared_ptr<Compressor> compressor);
};

#endif