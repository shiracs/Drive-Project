#include <gtest/gtest.h>
#include <fstream>
#include "../interfaces/search-file.h"

// test for searching nonexisting content in files
TEST(SearchFileTest, NoSuchContent) {
    std::string filename = "example.txt"; // example filename
    std::string text = "A";

    std::ofstream outfile(filename);
    outfile << text;    
    outfile.close();

    // search for content that does not exist in the file
    std::vector<std::string> result = search("example content");
    EXPECT_EQ(result.size(), 0);

    // clean up
    std::remove(filename.c_str());
}

// test for searching existing content in files
TEST(SearchFileTest, ExistingContent) {
    std::string filename1 = "example1.txt";
    std::string filename2 = "example2.txt";
    std::string text = "3A";

    //make two files with the same content
    {
    std::ofstream outfile1(filename1);
    outfile1 << text;
    outfile1.close();
    }    

    {
    std::ofstream outfile2(filename2);
    outfile2 << text;    
    outfile2.close();
    }

    // search for content that exists in the files
    std::vector<std::string> result = search("AAA");
    
    // check that both files are found
    if (result.size() != 2) {
        std::remove(filename1.c_str());
        std::remove(filename2.c_str());
        FAIL() << "Expected 2 results, got " << result.size();
    }
    
    EXPECT_EQ(result[0], filename1);
    EXPECT_EQ(result[1], filename2);

    // clean up
    std::remove(filename1.c_str());
    std::remove(filename2.c_str());
}