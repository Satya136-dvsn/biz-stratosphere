import pandas as pd
import numpy as np

# Example cleaning function: drop NA, standardize columns, type conversion
def clean_data(input_path: str, output_path: str = None) -> pd.DataFrame:
    df = pd.read_csv(input_path)
    # Standardize column names
    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
    # Drop completely empty rows
    df = df.dropna(how='all')
    # Fill missing numeric with 0, string with ''
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna('')
    # Example: convert date columns
    for col in df.columns:
        if 'date' in col or 'timestamp' in col:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    if output_path:
        df.to_csv(output_path, index=False)
    return df

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python clean.py <input_csv> [output_csv]")
        exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    df = clean_data(input_path, output_path)
    print(f"Cleaned data shape: {df.shape}")
