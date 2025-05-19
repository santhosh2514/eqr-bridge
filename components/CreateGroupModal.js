import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react'
import { put } from '@vercel/blob'
import { Plus } from 'lucide-react'

export function CreateGroupModal({ onSubmit }) {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!groupName) return

    setIsUploading(true)
    let imageUrl = null

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        imageUrl = data.url;
      } catch (error) {
        console.error('Error uploading image:', error);
        setIsUploading(false);
        return;
      }
    }

    await onSubmit(groupName, imageUrl)
    setOpen(false)
    setGroupName('')
    setImageFile(null)
    setIsUploading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 bg-gray-50 border border-gray-200 rounded-lg shadow-md">
        <DialogHeader className="px-6 py-4 border-b bg-gray-100 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-gray-800">Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Group Name</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
              className="w-full border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Group Image (Optional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer border-gray-300"
            />
            {imageFile && (
              <div className="mt-2 bg-white p-4 rounded-lg border border-gray-200">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={isUploading} 
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {isUploading ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 