import pkg from 'pg';
const { Pool } = pkg;

const connectDB = async () => {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'qu711c',
        database: 'postgres',
    });

    try {
        const client = await pool.connect();
        console.log(`\nPostgreSQL connected! Database: postgres`);
        client.release();
        return pool;
    } catch (err) {
        console.log('DB Connection error:', err.message);
        process.exit(1);
    }
};

export default connectDB;