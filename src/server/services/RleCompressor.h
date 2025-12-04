#ifndef RLECOMPRESSOR_H
#define RLECOMPRESSOR_H

#include "../interfaces/Compressor.h"

class RleCompressor : public Compressor {
public:
    std::string compress(const std::string& text) override;
    std::string decompress(const std::string& text) override;
};

#endif