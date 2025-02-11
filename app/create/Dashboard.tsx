// app/create/Dashboard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import AddEventForm from '@/components/AddEventForm';
import AddPromoter from '@/components/AddPromoter'; 
import { Promoter } from '@/utils/types'; 

interface DashboardProps {
    promoters: Promoter[];
}

interface FormattedPromoter {
    promoterId: string;
    name: string;
    email: string;
    promotion: string;
    sanctioning: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ promoters }) => {
    const [showEventModal, setShowEventModal] = useState(false);
    const [showPromoterModal, setShowPromoterModal] = useState(false);

    // Format promoters data to match AddEventForm expectations
    const formattedPromoters: FormattedPromoter[] = useMemo(() => {
        return promoters.map(promoter => ({
            promoterId: promoter.promoterId,
            name: `${promoter.firstName} ${promoter.lastName}`,
            email: promoter.email,
            promotion: promoter.promotion,
            sanctioning: promoter.sanctioning // Keep as string[]
        }));
    }, [promoters]);

    const openAddPromoter = () => {
        setShowEventModal(false);
        setShowPromoterModal(true);
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Create Event</h1>
            <button
                onClick={() => setShowEventModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Create Event
            </button>

            {showEventModal && (
                <AddEventForm
                    onClose={() => setShowEventModal(false)}
                    onOpenAddPromoter={openAddPromoter}
                    promoters={formattedPromoters}
                />
            )}

            {showPromoterModal && (
                <AddPromoter
                    onClose={() => setShowPromoterModal(false)}
                    promoters={promoters}
                />
            )}
        </div>
    );
};

export default Dashboard;