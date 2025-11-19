//test the commend add [file name] [text] 
#include <gtest/gtest.h>
#include "../interfaces/add-command.h"
#include <iostream>
#include <cstdio>
#include <fstream>

// test for inccorect use of the add command
TEST(AddCommandTest, IncorrectUsage) {
    std::string filename = ""; // empty filename
    std::string text = "A";

    // call the add function and verify it returns false for incorrect usage
    ASSERT_FALSE(add(filename, text)) << "Add function should fail for empty filename.";

    filename = "valid_file.txt";
    text = ""; // empty text
    ASSERT_FALSE(add(filename, text)) << "Add function should fail for empty text.";
}

// test if the file is created when it does not exist
TEST(AddCommandTest, AddCreatesFile) {

    // ensure the file does not exist before the test
    std::remove("test_file_creation_only.txt"); 

    std::string filename = "test_file_creation_only.txt";
    std::string text = "A";

    // call the add function and verify it returns true for successful creation
    ASSERT_TRUE(add(filename, text)) << "Add function failed to create file: " << filename;

    // verify the file was created
    std::ifstream infile(filename);
    ASSERT_TRUE(infile.is_open()) << "File was not created: " << filename;

    infile.close();

    // clean up
    std::remove(filename.c_str());
}

// test if already existing file with this name do not add anther file with the same name
TEST(AddCommandTest, AddExistingFile) {
    std::string filename = "test_existing_file.txt";
    std::string text = "A";

    // create the file first
    // call the add function and verify it returns true for successful creation
    EXPECT_TRUE(add(filename, text)) << "Add function failed to create file: " << filename << "the first time.";

    // verify the file was created
    std::ifstream infile(filename);
    EXPECT_TRUE(infile.is_open()) << "File 1 was not created: " << filename;

    // call the add function again - should fail to create a new file
    EXPECT_FALSE(add(filename, text)) << "Add function should fail for existing file: " << filename;

    // clean up
    std::remove(filename.c_str());
}

// test if the content is added correctly to the file accordilng to RLE compression
TEST(AddCommandTest, BasicAdd) {
    std::string filename = "test_file.txt";
    std::string text = "AAA";
    std::string expected_content = "3A";

    // Call the add function
    EXPECT_TRUE(add(filename, text)) << "Add function failed to create file: " << filename;

    // Verify the content of the file
    std::ifstream infile(filename);
    EXPECT_TRUE(infile.is_open()) << "File was not created: " << filename;  
    std::string file_content;
    std::getline(infile, file_content);
    EXPECT_EQ(file_content, expected_content) << "File content does not match expected RLE compression.";           
    infile.close();

    // Clean up
    std::remove(filename.c_str());
}
