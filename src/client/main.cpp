#include <iostream>
#include <string>
#include <cstring>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h> 

// Helper function to read exactly one line from the socket
// This prevents reading "too much" or "too little" data
std::string readLine(int sock) {
    std::string line = "";
    char c;
    while (true) {
        ssize_t bytesRead = recv(sock, &c, 1, 0);
        if (bytesRead <= 0) {
            throw std::runtime_error("Server disconnected");
        }
        if (c == '\n') {
            break;
        }
        line += c;
    }
    // Remove '\r' if server sent CRLF
    if (!line.empty() && line.back() == '\r') {
        line.pop_back();
    }
    return line;
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cout << "Usage: client_app <ip/hostname> <port>" << std::endl;
        return 1;
    }

    std::string host = argv[1];
    int port = std::atoi(argv[2]);

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        std::cerr << "Socket creation error" << std::endl;
        return 1;
    }

    sockaddr_in serv_addr;
    std::memset(&serv_addr, 0, sizeof(serv_addr)); 
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(port);

    // Resolve hostname
    struct hostent* server = gethostbyname(host.c_str());
    if (server == NULL) {
        std::cerr << "Error: No such host: " << host << std::endl;
        return 1;
    }

    std::memcpy(&serv_addr.sin_addr.s_addr, server->h_addr, server->h_length);

    if (connect(sock, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
        std::cerr << "Connection Failed" << std::endl;
        return 1;
    }

    // --- Main Client Loop ---
    while (true) {
        std::string command;
        if (!std::getline(std::cin, command)) break; // EOF

        // Send command to server
        command += "\n";
        send(sock, command.c_str(), command.size(), 0);

        try {
            // 1. Always read the first line (Status Code)
            std::string statusLine = readLine(sock);
            std::cout << statusLine << std::endl;

            // 2. Check if we need to read more lines
            // According to protocol, "200 OK" is followed by an empty line and then content.
            // All other codes (201, 404, 400) are single-line.
            if (statusLine == "200 OK") {
                // Read the empty line
                std::string emptyLine = readLine(sock);
                std::cout << emptyLine << std::endl; // Should be empty

                // Read the content line
                std::string contentLine = readLine(sock);
                std::cout << contentLine << std::endl;
            }

        } catch (const std::runtime_error& e) {
            break; // Exit loop if server disconnects
        }
    }

    close(sock);
    return 0;
}