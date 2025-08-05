import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateWorkforceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    emailDomain: string;
    emailProvider: string;
    emailSettings: any;
  }) => void;
  isLoading?: boolean;
}

export default function CreateWorkforceDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateWorkforceDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [emailProvider, setEmailProvider] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !emailDomain || !emailProvider) {
      return;
    }

    onSubmit({
      name,
      description,
      emailDomain,
      emailProvider,
      emailSettings: {}, // Can be expanded for provider-specific settings
    });

    // Reset form
    setName("");
    setDescription("");
    setEmailDomain("");
    setEmailProvider("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-slate-100">Create New Workforce</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              Set up a new workforce organization with email integration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-900 dark:text-slate-100">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Engineering Team"
                className="col-span-3 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-gray-900 dark:text-slate-100">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the workforce..."
                className="col-span-3 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emailDomain" className="text-right text-gray-900 dark:text-slate-100">
                Email Domain
              </Label>
              <Input
                id="emailDomain"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                placeholder="@company.com"
                className="col-span-3 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emailProvider" className="text-right text-gray-900 dark:text-slate-100">
                Email Provider
              </Label>
              <Select value={emailProvider} onValueChange={setEmailProvider} required>
                <SelectTrigger className="col-span-3 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
                  <SelectValue placeholder="Select email provider" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                  <SelectItem value="microsoft" className="text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700">Microsoft Office 365</SelectItem>
                  <SelectItem value="google" className="text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700">Google Workspace</SelectItem>
                  <SelectItem value="godaddy" className="text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700">GoDaddy Email</SelectItem>
                  <SelectItem value="other" className="text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name || !emailDomain || !emailProvider} className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white">
              {isLoading ? "Creating..." : "Create Workforce"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}