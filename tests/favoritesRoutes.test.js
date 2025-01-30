const request = require("supertest");
const app = require("../server");

describe("Favorites API", () => {
  it("should add a track to favorites", async () => {
    const response = await request(app)
      .post("/api/favorites")
      .set("Authorization", "Bearer BQBO1Iq-ze-ycix1zns-PZ26NgjWyOFqn4-n5Dr5rVFFuLCbKNbSNbx5owxcflBbFrkkPIMTvcWD5kL5Tg-ustyMoBFdwo0VOeF59wGFFXWNlRm1NFo36yqOwzzThwr76kghZHaenU3jQeuMrRxz3I51we-94_TObI97Qa2spOh92pP8Xyun4I9bcBxi0zXYWRLAGQzgbkmOntoY8e27z-Rpz8cv8vjCAWDds7W3bV69lNFX4cWm7T7zjiPI0qprQUcq8g")
      .send({
        itemType: "track",
        itemId: "12345",
        itemName: "Test Song",
        itemArtist: "Test Artist",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Favorite added successfully");
  });
});
