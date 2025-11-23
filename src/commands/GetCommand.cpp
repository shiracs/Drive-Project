#include "GetCommand.h"

void GetCommand::execute(const std::vector<std::string>& args) {
    if (args.size() < 2) return;
    
    std::string fileName = args[1];

    // invalid filename - no spaces allowed
    if (fileName.find(' ') != std::string::npos) return; 

    try {
        // Load the compressed data of [fileName] from the storage
        std::string compressedContent = storage->readFile(fileName);
        // Decompress it
        std::string originalText = compressor->decompress(compressedContent);
        // Print it to the io
        io->output(originalText);
    } catch (...) {}
}