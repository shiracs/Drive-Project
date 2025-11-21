//test the command add [file name] [text] 
#include <gtest/gtest.h>
#include "../interfaces/get-command.h"
#include <iostream>
#include <cstdio>
#include <fstream>

// test for inccorect use of the get command
TEST(GetCommandTest, IncorrectUsage) {
    std::string filename = ""; // empty filename

    // call the get function and verify it returns an empty string for incorrect usage
    EXPECT_EQ(get(filename), "") << "Get function should return empty string for empty filename.";

    filename = "non_existent_file.txt"; // non-existent file
    std::remove(filename.c_str()); // ensure the file does not exist
    EXPECT_EQ(get(filename), "") << "Get function should return empty string for non-existent file.";
}

// test if getting content from an existing file works correctly
TEST(GetCommandTest, GetExistingFile) { 
    std::string filename = "test_get_existing_file.txt";
    std::string comprressed_content = "3A";
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