import socket
import sys

def main():
    #check if correct number of arguments are provided
    if len(sys.argv) < 3:
        return

    server_ip = sys.argv[1]
    server_port = int(sys.argv[2])
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        sock.connect((server_ip, server_port))
    except ConnectionRefusedError:
        return

    while True:
        try:
            command = input()
            sock.sendall((command + '\n').encode('utf-8'))
            response = sock.recv(4096).decode('utf-8')

            if not response:
                break

            print(response, end='')

        except (EOFError, KeyboardInterrupt):
            break
        except Exception as e:
            break

    sock.close()

if __name__ == "__main__":
    main()