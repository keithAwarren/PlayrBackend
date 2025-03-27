const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const axios = require("axios");

// Mock axios to simulate Spotify API responses without making real network requests
jest.mock("axios");

// Mock the database functions to avoid real DB queries during tests
jest.mock("../utils/sqlFunctions", () => ({
  checkRecordExists: jest.fn().mockResolvedValue(true), // Mock user existence check to always return true
  insertRecord: jest.fn(),
  queryRecord: jest.fn(),
}));

describe("Authentication API", () => {
  // Test: Redirect to Spotify's authorization page when hitting the login endpoint
  it("should redirect to Spotify's authorization page", async () => {
    const response = await request(app).get("/auth/login");

    // Expect a redirect (302 status code)
    expect(response.status).toBe(302);
    // Ensure the redirect URL is Spotify's authorization endpoint
    expect(response.headers.location).toContain(
      "https://accounts.spotify.com/authorize"
    );
  });

  // Test: Handle the callback when an invalid authorization code is provided
  it("should handle the callback with an invalid authorization code", async () => {
    // Mock Spotify's response to simulate a failed token exchange
    axios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          error: "invalid_grant",
          error_description: "Invalid authorization code",
        },
      },
    });

    const response = await request(app).get(
      "/auth/callback?code=FAKE_AUTH_CODE"
    );

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
        data: {
          error: "invalid_grant",
          error_description: "Invalid refresh token",
        },
      },
    });

    // Generate a mock JWT token to simulate an authenticated user
    const mockJwtPayload = {
      userId: 1,
      spotify_id: "mock_spotify_id",
      email: "mockuser@example.com",
    };
    const validJwtToken = jwt.sign(
      mockJwtPayload,
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    const response = await request(app)
      .post("/auth/refresh")
      .set("Authorization", `Bearer ${validJwtToken}`) // Include valid JWT
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

    const { queryRecord } = require("../utils/sqlFunctions");
    queryRecord.mockResolvedValueOnce([
      { id: 1, spotify_id: "mock_spotiy_id" },
    ]);

    const response = await request(app).get(
      "/auth/callback?code=VALID_FAKE_CODE"
    );

    // Expect a redirect to the frontend with access_token, refresh_token, and JWT in the URL
    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(
      /access_token=mock_access_token&refresh_token=mock_refresh_token&jwt=.*/
    );
  });

  // Test: Successfully refresh the Spotify access token when a valid JWT and refresh token are provided
  it("should successfully refresh the access token with a valid JWT", async () => {
    // Generate a mock JWT token to simulate an authenticated user
    const mockJwtPayload = {
      userId: 1,
      spotify_id: "mock_spotify_id",
      email: "mockuser@example.com",
    };
    const validJwtToken = jwt.sign(mockJwtPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Mock Spotify's response for successfully refreshing the token
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: "new_mock_access_token",
        expires_in: 3600,
      },
    });

    // Make a POST request to the /auth/refresh endpoint with the JWT in the Authorization header
    const response = await request(app)
      .post("/auth/refresh")
      .set("Authorization", `Bearer ${validJwtToken}`) // Include JWT in header
      .send({ refresh_token: "VALID_FAKE_REFRESH_TOKEN" });

    // Expect a 200 status and correct response data
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      access_token: "new_mock_access_token",
      expires_in: 3600,
    });
  });

  // Test: Fail to refresh the Spotify access token when no JWT is provided
  it("should fail to refresh the access token without a JWT", async () => {
    const response = await request(app)
      .post("/auth/refresh")
      .send({ refresh_token: "VALID_FAKE_REFRESH_TOKEN" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Not authorized, no token provided");
  });

  // Test: Fail to refresh the Spotify access token when an invalid JWT is provided
  it("should fail to refresh the access token with an invalid JWT", async () => {
    const response = await request(app)
      .post("/auth/refresh")
      .set("Authorization", "Bearer INVALID_FAKE_JWT") // Send an invalid JWT
      .send({ refresh_token: "VALID_FAKE_REFRESH_TOKEN" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token verification failed");
  });
});