#ifndef COMMAND_H
#define COMMAND_H

#include <vector>
#include <string>
#include <memory>
#include "../interfaces/Storage.h"
#include "../interfaces/Compressor.h"
#include "../interfaces/IOHandler.h"

class Command {
protected:
    // The commands in this project need access to a storage obj, a compressor obj and an io obj.
    std::shared_ptr<Storage> storage;
    std::shared_ptr<Compressor> compressor;
    std::shared_ptr<IOHandler> io;
        // Verify that the inpute is valid
    virtual bool isValidInputStructure(const std::vector<std::string>& args) const = 0;
    virtual bool isValidInputLogic(const std::vector<std::string>& args) const {
        return true; 
    }
public:
    Command(std::shared_ptr<Storage> s, std::shared_ptr<Compressor> c, std::shared_ptr<IOHandler> i) 
        : storage(s), compressor(c), io(i) {}
    
    virtual ~Command() = default;
    virtual void execute(const std::vector<std::string>& args) = 0;
};

#endif