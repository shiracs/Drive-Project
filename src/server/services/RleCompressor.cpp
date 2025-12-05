#include "../interfaces/RleCompressor.h"
#include <string>

/*
 RLE Compression logic:
 Goes through the string and counts how many times a character repeats.
 When the streak ends, it saves the character, the count number, and a '#' delimiter (so we can support numbers in the text).
 Example: "aaabb" -> "a3#b2#"
*/

std::string RleCompressor::compress(const std::string& text) {
    if (text.empty()) return "";
    
    std::string result = "";
    int count = 1;
    
    for (size_t i = 0; i < text.length(); ++i) {
        // Look ahead: if the next char is the same as this char, increment count.
        if (i + 1 < text.length() && text[i] == text[i + 1]) {
            count++; 
        } else {
            // The streak ended. Write it down.
            result += text[i];
            result += std::to_string(count); 
            // Add delimiter - this will act as the seperator between pairs of [char][count] in the compressed file
            result += '#'; 
            count = 1;
        }
    }
    return result;
}

std::string RleCompressor::decompress(const std::string& text) {
    std::string result = "";
    size_t i = 0;
    
    while (i < text.length()) {
        // Get the character we want to repeat
        char character = text[i];
        i++; 
        
        // Read the count until we hit the delimiter '#'
        std::string numberStr = "";
        while (i < text.length() && text[i] != '#') {
            numberStr += text[i];
            i++;
        }
        
        // Convert count string to integer. if string is empty for some reason, default to 0
        int count = numberStr.empty() ? 0 : std::stoi(numberStr);
        
        // Append the character 'count' times
        result.append(count, character);
        
        // Skip the delimiter '#' to get to the next pair
        i++; 
    }
    return result;
}