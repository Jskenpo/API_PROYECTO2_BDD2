//Neo4j connection

const neo4j = require('neo4j-driver');
const driver = neo4j.driver('neo4j+s://c129e070.databases.neo4j.io', neo4j.auth.basic('neo4j', '2hke53i8ss-TGNiwVHdyvqjFUI9gFqwH-F0tG8BF-Oo'));
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');



// Controlador para obtener todos los tweets
const getAllTweets = async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run('MATCH (t:Tweet) RETURN t LIMIT 25');
        const tweets = result.records.map(record => record.get('t').properties);
        res.json(tweets);
        session.close();
        console.log('mostrando 25 tweets en la consola');
    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
};

const CrearTweet = async (tweetId, fecha, autorId, texto, hashtags, links, pais, res) => {
    const session = driver.session();
    try {
        await session.run(
            `CREATE (tweet:Tweet {
                fecha: $fecha,
                texto: $texto,
                id: $tweetId,
                topic: $topic,
                hashtags: $hashtags,
                links: $links,
                ubicacion: $pais
            }) RETURN tweet`,
            {
                fecha,
                texto,
                tweetId,
                topic: faker.lorem.word(),
                hashtags: hashtags,
                links: links,
                pais
            }
        );

        await session.run(
            `MATCH (usuario:User { id: $autorId })
             MATCH (tweet:Tweet { id: $tweetId })
             MERGE (usuario)-[:POST]->(tweet)`,
            { autorId, tweetId }
        );

        session.close();
    } catch (error) {
        console.error('Error al crear el tweet:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear el tweet' });
    }


}

const crearUbi = async (tweetId, pais, res) => {
    const session = driver.session();
    try {
        ubicacionId = uuidv4();
        await session.run(
            `CREATE (ubicacion:Ubicacion {
                pais: $pais,
                coords: $coords,
                region: $region,
                urbana: $urban,
                id: $ubicacionId
            }) RETURN ubicacion`,
            {
                pais,
                coords: [faker.location.latitude(), faker.location.longitude()],
                region: faker.location.state(),
                urban: faker.datatype.boolean(),
                ubicacionId
            }
        );

        await session.run(
            `MATCH (tweet:Tweet { id: $tweetId })
            MATCH (ubicacion:Ubicacion { id: $ubicacionId })
            MERGE (tweet)-[:SE_UBICA]->(ubicacion)`,
            { tweetId, ubicacionId }
        );
        session.close();

    } catch (error) {
        console.error('Error al crear la ubicacion:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear la ubicacion' });

    }


}

const crearHashtag = async (tweetId, hashtags, res) => {
    try {
        await Promise.all(hashtags.map(async (nombreHashtag) => {
            const session = driver.session();
            try {
                await session.run(
                    `MERGE (hashtag:Hashtag { name: $nombreHashtag })
                    ON CREATE SET hashtag.size = $size,
                                  hashtag.topic = $topic,
                                  hashtag.trending = $trending,
                                  hashtag.id = $hashtagId`,
                    {
                        nombreHashtag,
                        size: nombreHashtag.length,
                        topic: faker.lorem.word(),
                        trending: faker.datatype.boolean(),
                        hashtagId: uuidv4()
                    }
                );

                await session.run(
                    `MATCH (t:Tweet { id: $tweetId })
                    MATCH (hashtag:Hashtag { name: $nombreHashtag })
                    MERGE (t)-[:HASHTAG]->(hashtag)`,
                    { tweetId, nombreHashtag }
                );
            } finally {
                session.close();
            }
        }));
    } catch (error) {
        console.error('Error al crear el hashtag:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear el hashtag' });
    }
}

const crearLink = async (tweetId, links, res) => {

    try {
        await Promise.all(links.map(async (url) => {
            const session = driver.session();
            try {
                const terminacion = url.split('.').pop();
                const protocolo = url.startsWith('https') ? 'https' : 'http';

                await session.run(
                    `MERGE (link:Link { url: $url })
                    ON CREATE SET link.https = $https,
                                    link.terminacion = $terminacion,
                                    link.topic = $topic,
                                    link.id = $linkId`,
                    {
                        url,
                        https: protocolo === 'https',
                        terminacion,
                        topic: faker.lorem.word(),
                        linkId: uuidv4()
                    }
                );

                await session.run(
                    `MATCH (t:Tweet { id: $tweetId })
                        MATCH (link:Link { url: $url })
                        MERGE (t)-[:CONTIENE]->(link)`,
                    { tweetId, url }
                );

            } finally {
                session.close();
            }
        }));
    } catch (error) {
        console.error('Error al crear el link:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear el link' });
    }
}

const crearMencion = async (tweetId, mentions, res) => {
    try {

        //verificar si los usuarios mencionados existen en la base de datos
        await Promise.all(mentions.map(async (usuarioId) => {
            const session = driver.session();
            try {
                const result = await session.run(
                    `MATCH (usuario:User { username: $usuarioId }) RETURN usuario`,
                    { usuarioId }
                );
                if (result.records.length === 0) {
                    throw new Error(`El usuario ${usuarioId} no existe`);
                }
            } finally {
                session.close();
            }
        }));
        await Promise.all(mentions.map(async (usuarioId) => {
            const session = driver.session();
            try {
                await session.run(
                    `MATCH (t:Tweet { id: $tweetId })
                    MATCH (usuario:User { username: $usuarioId })
                    MERGE (t)-[:MENTION]->(usuario)`,
                    { tweetId, usuarioId }
                );
            } finally {
                session.close();
            }
        }));
    } catch (error) {
        console.error('Error al crear la mención:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear la mención' });
    }
}

// Función para crear un tweet
const crearTweetComplex = async (req, res) => {
    const { autorId, texto, hashtags, links, pais, mentions } = req.body;
    const tweetId = uuidv4();
    const fecha = new Date().toISOString();

    try {
        await CrearTweet(tweetId, fecha, autorId, texto, hashtags, links, pais, mentions, res);
        if (hashtags.length > 0) {
            await crearHashtag(tweetId, hashtags, res);
        }
        if (links.length > 0) {
            await crearLink(tweetId, links, res);
        }
        if (pais) {
            await crearUbi(tweetId, pais, res);
        }
        if (mentions.length > 0) {
            await crearMencion(tweetId, mentions, res);
        }

        res.json({ message: 'Tweet creado correctamente' });
    } catch (error) {
        console.error('Error al crear el tweet:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear el tweet' });
    }
}

const getTweetSavedbyUserId = async (req, res) => {
    const userId = req.params.username;
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (u:User { username: $id })-[r:SAVED]->(t:Tweet)<-[p:POST]-(postedBy:User) RETURN t, postedBy.username as author`,
            { id: userId }
        );
        const tweets = result.records.map(record => {
            const tweet = record.get('t').properties;
            const author = record.get('author');
            return { ...tweet, author };
        });
        res.json(tweets);
        session.close();
    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
}

const getTweetPostedbyUserId = async (req, res) => {
    const userId = req.params.username;
    console.log('ese es el userId');
    console.log(userId);
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (u:User { username: $id })-[r:POST]->(t:Tweet) RETURN t`,
            { id:userId }
        );
        const tweets = result.records.map(record => record.get('t').properties);
        res.json(tweets);
        session.close();
    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
};

const getTweetLikedbyUserId = async (req, res) => {
    const username = req.params.username;
    
    try {
        const session = driver.session();
        const result = await session.run(
            `MATCH (u:User { username: $id })-[r:LIKE]->(t:Tweet)<-[p:POST]-(postedBy:User) RETURN t, postedBy.username as author`,
            { id: username }
        );

        const tweets = result.records.map(record => {
            const tweet = record.get('t').properties;
            const author = record.get('author');
            return { ...tweet, author };
        });
        
        res.json(tweets);
        session.close();

    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
}


module.exports = {
    getAllTweets,
    crearTweetComplex,
    getTweetPostedbyUserId,
    getTweetLikedbyUserId,
    getTweetSavedbyUserId
};
