const { getDb } = require("./mongoClient");

function usersCollection() {
  return getDb().collection("users");
}

function flashesCollection() {
  return getDb().collection("flashes");
}

function bookingsCollection() {
  return getDb().collection("bookings");
}

module.exports = {
  usersCollection,
  flashesCollection,
  bookingsCollection,
};
