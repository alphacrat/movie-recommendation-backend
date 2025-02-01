import pkg from 'pg';
const { Pool } = pkg;

const connectDB = async () => {
    // Clean up the DATABASE_URL by properly handling the sslmode parameter
    const databaseUrl = process.env.DATABASE_URL.split('?')[0];  // Remove the query parameters

    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false,
            require: true
        }
    });

    try {
        const client = await pool.connect();
        console.log(`\nPostgreSQL connected successfully!`);
        client.release();
        return pool;
    } catch (err) {
        console.log('DB Connection error:', err.message);
        process.exit(1);
    }
};

export default connectDB;