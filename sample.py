import os

def list_and_save_paths(root_dir, output_file_name="paths_list.txt"):
    """
    Recursively lists all files and folders inside a given directory 
    and saves the paths to a specified text file.

    Args:
        root_dir (str): The starting directory path.
        output_file_name (str): The name of the text file to save the output.
    """
    
    # 1. Check if the root directory exists
    if not os.path.exists(root_dir):
        print(f"❌ Error: The directory '{root_dir}' was not found.")
        return

    # 2. Open the output file for writing
    # 'w' mode will create the file if it doesn't exist, or overwrite it if it does.
    try:
        with open(output_file_name, 'w', encoding='utf-8') as outfile:
            print(f"📂 Starting to scan directory: {root_dir}")
            
            # 3. Traverse the directory structure
            # os.walk() generates the file names in a directory tree by walking the tree 
            # either top-down or bottom-up. For each directory in the tree rooted at 
            # directory top (including top itself), it yields a 3-tuple:
            # (dirpath, dirnames, filenames).
            for dirpath, dirnames, filenames in os.walk(root_dir):
                
                # --- Save Folder Paths (dirpath) ---
                # dirpath is the path of the directory os.walk is currently visiting
                # We print it to the console and write it to the file.
                folder_path = dirpath
                print(f"📁 Folder: {folder_path}")
                outfile.write(f"FOLDER: {folder_path}\n")

                # --- Save File Paths (filenames) ---
                # filenames is a list of non-directory files in the current directory
                for filename in filenames:
                    # Construct the full path by joining dirpath and filename
                    file_path = os.path.join(dirpath, filename)
                    print(f"📄 File: {file_path}")
                    outfile.write(f"FILE: {file_path}\n")

        print(f"\n✅ Scan complete! All paths have been saved to **{output_file_name}**.")

    except IOError as e:
        print(f"\n❌ Error writing to file '{output_file_name}': {e}")
    except Exception as e:
        print(f"\n❌ An unexpected error occurred: {e}")



TARGET_DIRECTORY = "/Users/mymac/Desktop/DYAD_BOLT/bolt.diy"
OUTPUT_FILE = "scan_results.txt"

list_and_save_paths(TARGET_DIRECTORY, OUTPUT_FILE)