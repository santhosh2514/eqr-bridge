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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QRCodeCanvas } from 'qrcode.react'
import { useState } from 'react'

export function CreateQRModal({ onSubmit, groups, onCreateGroup }) {
  const [open, setOpen] = useState(false)
  const [websiteLink, setWebsiteLink] = useState('')
  const [randomLink, setRandomLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('General')
  const [newGroup, setNewGroup] = useState('')

  const generateRandomLink = () => {
    const randomString = Math.random().toString(36).substring(2, 15)
    setRandomLink(randomString)
    setQrCodeUrl(`${process.env.NEXT_PUBLIC_DOMAIN}/api/redirect/${randomString}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit(websiteLink, randomLink, selectedGroup)
    setOpen(false)
    setWebsiteLink('')
    setRandomLink('')
    setQrCodeUrl('')
    setSelectedGroup('General')
  }

  const handleCreateNewGroup = () => {
    if (newGroup && !groups.includes(newGroup)) {
      onCreateGroup(newGroup);
      setSelectedGroup(newGroup);
      setNewGroup('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold">
          Create New QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 bg-gray-50 border border-gray-200 rounded-lg shadow-md">
        <DialogHeader className="px-6 py-4 border-b bg-gray-100 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-gray-800">Create QR Code</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-6">
          {!qrCodeUrl ? (
            <Button 
              onClick={generateRandomLink}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Generate Random Link
            </Button>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center bg-white p-6 rounded-lg border border-gray-200">
                <QRCodeCanvas value={qrCodeUrl} size={200} />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Random Link:</p>
                <p className="font-mono text-sm text-gray-700">{randomLink}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Destination URL</Label>
                  <Input
                    type="url"
                    value={websiteLink}
                    onChange={(e) => setWebsiteLink(e.target.value)}
                    placeholder="Enter destination website URL"
                    required
                    className="w-full border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Group</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-full text-gray-700 border border-gray-300 bg-white">
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
                      {groups.map((group) => (
                        <SelectItem key={group} value={group} className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100">
                          {group}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="create_new_group"
                        className="text-blue-500 hover:bg-gray-100 focus:bg-gray-100"
                      >
                        + Create New Group
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedGroup === 'create_new_group' && (
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="New group name"
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        className="w-full border-gray-300"
                      />
                      <Button
                        type="button"
                        onClick={handleCreateNewGroup}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Create
                      </Button>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  Map Link
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}