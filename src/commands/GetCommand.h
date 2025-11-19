#ifndef GETCOMMAND_H
#define GETCOMMAND_H
#include "Command.h"

class GetCommand : public Command {
public:
    using Command::Command;

    void execute(const std::vector<std::string>& args) override {
        if (args.size() < 2) return;
        
        try {
            std::string fileName = args[1];
            std::string compressedContent = storage->readFile(fileName);
            std::string originalText = compressor->decompress(compressedContent);
            io->output(originalText);
        } catch (...) {}
    }
};
#endif