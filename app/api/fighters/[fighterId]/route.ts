import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../../../utils/firebase";

interface Bout {
  result: string; // e.g., "W", "L", etc.
  opponentName: string;
  date: string;
  promotionName: string;
  sanctioningBody: string;
}

interface Fighter {
  fighter_id: string;
  first: string;
  last: string;
  weightclass: string;
  gym: string;
  age: number;
  gender: string;
  win: number; // Default to 0
  loss: number; // Default to 0
  city: string;
  state: string;
  photo: string;
  bouts: Bout[]; // Default to an empty array
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fighterId: string }> }
  ) {
    const { fighterId } = await params;

  if (!fighterId) {
    return NextResponse.json({ error: "Fighter ID is required" }, { status: 400 });
  }

  try {
    const fightersRef = collection(db, "fighters_database");
    const fightersSnapshot = await getDocs(fightersRef);

    // Default value for fighter
    let fighter: Fighter = {
      fighter_id: "",
      first: "",
      last: "",
      weightclass: "",
      gym: "",
      age: 0,
      gender: "",
      win: 0,
      loss: 0,
      city: "",
      state: "",
      photo: "",
      bouts: [], // Default to an empty array
    };

    // Search for the fighter in the database
    fightersSnapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      if (Array.isArray(data.fighters)) {
        const foundFighter = data.fighters.find(
          (f: Fighter) => f.fighter_id === fighterId
        );
        if (foundFighter) {
          fighter = { ...foundFighter }; // Overwrite with actual data
        }
      }
    });

    if (fighter.fighter_id === "") {
      return NextResponse.json({ error: "Fighter not found" }, { status: 404 });
    }

    // Ensure `fighter.bouts` is always an array
    const bouts: Bout[] = fighter.bouts || [];
    const winCount = bouts.filter((bout) => bout.result === "W").length;
    const lossCount = bouts.filter((bout) => bout.result === "L").length;

    // Return the response with calculated `win` and `loss`
    return NextResponse.json(
      { ...fighter, win: winCount, loss: lossCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching fighter:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
