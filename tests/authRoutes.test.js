// tests/authRoutes.test.js
const request = require("supertest");
const app = require("../server");

describe("Authentication API", () => {
  it("should redirect to Spotify's authorization page", async () => {
    const response = await request(app).get("/auth/login");

    expect(response.status).toBe(302); // Redirection to Spotify
    expect(response.headers.location).toContain("https://accounts.spotify.com/authorize");
  });

  it("should handle the callback with an invalid authorization code", async () => {
    const fakeAuthCode = "FAKE_AUTH_CODE"; 

    const response = await request(app)
      .get("/auth/callback")
      .query({ code: fakeAuthCode });

    expect(response.status).toBe(302);
  });

  it("should fail to refresh the access token with an invalid token", async () => {
    const response = await request(app)
      .post("/auth/refresh")
      .send({ refresh_token: "FAKE_REFRESH_TOKEN" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid refresh token."); 
  });
});