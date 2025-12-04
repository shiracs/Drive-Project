#include "GetCommand.h"

void GetCommand::execute(const std::vector<std::string>& args) {
    // Validate input arguments
    if (!isValidInput(args)) {
        io->output("400 Bad Request");
        return;
    }

    std::string fileName = args[1];

    try {
        // Load the compressed data of [fileName] from the storage
        std::string compressedContent = storage->readFile(fileName);
        // Decompress it
        std::string originalText = compressor->decompress(compressedContent);
        // Send OK response
        io->output("200 OK\n\n");
        // Print it to the io
        io->output(originalText);
    } catch (...) {}
}

bool GetCommand::isValidInput(const std::vector<std::string>& args) const {
    // Basic validation: must have at least 2 arguments: "get" and filename
    if (args.size() < 2) return false;

    // Check for spaces in filename
    std::string filename = args[1];
    if (filename.find(' ') != std::string::npos) return false;

    // Filename should not be empty
    if (filename.empty()) return false;

    // Check if file exists in storage
    if (!storage->fileExists(filename)) return false;

    return true;
}