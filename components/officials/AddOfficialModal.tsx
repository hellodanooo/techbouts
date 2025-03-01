// components/officials/AddOfficialModal.tsx
'use client';
import React, { useState } from 'react';
import { Official } from '@/utils/types';
import PhotoUpload from './PhotoUpload';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

interface AddOfficialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newOfficial: Official) => void;
}

export default function AddOfficialModal({ isOpen, onClose, onSave }: AddOfficialModalProps) {
  const [tempId, setTempId] = useState<string>(`temp_${Date.now()}`);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const [newOfficial, setNewOfficial] = useState<Partial<Official>>({
    first: '',
    last: '',
    city: '',
    state: '',
    position: 'Pending',
    phone: '',
    email: '',
    facebookUrl: '',
    judgedBefore: false,
    location: '',
    mat: 0,
    muayThaiExperience: '',
    official_id: '',
    payment: '',
    paymentId: '',
    paymentType: '',
    photo: '',
  });

  // Add the missing function to handle photo upload success
  const handlePhotoUploadSuccess = (downloadUrl: string) => {
    setNewOfficial(prev => ({
      ...prev,
      photo: downloadUrl
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOfficial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePositionChange = (value: string) => {
    setNewOfficial(prev => ({
      ...prev,
      position: value
    }));
  };

  const handleJudgedBeforeChange = (value: string) => {
    setNewOfficial(prev => ({
      ...prev,
      judgedBefore: value === "true"
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a unique ID
    const id = `${newOfficial.first}${newOfficial.last}${Date.now()}`;
    const officialId = id;
    
    // Create complete official object
    const completeOfficial: Official = {
      ...newOfficial as Official,
      id,
      officialId
    };
    
    onSave(completeOfficial);
    
    // Reset form
    setNewOfficial({
      first: '',
      last: '',
      city: '',
      state: '',
      position: 'Pending',
      phone: '',
      email: '',
      facebookUrl: '',
      judgedBefore: false,
      location: '',
      mat: 0,
      muayThaiExperience: '',
      official_id: '',
      payment: '',
      paymentId: '',
      paymentType: '',
      photo: '',
    });
    
    // Generate new temp ID for next official
    setTempId(`temp_${Date.now()}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Official</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first">First Name *</Label>
              <Input
                id="first"
                name="first"
                value={newOfficial.first}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last">Last Name *</Label>
              <Input
                id="last"
                name="last"
                value={newOfficial.last}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={newOfficial.city}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                value={newOfficial.state}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select 
                value={newOfficial.position} 
                onValueChange={handlePositionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Judge">Judge</SelectItem>
                  <SelectItem value="Referee">Referee</SelectItem>
                  <SelectItem value="Timekeeper">Timekeeper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={newOfficial.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newOfficial.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook/Instagram URL</Label>
              <Input
                id="facebookUrl"
                name="facebookUrl"
                value={newOfficial.facebookUrl}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Have you judged before?</Label>
              <RadioGroup 
                defaultValue={newOfficial.judgedBefore ? "true" : "false"} 
                onValueChange={handleJudgedBeforeChange}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="judged-yes" />
                  <Label htmlFor="judged-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="judged-no" />
                  <Label htmlFor="judged-no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="muayThaiExperience">Muay Thai Experience</Label>
              <Textarea
                id="muayThaiExperience"
                name="muayThaiExperience"
                value={newOfficial.muayThaiExperience}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewOfficial(prev => ({...prev, muayThaiExperience: e.target.value}))}

                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentId">Paypal email</Label>
              <Input
                id="paymentId"
                name="paymentId"
                value={newOfficial.paymentId}
                onChange={handleChange}
                placeholder="PayPal Email"
              />
            </div>

            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                {newOfficial.photo ? (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={newOfficial.photo} alt="Official" />
                    <AvatarFallback>
                      {newOfficial.first?.charAt(0) || ''}
                      {newOfficial.last?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No photo</span>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Official
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Photo Upload Modal - Keep as is, can be updated separately */}
      <PhotoUpload
        officialId={tempId}
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSuccess={handlePhotoUploadSuccess}
      />
    </Dialog>
  );
}