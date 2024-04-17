const neo4j = require('neo4j-driver');
const driver = neo4j.driver('neo4j+s://c129e070.databases.neo4j.io', neo4j.auth.basic('neo4j', '2hke53i8ss-TGNiwVHdyvqjFUI9gFqwH-F0tG8BF-Oo'));
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');


const createUser = async (req, res) => {
    const { username, email, password, date_of_birth, real_name, verificado } = req.body;
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
    const { username, password } = req.body;
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

const userLikesTweet = async (req, res) => {
    const session = driver.session();
    const { username, tweet_id } = req.body;
    const likeId = uuidv4();
    const date = new Date().toISOString();
    const query = `MATCH (u:User {username: $username}), (t:Tweet {id: $tweet_id})
                    CREATE (u)-[l:LIKES {
                    is: $likeId,
                    username_like: $username,
                    fecha: $date
                }]->(t)
    RETURN l`;
    try {
        await session.run(query, { username, tweet_id, likeId, date });
        res.json({ success: true });
    } catch (error) {
        res.json({ error: error.message });
    } finally {
        await session.close();
    }
}

const userSavesTweet = async (req, res) => {
    const session = driver.session();
    const { username, tweet_id } = req.body;
    const savedId = uuidv4();
    const date = new Date().toISOString();
    const query = `MATCH (u:User {username: $username}), (t:Tweet {id: $tweet_id})
                    CREATE (u)-[s:SAVED {
                        ID: $savedId,
                        FECHA: $date,
                        username_saved: $username
                    }]->(t)
                    RETURN s`;
    try {
        await session.run(query, { username, tweet_id, savedId, date});
        res.json({ success: true });
    } catch (error) {
        res.json({ error: error.message });
    } finally {
        await session.close();
    }
}

const userQuitLike = async (req, res) => {
    const session = driver.session();
    const { username, tweet_id } = req.body;
    const query = `MATCH (u:User {username: $username})-[r:LIKES]->(t:Tweet {id: $tweet_id}) DELETE r`;
    try {
        await session.run(query, { username, tweet_id });
        res.json({ success: true });
    } catch (error) {
        res.json({ error: error.message });
    } finally {
        await session.close();
    }
}

const userQuitSave = async (req, res) => {
    const session = driver.session();
    const { username, tweet_id } = req.body;
    const query = `MATCH (u:User {username: $username})-[r:SAVED]->(t:Tweet {id: $tweet_id}) DELETE r`;
    try {
        await session.run(query, { username, tweet_id });
        res.json({ success: true });
    } catch (error) {
        res.json({ error: error.message });
    } finally {
        await session.close();
    }
}


const deleteUserComplex = async (req, res) => {
    const session = driver.session();
    const { username } = req.body;
    try {
        await deleteUserTweets(username);
        await deleteUser(username);
        res.status(200).json({ success: true });

    } catch (error) {
        console.log('Error al eliminar usuario', error);
        res.status(500).json({ error: error.message });

    } finally {
        await session.close();
    }

}

const deleteUser = async (username) => {
    const session = driver.session();
    const query = `MATCH (u:User {username: $username}) DETACH DELETE u`;
    try {
        await session.run(query, { username });
        return { success: true };
    } catch (error) {
        return { error: error.message };
    } finally {
        await session.close();
    }
}

const deleteUserTweets = async (username) => {
    const session = driver.session();
    const query = `MATCH (u:User {username: $username})-[r:POSTED]->(t:Tweet) DETACH DELETE t`;
    try {
        await session.run(query, { username });
        return { success: true };
    } catch (error) {
        return { error: error.message };
    } finally {
        await session.close();
    }
}

const verifyLikeFromUser = async (req, res) => {
    const session = driver.session();
    const {username, tweetId} = req.body;
    const query = `MATCH (u:User {username: $username})-[r:LIKE]->(t:Tweet {id: $tweetId}) RETURN r`;
    try {
        const result = await session.run(query, { username, tweetId });
        let verified = false;
        if (result.records.length > 0) {
            verified = true;
        } 

        res.json({ success: verified });
    } catch (error) {
        res.json({ error: error.message });
        console.log(error);
    } finally {
        await session.close();
    }
}



module.exports = {
    createUser,
    verifyUser,
    updateUsername,
    userLikesTweet,
    userSavesTweet,
    userQuitLike,
    userQuitSave,
    deleteUserComplex,
    verifyLikeFromUser
}