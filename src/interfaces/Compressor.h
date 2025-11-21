#ifndef COMPRESSOR_H
#define COMPRESSOR_H

#include <string>

class Compressor {
public:
    virtual ~Compressor() = default;
    virtual std::string compress(const std::string& text) = 0;
    virtual std::string decompress(const std::string& text) = 0;
};

#endif