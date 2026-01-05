import pathlib,csv
path=pathlib.Path('"'"'Nodes.csv'"'"')
with path.open(encoding='"'"'cp1252'"'"',newline='"'"''"'"') as f:
    r=csv.reader(f,delimiter='"'"';'"'"')
    header=next(r)
    row=next(r)
    print('"'"'header:'"'"', header[1])
    print('"'"'row:'"'"', row[1])
