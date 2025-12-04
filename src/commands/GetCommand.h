#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include "Command.h"

class GetCommand : public Command {
private:
    // validate input arguments
    bool isValidInput(const std::vector<std::string>& args) const;
public:
    // Inherit the constructor from the Command class
    using Command::Command;
    void execute(const std::vector<std::string>& args) override;
};

#endif
