// At the top, move "use client" here to separate files
"use client";

import { Fighter} from '@/utils/apiFunctions/fetchPmtResults';
 interface Props {
  fighters: Fighter[];
  completed: Fighter[];
}

export default function PageClient({ fighters, completed }: Props) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Event Results</h1>

      <h2 className="text-lg font-semibold mb-2">All Fights</h2>
      <ul className="mb-6">
        {fighters.map((f, i) => (
          <li key={i}>
            {f.first} {f.last} ({f.gym}) - Mat {f.mat}, Bout {f.bout} - Result: {f.result}
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2">Completed Bouts</h2>
      <ul>
        {completed.map((f, i) => (
          <li key={i}>
            {f.first} {f.last} - Result: {f.result}
          </li>
        ))}
      </ul>
    </div>
  );
}
