import { NextResponse } from "next/server";

export const fetchCache = "force-cache";

interface Country {
  name: string;
  capital: string;
  code: string;
}

interface RawCountry {
  name: { common: string };
  capital?: string[];
  cca2?: string; // ISO 3166-1 alpha-2 country code
}

export async function GET() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all");

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.statusText}`);
    }

    const rawData: unknown = await response.json();

    if (!Array.isArray(rawData)) {
      throw new Error("Unexpected API response format. Expected an array.");
    }

    const countries: Country[] = parseCountries(rawData as RawCountry[]);

    return NextResponse.json(countries);
  } catch (error) {
    console.error("Error in GET /api/countries:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to parse and validate raw country data
 */
function parseCountries(data: RawCountry[]): Country[] {
  return data
    .map((country) => {
      const name = country.name?.common ?? "";
      const capital =
        Array.isArray(country.capital) && country.capital.length > 0
          ? country.capital[0]
          : "";
      const code = country.cca2 ?? "";

      return name && capital && code ? { name, capital, code } : null;
    })
    .filter((country): country is Country => country !== null);
}
