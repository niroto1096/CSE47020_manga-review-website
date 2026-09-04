const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/Manga';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  const otpsCollection = db.collection('otps');

  // $unset unneeded fields: address, phone, company, website, companyWebsite
  const resultUsers = await usersCollection.updateMany(
    {},
    {
      $unset: {
        address: "",
        phone: "",
        company: "",
        website: "",
        companyWebsite: ""
      }
    }
  );
  console.log("Cleaned users collection in MongoDB:", resultUsers);

  const resultOtps = await otpsCollection.updateMany(
    {},
    {
      $unset: {
        address: "",
        phone: "",
        company: "",
        website: "",
        companyWebsite: ""
      }
    }
  );
  console.log("Cleaned otps collection in MongoDB:", resultOtps);

  // Print a sample user document to verify
  const sampleUser = await usersCollection.findOne();
  console.log("\nSample user document now:\n", JSON.stringify(sampleUser, null, 2));

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
