#include "AddCommand.h"

void AddCommand::execute(const std::vector<std::string>& args) {
    // Check that we have all the needed args - otherwise, ignore command
    if (args.size() < 3) return; 

    try {
        std::string fileName = args[1];
        std::string content = args[2];

        // Compress the content
        std::string compressedData = compressor->compress(content);
        // Save it as fileName
        storage->saveFile(fileName, compressedData);
    } catch (...) {
        // Silent failure
    }
}