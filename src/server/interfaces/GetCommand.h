#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include "Command.h"

class GetCommand : public Command {

private:
// Validates the input arguments for the GetCommand
    bool isValidInputStructure(const std::vector<std::string>& args) const;
    bool isValidInputLogic(const std::vector<std::string>& args) const;
public:
    // Inherit the constructor from the Command class
    using Command::Command;
    void execute(const std::vector<std::string>& args) override;
};

#endif
