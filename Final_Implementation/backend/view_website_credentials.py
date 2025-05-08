import csv
import bcrypt

def view_website_credentials():
    try:
        with open('data.csv', mode='r', newline='') as file:
            reader = csv.DictReader(file)
            
            print("\nSaved Website Credentials:")
            print("-" * 100)
            for row in reader:
                print(f"Website: {row['Website URL']}")
                print(f"Username: {row['Username']}")
                print(f"Password Hash: {row['Password Hash']}")
                print(f"Saved on: {row['Saved Date']}")
                print("-" * 100)
                
    except FileNotFoundError:
        print("No data.csv file found. No website credentials have been saved yet.")
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")

if __name__ == "__main__":
    view_website_credentials() 