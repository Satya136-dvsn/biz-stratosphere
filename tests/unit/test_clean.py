import os
import pandas as pd
from etl.clean import clean_data

def test_clean_data_basic(tmp_path):
    # Create a sample CSV
    csv_content = """Name,Value,Date\nA,1,2023-01-01\nB,,2023-01-02\n,3,\n"""
    input_file = tmp_path / "sample.csv"
    with open(input_file, 'w') as f:
        f.write(csv_content)
    # Run cleaning
    df = clean_data(str(input_file))
    # Check shape
    assert df.shape[0] == 3
    # Check column names
    assert 'name' in df.columns
    assert 'value' in df.columns
    assert 'date' in df.columns
    # Check missing values filled
    assert df.loc[1, 'value'] == 0
    assert df.loc[2, 'name'] == ''
    # Check date parsing
    assert pd.isna(df.loc[2, 'date']) or pd.api.types.is_datetime64_any_dtype(df['date'])

def test_clean_data_output(tmp_path):
    csv_content = "A,B\n1,2\n3,4\n"
    input_file = tmp_path / "in.csv"
    output_file = tmp_path / "out.csv"
    with open(input_file, 'w') as f:
        f.write(csv_content)
    df = clean_data(str(input_file), str(output_file))
    assert os.path.exists(output_file)
    df2 = pd.read_csv(output_file)
    assert df2.shape == (2, 2)
