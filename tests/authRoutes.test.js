const request = require("supertest");
const app = require("../server");
const axios = require("axios");

// Mock axios to simulate Spotify API responses without making real network requests
jest.mock("axios");

describe("Authentication API", () => {

  // Test: Redirect to Spotify's authorization page when hitting the login endpoint
  it("should redirect to Spotify's authorization page", async () => {
    const response = await request(app).get("/auth/login");

    // Expect a redirect (302 status code)
    expect(response.status).toBe(302); 
    // Ensure the redirect URL is Spotify's authorization endpoint
    expect(response.headers.location).toContain("https://accounts.spotify.com/authorize");
  });

  // Test: Handle the callback when an invalid authorization code is provided
  it("should handle the callback with an invalid authorization code", async () => {
    const response = await request(app).get("/auth/callback?code=FAKE_AUTH_CODE");

    // Expect a redirect back to the login page with an error query
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("error=authentication_error");
  });

  // Test: Fail to refresh access token when an invalid refresh token is used
  it("should fail to refresh the access token with an invalid token", async () => {
    // Mock Spotify's response for a failed refresh token attempt
    axios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { error: "invalid_grant", error_description: "Invalid refresh token" },
      },
    });
  
    const response = await request(app)
      .post("/auth/refresh")
      .send({ refresh_token: "FAKE_REFRESH_TOKEN" });
  
    // Expect a 400 error because the refresh token is invalid
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid refresh token.");
  });

  // Test: Successfully redirect with access token, refresh token, and JWT after login
  it("should redirect with access token, refresh token, and JWT after successful login", async () => {
    // Mock Spotify's response for exchanging the auth code for tokens
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
      },
    });

    // Mock Spotify's response for retrieving the user's profile info
    axios.get.mockResolvedValueOnce({
      data: {
        id: "mock_spotify_id",
        display_name: "Mock User",
        email: "mockuser@example.com",
        images: [{ url: "http://mockimage.com/profile.jpg" }],
      },
    });

    const response = await request(app).get("/auth/callback?code=VALID_FAKE_CODE");

    // Expect a redirect to the frontend with access_token, refresh_token, and JWT in the URL
    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/access_token=mock_access_token&refresh_token=mock_refresh_token&jwt=.*/);
  });
});