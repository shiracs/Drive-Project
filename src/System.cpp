#include "System.h"
#include <iostream>
#include <sstream>

// Include the concrete implementations
#include "services/CliHandler.h"
#include "services/FileStorage.h"
#include "services/RleCompressor.h"

// Include the commands
#include "commands/AddCommand.h"
#include "commands/GetCommand.h"
#include "commands/SearchCommand.h"

System::System(const std::string& storagePath) {
    // 1. Initialize Services
    // This is the only place that knows about "Concrete" classes
    io = std::make_shared<CliHandler>();
    storage = std::make_shared<FileStorage>(storagePath);
    compressor = std::make_shared<RleCompressor>();

    // 2. Register Commands
    commandMap["add"] = std::make_shared<AddCommand>(storage, compressor, io);
    commandMap["get"] = std::make_shared<GetCommand>(storage, compressor, io);
    commandMap["search"] = std::make_shared<SearchCommand>(storage, compressor, io);
}

void System::run() {
    // The Application Loop
    while (true) {
        std::string inputLine = io->input();
        if (inputLine.empty()) continue;

        std::vector<std::string> args = parseInput(inputLine);
        if (args.empty()) continue;

        std::string commandName = args[0];

        if (commandMap.count(commandName)) {
            try {
                commandMap[commandName]->execute(args);
            } catch (...) {
                // Global error handler (silent)
            }
        }
    }
}

std::vector<std::string> System::parseInput(const std::string& input) {
    std::stringstream stream(input);
    std::string segment;
    std::vector<std::string> args;
    
    while (std::getline(stream, segment, ' ')) {
        if (!segment.empty()) args.push_back(segment);
    }
    return args;
}