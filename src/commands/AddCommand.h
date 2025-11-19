#ifndef ADDCOMMAND_H
#define ADDCOMMAND_H
#include "Command.h"

class AddCommand : public Command {
public:
    using Command::Command; 

    void execute(const std::vector<std::string>& args) override {
        // args: add [filename] [content]
        if (args.size() < 3) return; 

        try {
            std::string fileName = args[1];
            std::string content = args[2];
            
            std::string compressedData = compressor->compress(content);
            storage->saveFile(fileName, compressedData);
        } catch (...) {
            // Silent failure as requested
        }
    }
};
#endif