// utils/gyms/logos.ts
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";
import { GymProfile } from "../types";

/**
 * Fetch all existing gym logos from Firebase Storage.
 * @returns A map of gym IDs to their logo URLs.
 */
export const fetchAllLogos = async (): Promise<Record<string, string>> => {
  try {
    const storage = getStorage(app);
    const logoDirRef = ref(storage, "gym_logos/");

    // List all items in the gym_logos directory
    const listResult = await listAll(logoDirRef);

    const logoPromises = listResult.items.map(async (item) => {
      const url = await getDownloadURL(item);
      const id = item.name.split(".")[0]; // Extract gym ID from the filename (e.g., "gymID.png" => "gymID")
      return { id, url };
    });

    // Resolve all promises and create a map of gym IDs to URLs
    const logos = await Promise.all(logoPromises);
    return logos.reduce((acc, { id, url }) => {
      acc[id] = url;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error("Error fetching gym logos:", error);
    return {};
  }
};

/**
 * Populate gym logos based on existing logos.
 * @param gyms List of gym profiles.
 * @returns Gym profiles with logos added where available.
 */
export const populateGymLogos = async (gyms: GymProfile[]): Promise<GymProfile[]> => {
    const logoMap = await fetchAllLogos(); // Fetch map of all gym logos
  
    return gyms.map((gym) => ({
      ...gym,
      logo: logoMap[gym.id] || gym.logo, // If a new logo is available, replace it; otherwise, keep the existing one
    }));
  };

/**
 * Populate logo for a single gym.
 * @param gym Single gym profile.
 * @returns Gym profile with logo added if available.
 */
export const populateSingleGymLogo = async (gym: GymProfile): Promise<GymProfile> => {
  const logoMap = await fetchAllLogos();
  return {
    ...gym,
    logo: gym.id && logoMap[gym.id] ? logoMap[gym.id] : "",
  };
};
