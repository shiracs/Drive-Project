#ifndef STORAGE_H
#define STORAGE_H

#include <string>
#include <vector>

class Storage {
public:
    virtual ~Storage() = default;
    virtual void saveFile(const std::string& fileName, const std::string& content) = 0;
    virtual std::string readFile(const std::string& fileName) = 0;
    virtual std::vector<std::string> listAllFiles() = 0;
};

#endif