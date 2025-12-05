#include <iostream>
#include <string>
#include <cstring>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>
#include <memory> 
#include "CliHandler.h"

// helper function to read a line from the socket
std::string readSocketLine(int sock) {
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
    std::unique_ptr<IOHandler> ui = std::make_unique<CliHandler>();
    std::string host = argv[1];
    int port = std::atoi(argv[2]);

    // create socket connection
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        ui->output("Error: Socket creation error");
        return 1;
    }

    sockaddr_in serv_addr;
    std::memset(&serv_addr, 0, sizeof(serv_addr)); 
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(port);

    struct hostent* server = gethostbyname(host.c_str());
    if (server == NULL) {
        ui->output("Error: No such host: " + host);
        return 1;
    }

    std::memcpy(&serv_addr.sin_addr.s_addr, server->h_addr, server->h_length);

    if (connect(sock, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
        ui->output("Error: Connection Failed");
        return 1;
    }

    while (true) {
        std::string command = ui->input();
        
        if (command.empty() && std::cin.eof()) break; 

        command += "\n";
        send(sock, command.c_str(), command.size(), 0);

        try {
            // Read response
            std::string statusLine = readSocketLine(sock);
            
            // output the response
            ui->output(statusLine);

            if (statusLine == "200 OK") {
                std::string emptyLine = readSocketLine(sock);
                ui->output(emptyLine);

                std::string contentLine = readSocketLine(sock);
                ui->output(contentLine);
            }

        } catch (const std::runtime_error& e) {
            break; 
        }
    }

    close(sock);
    return 0;
}