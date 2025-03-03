// components/officials/OfficialInvoice.tsx
import React, { useState, useEffect } from 'react';
import { Official } from '@/utils/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Copy, Mail, Loader2, Pencil, Check } from "lucide-react";
import { toast } from "sonner"; // Import from sonner instead of shadcn/ui
import { FaPaypal } from "react-icons/fa6";

interface OfficialInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOfficial: Official | null;
  eventName: string;
  eventDate: string;
  officialStats: { 
    [id: string]: { 
      amountJudged: number; 
      amountReffed: number; 
    } 
  };
  distances: { [id: string]: number };
  refereePay: number;
  judgePay: number;
  representativePay: number;
  totalFighters: number;
  onCopyInvoice: () => void;
  onClose: () => void;
  onUpdateOfficial?: (officialId: string, updates: Partial<Official>) => Promise<void>;
}

const OfficialInvoice: React.FC<OfficialInvoiceProps> = ({
  open,
  onOpenChange,
  selectedOfficial,
  eventName,
  eventDate,
  officialStats,
  distances,
  refereePay,
  judgePay,
  representativePay,
  totalFighters,
  onCopyInvoice,
  onClose,
  onUpdateOfficial
}) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEditingPaymentId, setIsEditingPaymentId] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingField, setIsUpdatingField] = useState(false);

  useEffect(() => {
    if (selectedOfficial) {
      setPaymentId(selectedOfficial.paymentId || '');
      setEmail(selectedOfficial.email || '');
    }
  }, [selectedOfficial]);

  if (!selectedOfficial || !selectedOfficial.id) return null;

  const calculateTotalPay = () => {
    return selectedOfficial.position === 'Representative'
      ? ((totalFighters * representativePay) + (distances[selectedOfficial.id] || 0) * 0.55)
      : (
          ((officialStats[selectedOfficial.id]?.amountJudged || 0) * judgePay) +
          ((officialStats[selectedOfficial.id]?.amountReffed || 0) * refereePay) +
          ((distances[selectedOfficial.id] || 0) * 0.55)
        );
  };

  const totalPay = calculateTotalPay();
  const travelPay = (distances[selectedOfficial.id] || 0) * 0.55;

  const openPaypal = () => {
    // Use the current state value which might have been updated
    const paypalIdToUse = paymentId.replace(/^@/, '') || '';
    
    if (paypalIdToUse) {
      const paypalUrl = `https://www.paypal.com/paypalme/${paypalIdToUse}/${totalPay.toFixed(2)}`;
      window.open(paypalUrl, '_blank');
    } else {
      toast.error("No PayPal ID", {
        description: "Please add a PayPal ID before making a payment."
      });
    }
  };

  const sendInvoiceEmail = async () => {
    if (!email) {
      toast.error("No Email Address", {
        description: "Please add an email address before sending the invoice."
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      // Prepare payment details sections for the email
      const payDetails = [];
      
      if (selectedOfficial.position === 'Representative') {
        payDetails.push({
          title: "Representative Pay",
          items: [
            { label: "Pay Per Fighter", value: `$${representativePay.toFixed(2)}` },
            { label: "Total Fighters", value: totalFighters.toString() },
            { label: "Representative Pay", value: `$${(totalFighters * representativePay).toFixed(2)}` }
          ]
        });
      } else {
        if ((officialStats[selectedOfficial.id]?.amountJudged || 0) > 0) {
          payDetails.push({
            title: "Judging Details",
            items: [
              { label: "Judge Rate", value: `$${judgePay.toFixed(2)} per bout` },
              { label: "Bouts Judged", value: officialStats[selectedOfficial.id]?.amountJudged.toString() },
              { label: "Judging Pay", value: `$${(officialStats[selectedOfficial.id]?.amountJudged * judgePay).toFixed(2)}` }
            ]
          });
        }
        
        if ((officialStats[selectedOfficial.id]?.amountReffed || 0) > 0) {
          payDetails.push({
            title: "Refereeing Details",
            items: [
              { label: "Referee Rate", value: `$${refereePay.toFixed(2)} per bout` },
              { label: "Bouts Refereed", value: officialStats[selectedOfficial.id]?.amountReffed.toString() },
              { label: "Refereeing Pay", value: `$${(officialStats[selectedOfficial.id]?.amountReffed * refereePay).toFixed(2)}` }
            ]
          });
        }
      }

      const response = await fetch('/api/sendOfficialInvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email, // Use the current state value
          first: selectedOfficial.first,
          last: selectedOfficial.last,
          position: selectedOfficial.position,
          location: selectedOfficial.location,
          eventName,
          eventDate,
          totalPay,
          payDetails,
          travelDistance: distances[selectedOfficial.id] || 0,
          travelPay
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Invoice Sent", {
          description: `Invoice has been sent to ${email}`
        });
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to send invoice email"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const saveField = async (field: 'paymentId' | 'email') => {
    if (!onUpdateOfficial) {
      // If no update function provided, just update the local state
      setIsEditingPaymentId(false);
      setIsEditingEmail(false);
      return;
    }

    setIsUpdatingField(true);
    try {
      const updates: Partial<Official> = {};
      if (field === 'paymentId') {
        updates.paymentId = paymentId;
        setIsEditingPaymentId(false);
      } else {
        updates.email = email;
        setIsEditingEmail(false);
      }

      await onUpdateOfficial(selectedOfficial.id, updates);
      
      toast.success("Updated Successfully", {
        description: `Official's ${field === 'paymentId' ? 'PayPal ID' : 'email'} has been updated.`
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error("Update Failed", {
        description: `Failed to update ${field === 'paymentId' ? 'PayPal ID' : 'email'}.`
      });
    } finally {
      setIsUpdatingField(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Official Pay Details</DialogTitle>
          <DialogDescription>
            Point Muay Thai West<br />
            {eventName || 'Event'}<br />
            {eventDate || 'Date'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Name</h4>
              <p>{selectedOfficial.first} {selectedOfficial.last}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Position</h4>
              <p>{selectedOfficial.position || selectedOfficial.location || 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {selectedOfficial.position === 'Representative' ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Representative Pay</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pay Per Fighter</p>
                  <p>${representativePay.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fighters</p>
                  <p>{totalFighters}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rep Pay</p>
                  <p>${(totalFighters * representativePay).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {(officialStats[selectedOfficial.id]?.amountJudged || 0) > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Judging Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Judge Rate</p>
                      <p>${judgePay.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bouts Judged</p>
                      <p>{officialStats[selectedOfficial.id]?.amountJudged}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Judging Pay</p>
                      <p>${(officialStats[selectedOfficial.id]?.amountJudged * judgePay).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {(officialStats[selectedOfficial.id]?.amountReffed || 0) > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Refereeing Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Referee Rate</p>
                      <p>${refereePay.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bouts Refereed</p>
                      <p>{officialStats[selectedOfficial.id]?.amountReffed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Refereeing Pay</p>
                      <p>${(officialStats[selectedOfficial.id]?.amountReffed * refereePay).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {distances[selectedOfficial.id] > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Travel Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p>{distances[selectedOfficial.id]} miles</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate</p>
                  <p>$0.55/mile</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travel Pay</p>
                  <p>${travelPay.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted p-3 rounded-lg mt-2">
            <h4 className="text-sm font-medium mb-1">Total Pay</h4>
            <p className="text-2xl font-bold">
              ${totalPay.toFixed(2)}
            </p>

            {/* Editable PayPal ID field */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="paymentId">Paypal ID</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => isEditingPaymentId ? saveField('paymentId') : setIsEditingPaymentId(true)}
                  disabled={isUpdatingField}
                >
                  {isEditingPaymentId ? (
                    isUpdatingField ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="officialPaymentId"
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  readOnly={!isEditingPaymentId}
                  className={`w-full ${isEditingPaymentId ? 'border-primary' : ''}`}
                  placeholder="Enter PayPal ID or email"
                />
              </div>
            </div>

            {/* Editable Email field */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="officialEmail">Email</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => isEditingEmail ? saveField('email') : setIsEditingEmail(true)}
                  disabled={isUpdatingField}
                >
                  {isEditingEmail ? (
                    isUpdatingField ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="officialEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!isEditingEmail}
                  className={`w-full ${isEditingEmail ? 'border-primary' : ''}`}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-1 gap-3 mt-4">
              {/* PayPal Payment Button */}
              <Button 
                onClick={openPaypal} 
                className="w-full bg-[#0070ba] hover:bg-[#003087] text-white"
                disabled={!paymentId}
              >
              <FaPaypal />
                Pay with PayPal
              </Button>
              
              {/* Email Invoice Button */}
              <Button 
                onClick={sendInvoiceEmail} 
                disabled={isSendingEmail || !email}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invoice to Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={onCopyInvoice} variant="outline" className="w-full sm:w-auto">
            <Copy className="h-4 w-4 mr-2" />
            Copy Invoice
          </Button>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfficialInvoice;