import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  console.log("Checking rooms...");
  const snapRooms = await getDocs(collection(db, "rooms"));
  console.log("Rooms count:", snapRooms.size);
  if (!snapRooms.empty) {
    console.log("First room:", snapRooms.docs[0].data());
  }

  console.log("Checking bookings...");
  const snapBookings = await getDocs(collection(db, "bookings"));
  console.log("Bookings count:", snapBookings.size);
  if (!snapBookings.empty) {
     console.log("First booking:", snapBookings.docs[0].data());
  }
}
check().catch(console.error);
