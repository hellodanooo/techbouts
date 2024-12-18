import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../utils/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { fighterId: string } }
) {
  const { fighterId } = params;

  if (!fighterId) {
    return NextResponse.json({ error: "Fighter ID is required" }, { status: 400 });
  }

  try {
    const fightersRef = collection(db, "fighters_database");
    const fightersSnapshot = await getDocs(fightersRef);

    let fighter: any = null;

    // Search for the fighter in the database
    fightersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fighters) {
        const foundFighter = data.fighters.find((f: any) => f.fighter_id === fighterId);
        if (foundFighter) {
          fighter = { ...foundFighter }; // Copy the fighter object
        }
      }
    });

    if (!fighter) {
      return NextResponse.json({ error: "Fighter not found" }, { status: 404 });
    }

    // Calculate wins and losses from the bouts array
    const bouts = fighter.bouts || [];
    fighter.win = bouts.filter((bout: any) => bout.result === "W").length;
    fighter.loss = bouts.filter((bout: any) => bout.result === "L").length;

    return NextResponse.json(fighter, { status: 200 });
  } catch (error) {
    console.error("Error fetching fighter:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
