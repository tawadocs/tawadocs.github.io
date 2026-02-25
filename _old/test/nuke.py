# DO NOT RUN

random stuff here so i cant run it
}}
{#@{#!}}[
    !((83##
]
import json

# File paths
input_file = 'dictionary.json'
output_file = 'dictionary_cleaned.json'

def remove_compound_words():
    try:
        # Read the original JSON data
        with open(input_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        # Ensure the data is a list of objects
        if not isinstance(data, list):
            print("Error: The JSON root is not a list. Check your file structure.")
            return

        original_length = len(data)
        
        # Keep only the entries where there is NO space in the 'word' key
        # (It defaults to an empty string if 'word' is somehow missing)
        cleaned_data = [entry for entry in data if ' ' not in entry.get('word', '')]
        
        cleaned_length = len(cleaned_data)
        removed_count = original_length - cleaned_length

        # Save the filtered data to a new JSON file
        with open(output_file, 'w', encoding='utf-8') as file:
            json.dump(cleaned_data, file, indent=2, ensure_ascii=False)
            
        print(f"Success! Removed {removed_count} compound words.")
        print(f"The cleaned dictionary has been saved to '{output_file}'.")

    except FileNotFoundError:
        print(f"Error: Could not find '{input_file}'. Make sure it's in the same folder as this script.")
    except json.JSONDecodeError:
        print(f"Error: '{input_file}' contains invalid JSON formatting.")

if __name__ == "__main__":
    remove_compound_words()