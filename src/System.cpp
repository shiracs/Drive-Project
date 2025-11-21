#include "System.h"
#include <iostream>
#include <sstream>

#include "services/CliHandler.h"
#include "services/FileStorage.h"
#include "services/RleCompressor.h"
#include "commands/AddCommand.h"
#include "commands/GetCommand.h"
#include "commands/SearchCommand.h"

System::System(const std::string &storagePath) {
    // Initialize Services
    io = std::make_shared<CliHandler>();
    storage = std::make_shared<FileStorage>(storagePath);
    compressor = std::make_shared<RleCompressor>();

    // Register the Commands this system can execute
    commandMap["add"] = std::make_shared<AddCommand>(storage, compressor, io);
}

void System::run() {
    // The Application Loop
    while (true) {
        // Get line from io
        std::string inputLine = io->input();
        if (inputLine.empty()) continue;

        std::vector<std::string> args = parseInput(inputLine);
        if (args.empty()) continue;

        // Get the command name
        std::string commandName = args[0];

        // Check if command exists in our map
        if (commandMap.count(commandName)) {
            try {
                commandMap[commandName]->execute(args);
            } catch (...) {
                // Ignore errors for now
            }
        }
    }
}

// parseInput gets an inputline and returns it "split" to the different arguments of the command
std::vector<std::string> System::parseInput(const std::string &input) {
    // Turns string "[command] [file] [txt]" into a stream of words
    std::stringstream stream(input);
    std::string segment;
    std::vector<std::string> args;

    // Split the sentence into array of words
    while (std::getline(stream, segment, ' ')) {
        if (!segment.empty()) {
            args.push_back(segment);
        }
    }
    return args;
}