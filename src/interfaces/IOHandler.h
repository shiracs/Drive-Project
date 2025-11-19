#ifndef IOHANDLER_H
#define IOHANDLER_H

#include <string>

class IOHandler {
public:
    virtual ~IOHandler() = default;
    virtual std::string input() = 0;
    virtual void output(const std::string& message) = 0;
};

#endif