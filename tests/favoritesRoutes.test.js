const request = require("supertest");
const app = require("../server");

describe("Favorites API", () => {
  it("should add a track to favorites", async () => {
    const response = await request(app)
      .post("/api/favorites")
      .set(
        "Authorization",
        "BQAvSl8aqsQVtQksXRDI_OrBWEXH3pP_8UZ5_8CX1B0bU95P8yEQ99MNFc6oJtVmjnnJU0Q5bm0jN64l9OfIwOVv548Po6NozcydjN2F-aJJBlheeODkCK7ydWO87b1yGIMaVg3A_29KAPHuSip0qKutUE_o93qNLD7RSCCWp_dn_gAgWC8LdaGtF6686kDKqRiMJHeVlQ88Mwfk6JdsPxdeQ1EJg5JbHdxgW1xZ_DzaMdp0sg2BZKMAE-h9G991qTshnA"
      )
      .send({
        itemType: "track",
        itemId: "12345",
        itemName: "Test Song",
        itemArtist: "Test Artist",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Favorite added successfully");
  });

  it("should not add a track to favorites if itemType or itemId is missing", async () => {
    const response = await request(app)
      .post("/api/favorites")
      .set(
        "Authorization",
        "BQAvSl8aqsQVtQksXRDI_OrBWEXH3pP_8UZ5_8CX1B0bU95P8yEQ99MNFc6oJtVmjnnJU0Q5bm0jN64l9OfIwOVv548Po6NozcydjN2F-aJJBlheeODkCK7ydWO87b1yGIMaVg3A_29KAPHuSip0qKutUE_o93qNLD7RSCCWp_dn_gAgWC8LdaGtF6686kDKqRiMJHeVlQ88Mwfk6JdsPxdeQ1EJg5JbHdxgW1xZ_DzaMdp0sg2BZKMAE-h9G991qTshnA"
      )
      .send({
        // itemType is missing here
        itemId: "67890",
        itemName: "Invalid Song",
        itemArtist: "Invalid Artist",
      });

    expect(response.status).toBe(400); // Expecting 400 Bad Request
    expect(response.body.message).toBe("Item type and item ID are required.");
  });
});