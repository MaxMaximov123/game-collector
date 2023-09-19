import dotenv from 'dotenv';
dotenv.config();

export default{
    client: 'pg',
    connection: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    },
    migrations: {
        directory: './migrations'
    },
    
    pool: { min: 1, max: 5 }
};