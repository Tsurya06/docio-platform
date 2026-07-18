import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env' });

import mongoose from 'mongoose';
import { patientService } from './src/features/patient/patient.service.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await patientService.listForAdmin({
      search: 'Pat t1784064057',
      page: 1,
      limit: 10
    });

    console.log('Search result:', JSON.stringify(result, null, 2));
    console.log('Number of patients found:', result.items?.length || 0);
    if (result.items && result.items.length > 0) {
      console.log('First patient:', JSON.stringify(result.items[0], null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
