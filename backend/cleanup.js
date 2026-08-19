require("dotenv").config();
const mongoose = require("mongoose");
const Theater = require("./models/theater");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB\n");

  const all = await Theater.find();
  console.log(`Total theaters in database: ${all.length}\n`);

  all.forEach((t, i) => {
    console.log(`${i + 1}. _id: ${t._id}`);
    console.log(`   name: "${t.name}"`);
    console.log(`   city: "${t.city}"`);
    console.log(`   address: "${t.address}"\n`);
  });

  const broken = all.filter((t) => !t.name || !t.city);
  if (broken.length > 0) {
    console.log(`Found ${broken.length} broken theater(s) with missing name/city. Deleting them…`);
    await Theater.deleteMany({ _id: { $in: broken.map((t) => t._id) } });
    console.log("Done. Re-run this script to confirm they're gone.");
  } else {
    console.log("No broken theaters found — all documents have a name and city.");
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});