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
    std::shared_ptr<Storage> storage;
    std::shared_ptr<Compressor> compressor;
    std::shared_ptr<IOHandler> io;
public:
    Command(std::shared_ptr<Storage> s, std::shared_ptr<Compressor> c, std::shared_ptr<IOHandler> i) 
        : storage(s), compressor(c), io(i) {}
    
    virtual ~Command() = default;
    virtual void execute(const std::vector<std::string>& args) = 0;
};

#endif