#include "GetCommand.h"
#include <iostream>

void GetCommand::execute(const std::vector<std::string>& args) {
    // Validation
    if (args.size() < 2) {
        io->output("400 Bad Request");
        return;
    }
    
    std::string fileName = args[1];

    if (fileName.find(' ') != std::string::npos) {
        io->output("400 Bad Request");
        return; 
    }

    try {
        std::string compressedContent = storage->readFile(fileName);
        std::string originalText = compressor->decompress(compressedContent);
        
        // CRITICAL FIX: Send everything in ONE string.
        // Protocol: "200 OK" + newline + empty line + content
        // SocketIOHandler adds the final newline automatically.
        std::string response = "200 OK\n\n" + originalText;
        
        io->output(response);

    } catch (...) {
        io->output("404 Not Found");
    }
}