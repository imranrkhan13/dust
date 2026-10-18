import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequest = vi.hoisted(() => vi.fn());

vi.mock("octokit", () => ({
  Octokit: class Octokit {
    request = mockRequest;
  },
  RequestError: class RequestError extends Error {},
}));

vi.mock("@connectors/lib/oauth", () => ({
  getOAuthConnectionAccessTokenWithThrow: vi.fn(async () => ({
    access_token: "test-token",
  })),
}));

import { getRepo, getReposPage } from "./github_api";

const fakeConnector = { connectionId: "conn-123", useProxy: false } as never;

const baseRepoPayload = {
  id: 42,
  name: "dust",
  private: false,
  html_url: "https://github.com/dust-tt/dust",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  description: "Agents",
  owner: { id: 7, login: "dust-tt" },
};

describe("github_api repository mapping", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("getReposPage includes repository topics", async () => {
    mockRequest.mockResolvedValueOnce({
      data: {
        repositories: [{ ...baseRepoPayload, topics: ["ai", "agents"] }],
      },
    });

    const res = await getReposPage(fakeConnector, 1);

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toHaveLength(1);
      expect(res.value[0]?.topics).toEqual(["ai", "agents"]);
    }
  });

  it("getReposPage defaults topics to [] when the API omits them", async () => {
    mockRequest.mockResolvedValueOnce({
      data: { repositories: [{ ...baseRepoPayload }] },
    });

    const res = await getReposPage(fakeConnector, 1);

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value[0]?.topics).toEqual([]);
    }
  });

  it("getRepo defaults topics to [] when the API omits them", async () => {
    mockRequest.mockResolvedValueOnce({
      data: { ...baseRepoPayload },
    });

    const res = await getRepo(fakeConnector, 42);

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.topics).toEqual([]);
    }
  });

  it("getRepo includes repository topics", async () => {
    mockRequest.mockResolvedValueOnce({
      data: { ...baseRepoPayload, topics: ["typescript"] },
    });

    const res = await getRepo(fakeConnector, 42);

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.topics).toEqual(["typescript"]);
      expect(res.value.name).toBe("dust");
    }
  });
});
