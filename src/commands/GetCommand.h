#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include "Command.h"

class GetCommand : public Command {
public:
    // Inherit the constructor from the Command class
    using Command::Command;
    void execute(const std::vector<std::string>& args) override;
};

#endif
