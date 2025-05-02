import { NextResponse } from 'next/server';
import { refundPayment } from '@/utils/stripeHelperPmt';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentIntentId } = body;

        const refund = await refundPayment(paymentIntentId);
        return NextResponse.json(refund, { status: 200 });
    } catch (error: unknown) {
        const message = (error as Error).message;
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export const config = {
    runtime: 'edge', // Optional: Use 'nodejs' if you need Node.js APIs
};
