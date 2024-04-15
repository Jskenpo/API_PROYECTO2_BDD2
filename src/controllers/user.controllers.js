//Neo4j connection
const driver = neo4j.driver('neo4j+s://c129e070.databases.neo4j.io', neo4j.auth.basic('neo4j', '2hke53i8ss-TGNiwVHdyvqjFUI9gFqwH-F0tG8BF-Oo'));
const session = driver.session();