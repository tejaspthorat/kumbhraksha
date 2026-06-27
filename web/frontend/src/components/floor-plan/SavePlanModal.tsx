'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFloorPlanStore } from '@/lib/floorPlanStore';

interface SavePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavePlanModal({ isOpen, onClose }: SavePlanModalProps) {
  const { currentPlanId, saveToDatabase, isSaving } = useFloorPlanStore();
  const [formData, setFormData] = useState({
    id: '',
    name: 'My Floor Plan',
    description: '',
  });

  // Reset/populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: currentPlanId || '',
        name: 'My Floor Plan', // Could eventually fetch current name if loading existing
        description: '',
      });
    }
  }, [isOpen, currentPlanId]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Plan name is required');
      return;
    }

    await saveToDatabase({
      id: formData.id.trim() || undefined,
      name: formData.name.trim(),
      description: formData.description.trim(),
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#0a1520] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Save Floor Plan Schema</DialogTitle>
          <DialogDescription className="text-white/50 text-xs">
            Enter the details for this floor plan configuration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plan-id" className="text-right text-xs text-white/60">
              Plan ID
            </Label>
            <Input
              id="plan-id"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="Auto-generated if empty"
              className="col-span-3 h-8 bg-white/5 border-white/10 text-xs"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plan-name" className="text-right text-xs text-white/60">
              Name *
            </Label>
            <Input
              id="plan-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="col-span-3 h-8 bg-white/5 border-white/10 text-xs"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="plan-desc" className="text-right text-xs mt-2 text-white/60">
              Description
            </Label>
            <Textarea
              id="plan-desc"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional plan description..."
              className="col-span-3 bg-white/5 border-white/10 text-xs min-h-[100px] resize-none"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-xs h-8 text-white/60 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs h-8 bg-accent hover:bg-accent/90 text-white px-6"
          >
            {isSaving ? 'Saving...' : 'Confirm Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
