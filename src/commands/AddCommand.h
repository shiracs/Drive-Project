#ifndef ADDCOMMAND_H
#define ADDCOMMAND_H

#include "Command.h"

class AddCommand : public Command {
public:
    // Inherit the constructor from the Command class
    using Command::Command; 
    void execute(const std::vector<std::string>& args) override;
};

#endif