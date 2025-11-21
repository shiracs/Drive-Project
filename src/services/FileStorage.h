#ifndef FILESTORAGE_H
#define FILESTORAGE_H

#include "../interfaces/Storage.h"
#include <filesystem>

class FileStorage : public Storage {
private:
    std::filesystem::path directoryPath;
public:
    FileStorage(const std::string& path);
    void saveFile(const std::string& fileName, const std::string& content) override;
    std::string readFile(const std::string& fileName) override;
    std::vector<std::string> listAllFiles() override;
};

#endif