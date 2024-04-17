//Neo4j connection

const neo4j = require('neo4j-driver');
const driver = neo4j.driver('neo4j+s://c129e070.databases.neo4j.io', neo4j.auth.basic('neo4j', '2hke53i8ss-TGNiwVHdyvqjFUI9gFqwH-F0tG8BF-Oo'));
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');




// Controlador para obtener todos los tweets
const getAllTweets = async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run('MATCH (t:Tweet)<-[p:POST]-(postedBy:User) WHERE NOT EXISTS(()-[:REPLY]->(t)) RETURN t, postedBy.username AS author LIMIT 25 ');
        const tweets = result.records.map(record => {
            const tweet = record.get('t').properties;
            let author = record.get('author');

            if (author===null){
                author = 'Anónimo';
            }
            return { ...tweet, author };
        });
        
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

        const postId = uuidv4();
        const date  = new Date().toISOString();

        await session.run(
            `MATCH (usuario:User { username: $autorId }), (tweet:Tweet { id: $tweetId })
            MERGE (usuario)-[postRelation:POST {
                id: $postId,
                fecha: $date,
                posted_by: $autorId
            }]->(tweet)
            RETURN postRelation
            `,
            { autorId, tweetId, postId, date}
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
        
        const seUbicaId = uuidv4();
        const validacion = faker.datatype.boolean();
        const date  = new Date().toISOString();
        await session.run(
            `MATCH (tweet:Tweet { id: $tweetId }), (ubicacion:Ubicacion { id: $ubicacionId })
            MERGE (tweet)-[seUbica:SE_UBICA {
                id: $seUbicaId,
                fecha: $date,
                validacion: $validacion
            }]->(ubicacion)
            RETURN seUbica
            `,
            { tweetId, ubicacionId, seUbicaId, validacion, date}
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
            const tagId = uuidv4();
            const date = new Date().toISOString();
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
                    `MATCH (t:Tweet { id: $tweetId }), (hashtag:Hashtag { name: $nombreHashtag })
                    MERGE (t)-[tag:TAG {
                        id: $tagId,
                        fecha: $date,
                        tweet_tagged: $tweetId
                    }]->(hashtag)
                    RETURN tag
                    `,
                    { tweetId, nombreHashtag, tagId, date}
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
            const linkId = uuidv4();
            const date  = new Date().toISOString();
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
                        `MATCH (t:Tweet { id: $tweetId }), (link:Link { url: $url })
                        MERGE (t)-[contiene:CONTIENE {
                            id: $contieneId,
                            fecha: $date,
                            validacion: $validacion
                        }]->(link)
                        RETURN contiene
                        `,
                    { tweetId, url, contieneId: linkId, validacion: faker.datatype.boolean(), date}
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
            const mentionId = uuidv4();
            const date = new Date().toISOString();
            try {
                await session.run(
                    `MATCH (t:Tweet { id: $tweetId }), (usuario:User { username: $usuarioId })
                    MERGE (t)-[mention:MENTION {
                        id: $mentionId,
                        fecha: $date,
                        mentioned_user: $usuarioId
                    }]->(usuario)
                    RETURN mention
                    `,
                    { tweetId, usuarioId, mentionId, date}
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
            let author = record.get('author');
            if (author===null){
                author = 'Anónimo';
            }
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
            let author = record.get('author');
            if (author===null){
                author = 'Anónimo';
            }
            return { ...tweet, author };
        });
        
        res.json(tweets);
        session.close();

    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
}

const createRT = async ( req, res) => {
    const { autorId, texto, hashtags, links, pais, mentions, RTId, RT_mention } = req.body;
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

        await RTRelation(RTId, tweetId, res);
        await RTMention(RTId, RT_mention, res);

        console.log('Retweet creado correctamente');
        res.status(200).json({ message: 'Retweet creado correctamente' });
        
    } catch (error) {
        console.error('Error al retweetear:', error);
        res.status(500).json({ error: 'Ocurrió un error al retweetear' });
    }
}

const RTMention = async (RTId, RT_mention, res) => {
    const session = driver.session();
    const date = new Date().toISOString();
    const rtMentionId = uuidv4();
    try {
        await session.run(
            `MATCH (rt:Tweet { id: $RTId }), (mention:User { username: $RT_mention })
            MERGE (rt)-[rtMention:RT_MENTION {
                id: $rtMentionId,
                fecha: $date,
                mentioned_username: $RT_mention
            }]->(mention)
            RETURN rtMention
            `,
            { RTId, RT_mention, rtMentionId, date}
        );
        session.close();
    } catch (error) {
        console.error('Error al crear la mención de retweet:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear la mención de retweet' });
    }
}

const RTRelation = async (RTId, tweetId, res) => {
    const session = driver.session();
    const motivo = faker.lorem.sentence();
    const retweetId = uuidv4();
    const date = new Date().toISOString();
    try {
        await session.run(
            `MATCH (t:Tweet { id: $tweetId }), (rt:Tweet { id: $RTId })
            MERGE (t)-[retweet:RT {
                id: $retweetId,
                fecha: $date,
                motivo: $motivo
            }]->(rt)
            RETURN retweet
            `,
            { tweetId, RTId, retweetId, motivo, date}
        );
        session.close();
    } catch (error) {
        console.error('Error al crear la relación de retweet:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear la relación de retweet' });
    }
}

const createReply = async (req, res) => {
    const { autorId, texto, hashtags, links, pais, mentions, replyId } = req.body;
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

        await ReplyRelation(replyId, tweetId, res);

        console.log('Respuesta creada correctamente');

        res.status(200).json({ message: 'Respuesta creada correctamente' });
        
    } catch (error) {
        console.error('Error al responder:', error);
        res.status(500).json({ error: 'Ocurrió un error al responder' });
    }
}

const ReplyRelation = async (replyId, tweetId, res) => {
    const session = driver.session();
    const date = new Date().toISOString();
    const RelationReplyId = uuidv4();
    try {
        await session.run(
            `MATCH (t:Tweet { id: $tweetId }), (reply:Tweet { id: $replyId })
            MERGE (t)-[replyRelation:REPLY {
                id: $RelationReplyId,
                fecha: $date,
                replied_tweet: $tweetId
            }]->(reply)
            RETURN replyRelation`,
            { tweetId, replyId, date, RelationReplyId }
        );
        session.close();
    } catch (error) {
        console.error('Error al crear la relación de respuesta:', error);
        res.status(500).json({ error: 'Ocurrió un error al crear la relación de respuesta' });
    }
}

const getTweetbyId = async (req, res) => {
    const tweetId = req.body.id;
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (t:Tweet { id: $id }) RETURN t`,
            { id: tweetId }
        );
        const tweet = result.records[0].get('t').properties;
        res.json(tweet);
        session.close();
    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
};

const getRepliesbyId = async (req, res) => {
    const tweetId = req.body.id;
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (originalTweet:Tweet {id: $tweetId})<-[:REPLY]-(reply:Tweet)<-[:POST]-(replyAuthor:User) RETURN originalTweet, reply, replyAuthor.username as author`,
            { tweetId }
        );
        const replies = result.records.map(record => {
            const tweet = record.get('reply').properties;
            let  author = record.get('author');

            if (author===null){
                author = 'Anónimo';
            }
            return { ...tweet, author };
        });
        res.json(replies);
        session.close();
    } catch (error) {
        console.error('Error al obtener las respuestas:', error);
        res.status(500).json({ error: 'Error al obtener las respuestas' });
    }
};

const getLikesbyTweet = async (req, res) => {
    const tweetId = req.body.id;
    const session = driver.session();
    try {
        //contador de cuantas relaciones de LIKE tiene el tweet
        const result = await session.run(
            `MATCH (t:Tweet { id: $tweetId })<-[l:LIKE]-(u:User) RETURN COUNT(l) as likes`,
            { tweetId }
        );

        //retornar el contador de likes
        const likes = result.records[0].get('likes');

        res.json({'numero_likes' :likes.low});
        session.close();
    } catch (error) {
        console.error('Error al obtener los likes:', error);
        res.status(500).json({ error: 'Error al obtener los likes' });
    }
};

const searchTweetbyText = async (req, res) => {
    const text = req.body.texto;
    const session = driver.session();
    try {
        //hacer match con nombre de usuario 
        const result = await session.run(
            `MATCH (t:Tweet) <-[:POST]-(replyAuthor:User) WHERE t.texto CONTAINS $text RETURN t, replyAuthor.username as author`,
            { text }
        );
        const tweets = result.records.map(record => {
            const Tweet =record.get('t').properties;
            let author = record.get('author');
            if (author===null){
                author = 'Anónimo';
            }
            return { ...Tweet, author };
        });

        res.json(tweets);
        session.close();
    } catch (error) {
        console.error('Error al obtener los tweets:', error);
        res.status(500).json({ error: 'Error al obtener los tweets' });
    }
};

const deleteTweet = async (req, res) => {
    const tweetId = req.body.id;
    const session = driver.session();
    try {
        await session.run(
            `MATCH (t:Tweet { id: $tweetId }) DETACH DELETE t`,
            { tweetId }
        );
        res.json({ success: true });
        session.close();
    } catch (error) {
        console.error('Error al eliminar el tweet:', error);
        res.status(500).json({ error: 'Error al eliminar el tweet' });
    }
};

const editarTweet = async (req, res) => {
    const tweetId = req.body.id;
    const newText = req.body.texto;
    const session = driver.session();
    try {
        await session.run(
            `MATCH (t:Tweet { id: $tweetId }) SET t.texto = $newText`,
            { tweetId, newText }
        );
        res.json({ success: true });
        session.close();
    } catch (error) {
        console.error('Error al editar el tweet:', error);
        res.status(500).json({ error: 'Error al editar el tweet' });
    }
};

module.exports = {
    getAllTweets,
    crearTweetComplex,
    getTweetPostedbyUserId,
    getTweetLikedbyUserId,
    getTweetSavedbyUserId,
    createRT,
    createReply,
    getTweetbyId,
    getRepliesbyId,
    getLikesbyTweet,
    searchTweetbyText,
    deleteTweet,
    editarTweet
};
