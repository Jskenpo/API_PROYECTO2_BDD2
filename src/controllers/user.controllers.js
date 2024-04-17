const neo4j = require('neo4j-driver');
const driver = neo4j.driver('neo4j+s://c129e070.databases.neo4j.io', neo4j.auth.basic('neo4j', '2hke53i8ss-TGNiwVHdyvqjFUI9gFqwH-F0tG8BF-Oo'));
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');


const createUser = async (req, res) => {
    const { username, email, password, date_of_birth, real_name, verificado} = req.body;
    existe = await VerifyUserFunction(username, password);
    
    if (existe) {
        res.json({ error: "Usuario ya existe" });
    } else {
        const session = driver.session();
        const query = `CREATE (u:User {id: $id, username: $username, email: $email, password: $password, date_of_birth: $date_of_birth, real_name: $real_name, verificado: $verificado}) RETURN u`;
        try {
            const result = await session.run(query, { id: uuidv4(), username, email, password, date_of_birth, real_name, verificado });
            res.json({ success: true });
        } catch (error) {
            res.json({ error: error.message });
        } finally {
            await session.close();
        }
    }
}

const VerifyUserFunction = async (username, password) => {
    const session = driver.session();
    const query = `MATCH (u:User {username: $username, password: $password}) RETURN u`;
    try {
        const result = await session.run(query, { username, password });
        if (result.records.length > 0) {
            return true;
        } else {
            return false;
        }
        session.close();
    } catch (error) {
        return false;
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

const updateUsername = async (req, res) => {
    const session = driver.session();
    const { username, new_username } = req.body;
    const query = `MATCH (u:User {username: $username}) SET u.username = $new_username RETURN u`;
    try {
        await session.run(query, { username, new_username });
        res.json({ success: true });
    } catch (error) {
        res.json({ error: error.message });
    } finally {
        await session.close();
    }
}

module.exports = {
    createUser,
    verifyUser,
    updateUsername
}