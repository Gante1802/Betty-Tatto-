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

function availableDatesCollection() {
  return getDb().collection("available_dates");
}

module.exports = {
  usersCollection,
  flashesCollection,
  bookingsCollection,
  availableDatesCollection,
};
