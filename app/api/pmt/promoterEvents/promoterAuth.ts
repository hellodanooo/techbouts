// app/api/pmt/promoterEvents/promoterAuth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PromoterType } from '../../../../utils/types';

const PROMOTER_PASSWORDS: Record<PromoterType, string> = {
  legends: 'legends2025',
  shadowpack: 'shadowpack2025',
  genx: 'genx2025',
  antdawgs: 'antdawgs2025',
  santacruz: 'santacruz2025',
  borntowin: 'borntowin2025',
  ultamatefitness: 'ultamatefitness2025',
  iyarin: 'iyarin2025',
  techbouts:'techbouts2025',
  voodoo: 'voodoo2025',
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { promoterId, password } = req.body;

  if (!promoterId || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!PROMOTER_PASSWORDS[promoterId as PromoterType]) {
    return res.status(404).json({ message: 'Promoter not found' });
  }

  const isValid = PROMOTER_PASSWORDS[promoterId as PromoterType] === password;

  if (isValid) {
    return res.status(200).json({ verified: true });
  } else {
    return res.status(401).json({ verified: false });
  }
}