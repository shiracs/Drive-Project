#ifndef SYSTEM_H
#define SYSTEM_H

#include <memory>
#include <map>
#include <string>
#include <vector>

class IOHandler;
class Storage;
class Compressor;
class Command;

class System {
private:
    // The system needs these services: IOHandler object, Storage object, Compressor object
    std::shared_ptr<IOHandler> io;
    std::shared_ptr<Storage> storage;
    std::shared_ptr<Compressor> compressor;

    // The system has a map of commands it can execute
    std::map<std::string, std::shared_ptr<Command>> commandMap;

    // Helper to parse the input
    std::vector<std::string> parseInput(const std::string& input);

    // Helper to convert string to lower case
    std::string toLower(const std::string& str);

public:
    System(const std::string& storagePath);

    // Constructor for Tests
    // This allows us to inject a "fake keyboard" (Mock IO) for the tests
    System(std::shared_ptr<IOHandler> io, std::shared_ptr<Storage> storage, std::shared_ptr<Compressor> compressor); 
    
    void run();
};

#endif