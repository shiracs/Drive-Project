#include "../interfaces/SocketIOHandler.h"
#include <unistd.h>
#include <sys/socket.h>
#include <iostream>

SocketIOHandler::SocketIOHandler(int socket) : clientSocket(socket) {}

SocketIOHandler::~SocketIOHandler() {
    close(clientSocket);
}

// Reads input from the client through the socket
std::string SocketIOHandler::input() {
    std::string message = "";
    char c;
    // Read byte by byte until newline
    while (true) {
        ssize_t bytesRead = recv(clientSocket, &c, 1, 0);
        if (bytesRead <= 0) {
            // Connection closed or error
            return ""; 
        }
        if (c == '\n') {
            break;
        }
        message += c;
    }
    // Handle CRLF (remove carriage return if present)
    if (!message.empty() && message.back() == '\r') {
        message.pop_back();
    }
    return message;
}

// Sends output to the client through the socket
void SocketIOHandler::output(const std::string& message) {
    // Append newline as required by the protocol
    std::string response = message + "\n";
    send(clientSocket, response.c_str(), response.size(), 0);
}