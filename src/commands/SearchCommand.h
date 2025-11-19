#ifndef SEARCHCOMMAND_H
#define SEARCHCOMMAND_H
#include "Command.h"

class SearchCommand : public Command {
public:
    using Command::Command;

    void execute(const std::vector<std::string>& args) override {
        if (args.size() < 2) return;
        std::string query = args[1];

        try {
            auto allFiles = storage->listAllFiles();
            for (const auto& fileName : allFiles) {
                std::string compressed = storage->readFile(fileName);
                std::string decompressed = compressor->decompress(compressed);
                
                if (decompressed.find(query) != std::string::npos) {
                    io->output(fileName);
                }
            }
        } catch (...) { }
    }
};
#endif