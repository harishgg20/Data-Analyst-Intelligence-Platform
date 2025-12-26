try:
    import pandas
    print("Pandas is installed correctly! Version:", pandas.__version__)
    import python_multipart
    print("python-multipart is installed correctly!")
except ImportError as e:
    print(f"IMPORT ERROR: {e}")
