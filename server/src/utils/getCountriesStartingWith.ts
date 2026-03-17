import axios from "axios";

const COUNTRIES_API_URL = "https://api.first.org/data/v1/countries?limit=1000";

type CountryApiEntry = {
  country?: string;
};

type CountriesApiResponse = {
  data?: Record<string, CountryApiEntry | undefined>;
};

function getCountryName(entry: CountryApiEntry | undefined): string | null {
  if (!entry || typeof entry.country !== "string") {
    return null;
  }

  return entry.country;
}

export async function getCountriesStartingWith(srch: string): Promise<string[]> {
  const normalizedSearch = srch.trim().toLowerCase();
  const response = await axios.get<CountriesApiResponse>(COUNTRIES_API_URL);
  const countriesByCode = response.data?.data;

  if (!countriesByCode || typeof countriesByCode !== "object") {
    return [];
  }

  const matchingCountries: string[] = [];

  for (const countryCode in countriesByCode) {
    const countryName = getCountryName(countriesByCode[countryCode]);

    if (!countryName) {
      continue;
    }

    if (
      normalizedSearch.length === 0 ||
      countryName.toLowerCase().startsWith(normalizedSearch)
    ) {
      matchingCountries[matchingCountries.length] = countryName;
    }
  }

  return matchingCountries;
}
