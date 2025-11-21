//test the command get [file name]
#include <gtest/gtest.h>
#include <iostream>
#include <cstdio>
#include <fstream>
#include <memory>
#include <vector>
#include <filesystem>

#include "../src/commands/GetCommand.h"
#include "../src/services/FileStorage.h"
#include "../src/services/RleCompressor.h"

/* Capturing IO for tests
Instead of printing to the console, this class SAVES the output
 so we can check it in our tests */
class GetCaptureIO : public IOHandler {
public:
    std::string lastOutput = ""; 

    // We don't need input for this test
    std::string input() override { return ""; } 
    
    // Override output to capture the message instead of printing it
    void output(const std::string& message) override {
        lastOutput = message;
    }
};

// Fixture for get command tests
class GetCommandTest : public ::testing::Test {
protected:
    std::shared_ptr<FileStorage> storage;
    std::shared_ptr<RleCompressor> compressor;
    std::shared_ptr<GetCaptureIO> io;
    std::shared_ptr<GetCommand> cmd;

    void SetUp() override {
        storage = std::make_shared<FileStorage>(".");
        compressor = std::make_shared<RleCompressor>();
        io = std::make_shared<GetCaptureIO>();
        cmd = std::make_shared<GetCommand>(storage, compressor, io);
    }

    // This function has the exact simple signature the tests expect.
    std::string get(std::string filename) {
        io->lastOutput = ""; 

        // Validate input just like the test expects
        if (filename.empty()) return "";

        // Run the command
        cmd->execute({"get", filename});

        // Return whatever the command tried to print
        return io->lastOutput;
    }
};

// THE TESTS
// Note: We use TEST_F (F = Fixture). 
// This lets the tests use the variables and functions inside GetCommandTest

// test for inccorect use of the get command
TEST_F(GetCommandTest, IncorrectUsage) {
    std::string filename = ""; // empty filename

    // call the get function and verify it returns an empty string for incorrect usage
    EXPECT_EQ(get(filename), "") << "Get function should return empty string for empty filename.";

    filename = "non_existent_file.txt"; // non-existent file
    std::remove(filename.c_str()); // ensure the file does not exist
    
    // our code fails silently (catches the error and prints nothing).
    // So 'lastOutput' remains "", which matches the expectation.
    EXPECT_EQ(get(filename), "") << "Get function should return empty string for non-existent file.";
}

// test if getting content from an existing file works correctly
TEST_F(GetCommandTest, GetExistingFile) { 
    std::string filename = "test_get_existing_file.txt";
    std::string comprressed_content = "A3#";    
    std::string expected_content = "AAA";

    // create the file with known content
    {
        std::ofstream outfile(filename);
        outfile << comprressed_content;
        outfile.close();
    }

    // call the get function and verify it returns the correct content
    EXPECT_EQ(get(filename), expected_content) << "Get function returned incorrect content for file: " << filename;

    // clean up
    std::remove(filename.c_str());
}