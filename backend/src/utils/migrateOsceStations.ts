import mongoose from 'mongoose';
import OsceStation from '../models/OsceStation';

// Helper function to calculate total marks (same as in controller)
const calculateTotalMarks = (markingScheme: any[], followUps: any[]): number => {
  let total = 0;
  
  // Calculate from marking scheme
  if (markingScheme && Array.isArray(markingScheme)) {
    markingScheme.forEach((section: any) => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          const score = Number(item.score) || 0;
          total += score;
        });
      }
    });
  }
  
  // Calculate from follow-ups
  if (followUps && Array.isArray(followUps)) {
    followUps.forEach((followUp: any) => {
      const score = Number(followUp.score) || 0;
      total += score;
    });
  }
  
  return total;
};

// Migration function
export const migrateOsceStations = async () => {
  try {
    console.log('Starting OSCE stations migration...');
    
    // Get all OSCE stations
    const stations = await OsceStation.find({});
    console.log(`Found ${stations.length} OSCE stations to migrate`);
    
    let updatedCount = 0;
    
    for (const station of stations) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Check if totalMarks field is missing
      if (station.totalMarks === undefined) {
        updates.totalMarks = calculateTotalMarks(station.markingScheme, station.followUps);
        needsUpdate = true;
        console.log(`Adding totalMarks: ${updates.totalMarks} for station: ${station.title}`);
      }
      
      // Check if followUps need score field
      if (station.followUps && Array.isArray(station.followUps)) {
        const updatedFollowUps = station.followUps.map((followUp: any) => {
          if (followUp.score === undefined) {
            // Add default score of 1 for existing follow-ups without scores
            return { ...followUp, score: 1 };
          }
          return followUp;
        });
        
        // Check if any follow-ups were updated
        if (JSON.stringify(updatedFollowUps) !== JSON.stringify(station.followUps)) {
          updates.followUps = updatedFollowUps;
          needsUpdate = true;
          console.log(`Updated followUps for station: ${station.title}`);
        }
      }
      
      // Update the station if needed
      if (needsUpdate) {
        await OsceStation.findByIdAndUpdate(station._id, updates);
        updatedCount++;
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} stations.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || '';
  
  if (!MONGO_URI) {
    console.error('MONGO_URI environment variable is required');
    process.exit(1);
  }
  
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      await migrateOsceStations();
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB', err);
      process.exit(1);
    });
} 