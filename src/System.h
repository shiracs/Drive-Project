#ifndef SYSTEM_H
#define SYSTEM_H

#include <memory>
#include <map>
#include <string>
#include <vector>

// Forward declarations to keep compile time low
class IOHandler;
class Storage;
class Compressor;
class Command;

class System {
private:
    // The services
    std::shared_ptr<IOHandler> io;
    std::shared_ptr<Storage> storage;
    std::shared_ptr<Compressor> compressor;

    // The command registry
    std::map<std::string, std::shared_ptr<Command>> commandMap;

    // Helper to parse input
    std::vector<std::string> parseInput(const std::string& input);

public:
    System(const std::string& storagePath);
    void run();
};

#endif