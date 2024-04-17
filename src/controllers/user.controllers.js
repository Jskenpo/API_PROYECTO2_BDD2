const neo4j = require('neo4j-driver');
const driver = neo4j.driver('neo4j+s://c129e070.databases.neo4j.io', neo4j.auth.basic('neo4j', '2hke53i8ss-TGNiwVHdyvqjFUI9gFqwH-F0tG8BF-Oo'));
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');


const createUser = async (req, res) => {
    const session = driver.session();
    const { username, email, password, date_of_birth, real_name, verificado} = req.body;
    const id = uuidv4();
    const query = `CREATE (u:User {id: $id, username: $username, email: $email, password: $password, date_of_birth: $date_of_birth, real_name: $real_name, verificado: $verificado}) RETURN u`;
    try {
        const result = await session.run(query, { id, username, email, password, date_of_birth, real_name, verificado });
        res.json(result.records[0]._fields[0].properties);
        session.close();
        console.log('Usuario creado');
    } catch (error) {
        res.json({ error: error.message });
    } finally {
        await session.close();
    }
}


const verifyUser = async (req, res) => {
    const session = driver.session();
    const { username, password} = req.body;
    const query = `MATCH (u:User {username: $username, password: $password}) RETURN u`;
    try {
        const result = await session.run(query, { username, password });
        //si existe el usuario devolver tru de lo contrario False 
        if (result.records.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
        session.close();
    } catch (error) {
        res.json({ error: error.message });
    } finally {
        await session.close();
    }
}

module.exports = {
    createUser,
    verifyUser
}