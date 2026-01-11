#include "../interfaces/GetCommand.h"
#include <iostream>

void GetCommand::execute(const std::vector<std::string>& args) {
    // Validation
    if (!isValidInputStructure(args)) {
        io->output("400 Bad Request");
        return;
    }
    if (!isValidInputLogic(args)) {
        io->output("404 Not Found");
        return;
    }
    std::string fileName = args[1];

    try {
        std::string compressedContent = storage->readFile(fileName);
        std::string originalText = compressor->decompress(compressedContent);
        
        // send: "200 Ok" + newline + empty line + content
        // SocketIOHandler adds the final newline automatically.
        std::string response = "200 Ok\n\n" + originalText;
        
        io->output(response);

    } catch (const std::exception& e) {
        std::cerr << "GetCommand Error: " << e.what() << std::endl;
        io->output("500 Internal Server Error");
    } catch (...) {
        std::cerr << "GetCommand Unknown Error" << std::endl;
        io->output("500 Internal Server Error");
    }
}

// Validates the input arguments for the GetCommand
bool GetCommand::isValidInputStructure(const std::vector<std::string>& args) const {
    // Basic validation: must have at least 2 arguments: "get" and filename
    if (args.size() < 2) return false;

    // Check for spaces in filename
    std::string filename = args[1];
    if (filename.find(' ') != std::string::npos) return false;

    // Filename should not be empty
    if (filename.empty()) return false;

    return true;
}

bool GetCommand::isValidInputLogic(const std::vector<std::string>& args) const {
    std::string filename = args[1];

    // Check if the file exists in storage
    if (!storage->fileExists(filename)) {
        return false;
    }

    return true;
}