const request = require("supertest");
const app = require("../server");

describe("Favorites API", () => {
  it("should add a track to favorites", async () => {
    const response = await request(app)
      .post("/api/favorites")
      .set("Authorization", "BQDGZpyd9o5ev8NBBiepoqsf3sw90imvcdN7D7GM4d7-aTbpbqFRrbT8BxfvznuRNb5masj_DZoiAhU6TJTW2iEWDIdkyY2-kC2CEMGALqzt9aDI_VxeFk6Ef4ixkaOTpy4htuW1Qh0RJV1R16apUqx783occSUpTm003XM68FfHVKrjgMBlN05AUKSQ67XpS4Es3qKJFai0ZtyNY1KaKA16wlZSkjENCQLlWzMJR2WvwJCSSnuG20Gyh7Rd52dl-6MMlw")
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
