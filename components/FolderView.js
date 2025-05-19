import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import { ChevronRight, Edit, Folder, FolderOpen, Globe, Link as LinkIcon, Plus, Save, X, Trash2 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState, useEffect } from 'react'

export default function FolderView({ mappings, groups, onUpdate, onDeleteGroup }) {
  const [selectedQR, setSelectedQR] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editingUrl, setEditingUrl] = useState("")
  const [groupImages, setGroupImages] = useState({})
  const [expandedGroups, setExpandedGroups] = useState(
    groups.reduce((acc, group) => ({ ...acc, [group]: false }), {})
  )

  const qrCodeRefs = useRef({})

  useEffect(() => {
    // Fetch group images
    const fetchGroupImages = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('name, image_url')
      
      if (!error && data) {
        const images = {}
        data.forEach(group => {
          if (group.image_url) {
            images[group.name] = group.image_url
          }
        })
        setGroupImages(images)
      }
    }

    fetchGroupImages()
  }, [])

  const handleEdit = (mapping) => {
    setEditingId(mapping.id);
    setEditingUrl(mapping.website_link);
  }

  const handleSave = async (id) => {
    const { error } = await supabase
      .from('mappings')
      .update({ website_link: editingUrl })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      onUpdate();
    }
  }

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('mappings')
      .delete()
      .eq('id', id)

    if (!error) {
      onUpdate()
    }
  }

  const downloadQRCode = (row) => {
    if (!row) return;
    const qrCodeNode = qrCodeRefs.current[row.id];
    if (qrCodeNode) {
      qrCodeNode.toBlob((blob) => {
        saveAs(blob, `eqr-bridge-qr-${row.random_link}.png`);
      });
    }
  };

  const downloadQRCodePDF = (row) => {
    if (!row) return;
    const qrCodeNode = qrCodeRefs.current[row.id];
    if (qrCodeNode) {
      const imgData = qrCodeNode.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 190);
      pdf.save(`eqr-bridge-qr-${row.random_link}.pdf`);
    }
  };

  const filteredMappings = mappings.filter(mapping => 
    mapping.random_link.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.website_link.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedMappings = groups.reduce((acc, group) => {
    acc[group] = filteredMappings.filter(mapping => mapping.group_name === group);
    return acc;
  }, {});

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  const handleDeleteGroup = async (groupName) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}" and all its QR codes?`)) {
      await onDeleteGroup(groupName)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search QR codes..."
            className="pl-10 w-full"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {groups.map(group => {
          const isExpanded = expandedGroups[group];
          const items = groupedMappings[group] || [];
          return (
            <div 
              key={group} 
              className={`transition-all duration-200 ${
                isExpanded ? 'bg-gradient-to-r from-blue-50/80 to-white' : ''
              }`}
            >
              <div
                onClick={() => toggleGroup(group)}
                className={`w-full px-6 py-4 flex items-center gap-3 hover:bg-blue-50/50 focus:outline-none border-b cursor-pointer ${
                  isExpanded 
                    ? 'bg-blue-100/50 border-blue-200/50 shadow-sm' 
                    : 'border-gray-100 hover:border-blue-100'
                }`}
              >
                <ChevronRight 
                  className={`h-5 w-5 transition-all duration-200 ${
                    isExpanded ? 'rotate-90 text-blue-500' : 'text-gray-400'
                  }`}
                />
                <div className="flex items-center gap-4 flex-1">
                  {isExpanded ? (
                    <FolderOpen className="h-6 w-6 text-blue-500" />
                  ) : (
                    <Folder className="h-6 w-6 text-blue-400" />
                  )}
                  <span className={`font-medium text-base ${
                    isExpanded ? 'text-blue-700' : 'text-gray-700'
                  }`}>{group}</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    isExpanded 
                      ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGroup(group)
                    }}
                    className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y divide-blue-100/50">
                  {items.length > 0 ? (
                    <div className="py-2 space-y-px">
                      {items.map(mapping => (
                        <div 
                          key={mapping.id} 
                          className="group/item relative mx-3 rounded-xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover/item:from-blue-50/50 group-hover/item:to-transparent transition-all duration-200" />
                          <div className="relative px-10 py-4 flex items-center gap-8">
                            <div className="flex items-center gap-4 w-80">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/item:border-blue-200 transition-colors">
                                <LinkIcon className="h-5 w-5 text-gray-400 group-hover/item:text-blue-500 transition-colors" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm text-gray-900 font-medium">
                                  {mapping.random_link}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  QR Link
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/item:border-green-200 transition-colors">
                                <Globe className="h-5 w-5 text-gray-400 group-hover/item:text-green-500 transition-colors" />
                              </div>                              <div className="flex flex-col flex-1 min-w-0">
                                {editingId === mapping.id ? (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="url"
                                      value={editingUrl}
                                      onChange={(e) => setEditingUrl(e.target.value)}
                                      className="min-w-[300px]"
                                    />
                                    <Button size="sm" variant="ghost" className="text-green-500" onClick={() => handleSave(mapping.id)}>
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setEditingId(null)}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={mapping.website_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-gray-900 hover:text-blue-600 truncate transition-colors font-medium"
                                    >
                                      {mapping.website_link}
                                    </a>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 hover:bg-blue-50"
                                      onClick={() => handleEdit(mapping)}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-gray-500 hover:text-blue-600" />
                                    </Button>
                                  </div>
                                )}
                                <span className="text-xs text-gray-500 mt-1">
                                  Destination URL
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedQR(mapping)}
                                className="relative px-6 h-10 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-medium"
                              >
                                View QR
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(mapping.id)}
                                className="h-10 w-10 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-11 py-12 text-center">
                      <div className="max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                          <Plus className="h-7 w-7 text-blue-400" />
                        </div>
                        <p className="text-base font-medium text-gray-700 mb-2">Empty Folder</p>
                        <p className="text-sm text-gray-500">
                          No QR codes have been added to this folder yet
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="bg-gray-100">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div className="flex flex-col items-center">
              <QRCodeCanvas
                value={`${process.env.NEXT_PUBLIC_DOMAIN}/api/redirect/${selectedQR.random_link}`}
                size={256}
                level="H"
                imageSettings={{
                  src: groupImages[selectedQR.group_name] || `${process.env.NEXT_PUBLIC_DOMAIN}/logo.png`,
                  height: 100,
                  width: 100,
                  excavate: true,
                  crossOrigin: "anonymous"
                }}
                ref={(el) => (qrCodeRefs.current[selectedQR.id] = el)}
              />
              <div className="flex flex-col items-center mt-4 space-y-4 w-full">
                <div className="bg-gray-200 w-full p-3 rounded-md text-center">
                  <p className="text-sm font-mono text-gray-600 truncate">
                    {`${process.env.NEXT_PUBLIC_DOMAIN}/api/redirect/${selectedQR.random_link}`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => downloadQRCode(selectedQR)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Download PNG
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadQRCodePDF(selectedQR)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
