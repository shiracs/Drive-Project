#include "RleCompressor.h"
#include <string>

std::string RleCompressor::compress(const std::string& text) {
    if (text.empty()) return "";
    
    std::string result = "";
    int count = 1;
    
    for (size_t i = 0; i < text.length(); ++i) {
        if (i + 1 < text.length() && text[i] == text[i + 1]) {
            count++;
        } else {
            result += text[i];
            result += std::to_string(count);
            count = 1;
        }
    }
    return result;
}

std::string RleCompressor::decompress(const std::string& text) {
    std::string result = "";
    for (size_t i = 0; i < text.length(); ++i) {
        char character = text[i];
        i++; // move past the character to the number
        
        std::string numberStr = "";
        while (i < text.length() && isdigit(text[i])) {
            numberStr += text[i];
            i++;
        }
        i--; // step back one position
        
        int count = numberStr.empty() ? 0 : std::stoi(numberStr);
        result.append(count, character);
    }
    return result;
}