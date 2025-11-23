FROM gcc:latest

# installing cmake
RUN apt-get update && apt-get install -y cmake

# creating the project directory
WORKDIR /usr/src/app

# Copying all the project files into the container
COPY . .

# Building the project using CMake
RUN mkdir build
WORKDIR /usr/src/app/build
RUN cmake .. && make

# Environment Variable Setup
ENV STORAGE_PATH="/usr/src/app/my_storage"

# Creating the storage folder so the program won't crash on first run
RUN mkdir -p /usr/src/app/my_storage

# By default, running this container will start the main application
CMD ["./my_drive"]