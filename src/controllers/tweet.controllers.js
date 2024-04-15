//Neo4j connection

const neo4j = require('neo4j-driver');
const driver = neo4j.driver('neo4j+s://c129e070.databases.neo4j.io', neo4j.auth.basic('neo4j', '2hke53i8ss-TGNiwVHdyvqjFUI9gFqwH-F0tG8BF-Oo'));
const session = driver.session();



// Controlador para obtener todos los tweets
const getAllTweets = async (req, res) => {
    try {
        const result = await session.run('MATCH (t:Tweet) RETURN t LIMIT 25');
        const tweets = result.records.map(record => record.get('t').properties);
        res.json(tweets);
    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
};

// Controlador para crear un nuevo tweet
const createTweet = async (req, res) => {
    const { texto, hashtags, links, userId } = req.body;
    try {
        const result = await session.run(
            'CREATE (t:Tweet {texto: $texto, hashtags: $hashtags, links: $links})-[:POSTED_BY]->(u:User {userId: $userId}) RETURN t',
            { texto, hashtags, links, userId }
        );
        const newTweet = result.records[0].get('t').properties;
        res.json(newTweet);
    } catch (error) {
        console.error('Error al crear el tweet:', error);
        res.status(500).json({ error: 'Error al crear el tweet' });
    }
};

module.exports = {
    getAllTweets,
    createTweet
};
