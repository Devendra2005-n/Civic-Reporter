import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Complaint from './models/Complaint.js';

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const clearDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for clearing.");
        
        const result = await Complaint.deleteMany({});
        console.log(`Successfully deleted ${result.deletedCount} complaints.`);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

clearDB();
