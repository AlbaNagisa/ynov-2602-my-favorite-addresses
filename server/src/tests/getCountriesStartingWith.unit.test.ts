import axios from "axios";
import { getCountriesStartingWith } from "../utils/getCountriesStartingWith";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("getCountriesStartingWith", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it("returns only countries matching the search prefix (case insensitive)", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          FR: { country: "France" },
          FI: { country: "Finland" },
          ES: { country: "Spain" },
        },
      },
    } as any);

    const result = await getCountriesStartingWith("f");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.first.org/data/v1/countries?limit=1000",
    );
    expect(result).toEqual(["France", "Finland"]);
  });

  it("returns an empty array when no country matches", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          FR: { country: "France" },
          ES: { country: "Spain" },
        },
      },
    } as any);

    const result = await getCountriesStartingWith("zz");

    expect(result).toEqual([]);
  });

  it("returns all countries when search is empty", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          FR: { country: "France" },
          ES: { country: "Spain" },
          IT: { country: "Italy" },
        },
      },
    } as any);

    const result = await getCountriesStartingWith("   ");

    expect(result).toEqual(["France", "Spain", "Italy"]);
  });

  it("propagates the API error", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("network down"));

    await expect(getCountriesStartingWith("fr")).rejects.toThrow("network down");
  });
});
