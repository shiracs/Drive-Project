#ifndef SOCKETIOHANDLER_H
#define SOCKETIOHANDLER_H

#include "../interfaces/IOHandler.h"
#include <string>

class SocketIOHandler : public IOHandler {
private:
    int clientSocket;

public:
    SocketIOHandler(int socket);
    ~SocketIOHandler();
    
    // Reads input from the client (socket)
    std::string input() override;
    
    // Sends output to the client (socket)
    void output(const std::string& message) override;
};

#endif