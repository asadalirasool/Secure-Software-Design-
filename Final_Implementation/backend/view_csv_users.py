import csv
import bcrypt

def view_csv_users():
    try:
        with open('users.csv', mode='r', newline='') as file:
            reader = csv.DictReader(file)
            
            print("\nRegistered Users:")
            print("-" * 100)
            for row in reader:
                print(f"Username: {row['Username']}")
                print(f"Name: {row['Name']}")
                print(f"Age: {row['Age']}")
                print(f"Phone: {row['Phone']}")
                print(f"Registration Date: {row['Registration Date']}")
                print(f"Password Hash: {row['Password Hash']}")
                print("-" * 100)
                
    except FileNotFoundError:
        print("No users.csv file found. No users have registered yet.")
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")

if __name__ == "__main__":
    view_csv_users() 