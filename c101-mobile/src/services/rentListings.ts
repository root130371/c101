import { supabase } from "../lib/supabase";
import { safeNumber } from "./rentCalculator";

export type RentListing = {
  address: string | null;
  building_age: number | null;
  city: string;
  created_at: string;
  district: string;
  id: string;
  neighborhood: string | null;
  proof: string | null;
  rent: number;
  size: number | null;
  source: string | null;
  title: string;
};

export async function loadRentListings() {
  const { data, error } = await supabase
    .from("rent_listings")
    .select("id,title,rent,size,building_age,city,district,neighborhood,address,source,proof,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);
  return (data || []).map((item) => ({
    ...item,
    rent: safeNumber(item.rent),
    size: item.size === null ? null : safeNumber(item.size),
    building_age: item.building_age === null ? null : safeNumber(item.building_age),
  })) as RentListing[];
}

export function medianRent(listings: RentListing[]) {
  const values = listings
    .map((item) => safeNumber(item.rent))
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  if (!values.length) return 0;
  return values[Math.floor(values.length / 2)];
}

export function rentPerSquareMeter(listing: RentListing) {
  const rent = safeNumber(listing.rent);
  const size = safeNumber(listing.size);
  return size > 0 ? Math.round(rent / size) : 0;
}

export function marketComparison(rent: number, median: number) {
  if (!median) return "No market baseline yet";
  const delta = rent - median;
  if (Math.abs(delta) <= median * 0.08) return "Near local median";
  return delta > 0 ? "Above local median" : "Below local median";
}
