import csv
import pathlib
from neo4j import GraphDatabase

uri = 'neo4j+ssc://af132785.databases.neo4j.io'
user = 'neo4j'
pwd = '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A'
db = 'neo4j'

path = pathlib.Path('Nodes.csv')
with path.open(encoding='cp850', newline='') as f:
    rows = list(csv.reader(f, delimiter=';'))

header = rows[0]
data = [r for r in rows[1:] if r and any(c.strip() for c in r)]

driver = GraphDatabase.driver(uri, auth=(user, pwd))
with driver.session(database=db) as sess:
    sess.run('MATCH (n) DETACH DELETE n')

    org_name = 'TNA e Alocc GestÃ£o Patrimonial'
    sess.run(
        """
        MERGE (o:Organization {name:$name})
        ON CREATE SET o.createdAt = datetime()
        SET o.organizationType = $otype, o.updatedAt = datetime()
        """,
        name=org_name,
        otype='alocc',
    )

    for r in data:
        r = (r + [''] * 10)[:10]
        nome = r[0].strip()
        empresa = (r[1] or org_name).strip() or org_name
        funcao = r[2].strip()
        dept = r[3].strip()
        acesso = r[4].strip()
        rel = r[5].strip()
        loc = r[6].strip()
        email = r[7].strip().lower()
        status = r[8].strip()
        if not email:
            continue
        sess.run(
            """
            MERGE (u:User {email:$email})
            SET u.name=$name,
                u.role=$role,
                u.department=$dept,
                u.access=$access,
                u.relationshipType=$rel,
                u.location=$loc,
                u.status=$status,
                u.company=$company,
                u.updatedAt=datetime(),
                u.createdAt=coalesce(u.createdAt, datetime())
            MERGE (o:Organization {name:$org})
            ON CREATE SET o.createdAt=datetime(), o.organizationType=$otype
            SET o.updatedAt=datetime()
            MERGE (u)-[:BELONGS_TO]->(o)
            """,
            email=email,
            name=nome,
            role=funcao,
            dept=dept,
            access=acesso,
            rel=rel,
            loc=loc,
            status=status,
            company=empresa,
            org=empresa or org_name,
            otype='alocc',
        )
print('done')
