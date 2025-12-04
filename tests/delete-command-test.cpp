//test the commend DELETE [file name] 
#include <gtest/gtest.h>
#include <iostream>
#include <cstdio>
#include <fstream>
#include <memory>
#include <vector>
#include <filesystem>
#include <algorithm> 

// Your project files
#include "../src/server/commands/DeleteCommand.h" 
#include "../src/server/services/FileStorage.h"
#include "../src/server/services/RleCompressor.h"
#include "../src/server/interfaces/IOHandler.h"

namespace fs = std::filesystem;

/* Capturing IO for tests
This class SAVES the output (server response) so we can check it in our tests */
class DeleteCaptureIO : public IOHandler {
public:
    // Variable to store the last output message - initialized for test verification
    std::string lastOutput = ""; 

    // We don't need input for this test
    std::string input() override { return ""; } 
    
    // Override output to capture the message instead of printing it
    void output(const std::string& message) override {
        lastOutput = message;
    }

    void clear() {
        lastOutput = "";
    }
};

// Fixture for DeleteCommand tests - handle common setup/teardown
class DeleteCommandTest : public ::testing::Test {
protected:
    std::shared_ptr<FileStorage> storage;
    std::shared_ptr<RleCompressor> compressor;
    std::shared_ptr<DeleteCaptureIO> io;
    std::shared_ptr<DeleteCommand> deleteCmd;

    // opening a test directory for isolated file operations
    const std::string testDir = "./delete_test_env"; 

    void SetUp() override {
        // Setup the isolated environment
        if (fs::exists(testDir)) fs::remove_all(testDir);
        fs::create_directories(testDir);
        
        // Initialize services and command
        storage = std::make_shared<FileStorage>(testDir);
        compressor = std::make_shared<RleCompressor>();
        io = std::make_shared<DeleteCaptureIO>();
        
        deleteCmd = std::make_shared<DeleteCommand>(storage, compressor, io);
    }
    
    // Cleanup the environment
    void TearDown() override {
        if (fs::exists(testDir)) fs::remove_all(testDir);
    }

    // creates a file directly on disk, bypassing the AddCommand logic.
    void createFileForTest(const std::string& filename, const std::string& content) {
        fs::path filePath = fs::path(testDir) / filename;
        std::ofstream outfile(filePath);
        outfile << content;    
        outfile.close();
    }

    // execute the DELETE command and return the status code
    std::string runDelete(const std::string& filename) {
        io->clear();
        deleteCmd->execute({"DELETE", filename});
        return io->lastOutput;
    }
    
    // Helper function to check if a file exists in the test directory
    bool fileExists(const std::string& filename) {
        fs::path filePath = fs::path(testDir) / filename;
        return fs::exists(filePath);
    }
};

// THE TESTS

// Create file manually, Delete file, check status code - should be 204 No Content, the file has been removed from disk
TEST_F(DeleteCommandTest, BasicSuccessfulDeletion) {
    std::string filename = "file_to_delete.txt";
    std::string content = "S5#";
    
    // Create a file manually
    createFileForTest(filename, content);
    ASSERT_TRUE(fileExists(filename)) << "Could not create file for test setup.";

    // Delete the file - use the command and capture output
    std::string actual_output = runDelete(filename);
    
    // Assert:
    // chcek the expected status code
    std::string expected_output = "204 No Content";
    EXPECT_EQ(expected_output, actual_output) 
        << "DELETE command should return '204 No Content' on success.";
        
    // verify the file is actually deleted from disk
    EXPECT_FALSE(fileExists(filename)) 
        << "The file should be deleted from the disk after successful command.";
}

// Attempt to delete a file that does not exist
TEST_F(DeleteCommandTest, DeletingNonExistentFile) {
    std::string filename = "non_existent_file.txt";
    
    // make sure the file does not exist before the test
    ASSERT_FALSE(fileExists(filename)) << "File should not exist before test.";

    // Attempt to delete the non-existent file 
    std::string actual_output = runDelete(filename);

    // Assert
    // check the expected status code
    std::string expected_output = "404 Not Found"; 
    EXPECT_EQ(expected_output, actual_output)
        << "DELETE command should return '404 Not Found' for a non-existent file.";
}
