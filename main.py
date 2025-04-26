import pymongo
from pymongo import MongoClient
import sys

def connect_to_mongodb():
    """Connect to MongoDB and return the client."""
    try:
        # Update these connection details with your MongoDB URI
        connection_string = input("Enter your MongoDB connection string (default: mongodb://localhost:27017): ") or "mongodb://localhost:27017"
        client = MongoClient(connection_string)
        
        # Test the connection
        client.admin.command('ping')
        print("Connected successfully to MongoDB!")
        return client
    except pymongo.errors.ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        sys.exit(1)

def list_databases(client):
    """List all databases in the MongoDB instance."""
    print("\nAvailable databases:")
    for db_info in client.list_databases():
        db_name = db_info["name"]
        # Skip system databases
        if db_name not in ['admin', 'config', 'local']:
            print(f"- {db_name}")
    print()

def list_collections(client, db_name):
    """List all collections in a specific database."""
    db = client[db_name]
    collections = db.list_collection_names()
    
    if not collections:
        print(f"No collections found in database '{db_name}'")
        return
    
    print(f"\nCollections in database '{db_name}':")
    for collection in collections:
        count = db[collection].count_documents({})
        print(f"- {collection} ({count} documents)")
    print()

def drop_database(client, db_name):
    """Drop a specific database."""
    try:
        client.drop_database(db_name)
        print(f"Database '{db_name}' has been dropped successfully!")
    except Exception as e:
        print(f"Error dropping database '{db_name}': {e}")

def main():
    print("MongoDB Database Cleanup Tool")
    print("=============================")
    
    # Connect to MongoDB
    client = connect_to_mongodb()
    
    # List all databases
    list_databases(client)
    
    # Ask which database to examine or drop
    while True:
        db_name = input("Enter the name of the database to examine (or 'q' to quit): ")
        
        if db_name.lower() == 'q':
            break
        
        # Check if database exists
        if db_name not in [db["name"] for db in client.list_databases()]:
            print(f"Database '{db_name}' does not exist.")
            continue
        
        # List collections in the database
        list_collections(client, db_name)
        
        # Ask if user wants to drop the database
        confirm = input(f"Do you want to DROP the entire database '{db_name}'? This action cannot be undone! (yes/no): ")
        
        if confirm.lower() == 'yes':
            # Double-check
            final_confirm = input(f"Are you ABSOLUTELY SURE you want to delete '{db_name}'? Type the database name to confirm: ")
            
            if final_confirm == db_name:
                drop_database(client, db_name)
            else:
                print("Database name did not match. Operation cancelled.")
        else:
            print("Operation cancelled.")
    
    print("\nThank you for using the MongoDB Database Cleanup Tool!")

if __name__ == "__main__":
    main()