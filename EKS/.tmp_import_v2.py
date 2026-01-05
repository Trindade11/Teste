import csv
import pathlib
from neo4j import GraphDatabase

uri = 'neo4j+ssc://af132785.databases.neo4j.io'
user = 'neo4j'
pwd = '42cWtTL6w5hPwC75QUrHP0Q2H87WlXd5m0qWtnH6O0A'
db = 'neo4j'

path = pathlib.Path('NodesV1 - Copia.csv')
with path.open(encoding='cp850', newline='') as f:
    rows = list(csv.reader(f, delimiter=';'))

header = rows[0]
data = [r for r in rows[1:] if r and len(r) > 7 and r[7].strip()]

driver = GraphDatabase.driver(uri, auth=(user, pwd))
with driver.session(database=db) as sess:
    # Criar Organizations
    orgs = set()
    for r in data:
        empresa = (r[1] or '').strip()
        if empresa:
            orgs.add(empresa)
    
    for org in orgs:
        sess.run(
            """
            MERGE (o:Organization {name: $name})
            ON CREATE SET o.createdAt = datetime()
            SET o.updatedAt = datetime()
            """,
            name=org
        )
    
    # Criar Departments (extrair de "Departamento" e "Acesso")
    depts = set()
    for r in data:
        dept = (r[3] or '').strip()
        if dept:
            if ';' in dept:
                for d in dept.split(';'):
                    depts.add(d.strip())
            else:
                depts.add(dept)
        
        acesso = (r[4] or '').strip()
        if acesso:
            if ';' in acesso:
                for a in acesso.split(';'):
                    depts.add(a.strip())
            else:
                depts.add(acesso)
    
    for dept in depts:
        if dept:
            sess.run(
                """
                MERGE (d:Department {name: $name})
                ON CREATE SET d.createdAt = datetime()
                SET d.updatedAt = datetime()
                """,
                name=dept
            )
    
    # Criar Locations
    locs = set()
    for r in data:
        loc = (r[6] or '').strip()
        if loc:
            locs.add(loc)
    
    for loc in locs:
        sess.run(
            """
            MERGE (l:Location {name: $name})
            ON CREATE SET l.createdAt = datetime()
            SET l.updatedAt = datetime()
            """,
            name=loc
        )
    
    # Criar Users e relacionamentos
    for r in data:
        r = (r + [''] * 10)[:10]
        nome = r[0].strip()
        empresa = r[1].strip()
        funcao = r[2].strip()
        dept = r[3].strip()
        acesso = r[4].strip()
        rel_type = r[5].strip()
        loc = r[6].strip()
        email = r[7].strip().lower()
        status = r[8].strip()
        
        if not email:
            continue
        
        # Criar User
        sess.run(
            """
            MERGE (u:User {email: $email})
            SET u.name = $name,
                u.role = $role,
                u.status = $status,
                u.relationshipType = $relType,
                u.updatedAt = datetime(),
                u.createdAt = coalesce(u.createdAt, datetime())
            """,
            email=email,
            name=nome,
            role=funcao,
            status=status,
            relType=rel_type
        )
        
        # BELONGS_TO Organization
        if empresa:
            sess.run(
                """
                MATCH (u:User {email: $email})
                MATCH (o:Organization {name: $org})
                MERGE (u)-[:BELONGS_TO]->(o)
                """,
                email=email,
                org=empresa
            )
        
        # MEMBER_OF Department (principal)
        if dept:
            dept_list = [d.strip() for d in dept.split(';')] if ';' in dept else [dept]
            for d in dept_list:
                if d:
                    sess.run(
                        """
                        MATCH (u:User {email: $email})
                        MATCH (d:Department {name: $dept})
                        MERGE (u)-[:MEMBER_OF]->(d)
                        """,
                        email=email,
                        dept=d
                    )
        
        # HAS_ACCESS_TO Departments (mÃºltiplos acessos)
        if acesso and acesso != dept:
            acesso_list = [a.strip() for a in acesso.split(';')] if ';' in acesso else [acesso]
            for a in acesso_list:
                if a:
                    sess.run(
                        """
                        MATCH (u:User {email: $email})
                        MATCH (d:Department {name: $dept})
                        MERGE (u)-[:HAS_ACCESS_TO]->(d)
                        """,
                        email=email,
                        dept=a
                    )
        
        # WORKS_AT Location
        if loc:
            sess.run(
                """
                MATCH (u:User {email: $email})
                MATCH (l:Location {name: $loc})
                MERGE (u)-[:WORKS_AT]->(l)
                """,
                email=email,
                loc=loc
            )

print('done')
print(f'Organizations: {len(orgs)}')
print(f'Departments: {len(depts)}')
print(f'Locations: {len(locs)}')
print(f'Users: {len(data)}')
