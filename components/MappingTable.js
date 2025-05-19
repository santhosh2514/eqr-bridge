import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { supabase } from '@/lib/supabaseClient'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import { Edit, Save, X, Trash2 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'

// Import the logo image
export default function MappingTable({ mappings, onUpdate, groups, setGroups, onDeleteGroup }) {
  const [editingId, setEditingId] = useState(null)
  const [editingUrl, setEditingUrl] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [columnSearch, setColumnSearch] = useState('')
  const [selectedQR, setSelectedQR] = useState(null)
  const [groupImages, setGroupImages] = useState({})
  const qrCodeRefs = useRef({});

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

  useEffect(() => {
    // Ensure qrCodeRefs.current is initialized for all mappings
    mappings.forEach(mapping => {
      if (!qrCodeRefs.current[mapping.id]) {
        qrCodeRefs.current[mapping.id] = null;
      }
    });
  }, [mappings]);

  const handleEdit = (mapping) => {
    setEditingId(mapping.id)
    setEditingUrl(mapping.website_link)
  }

  const handleSave = async (id) => {
    const { error } = await supabase
      .from('mappings')
      .update({ website_link: editingUrl })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      onUpdate()
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

  const handleDeleteGroup = async (groupName) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}" and all its QR codes?`)) {
      await onDeleteGroup(groupName)
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

  const columns = [
    {
      accessorKey: 'random_link',
      header: 'Random Link',
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_DOMAIN}/api/redirect/${row.original.random_link}`
          }}
        >
          {row.original.random_link}
        </Button>
      ),
    },
    {
      accessorKey: 'website_link',
      header: 'Website Link',
      cell: ({ row }) => {
        const mapping = row.original
        return editingId === mapping.id ? (
          <div className="flex items-center space-x-2">
            <Input
              type="url"
              value={editingUrl}
              onChange={(e) => setEditingUrl(e.target.value)}
              className="min-w-[300px]"
            />
            <Button size="sm" variant="ghost" className="text-green-500" onClick={() => handleSave(mapping.id)}>
              <Save className="h-4 w-4 mr-2" />
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setEditingId(null)}>
              <X className="h-4 w-4 mr-2" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div>{mapping.website_link}</div>
            <Button size="sm" variant="ghost" onClick={() => handleEdit(mapping)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'group_name',
      header: 'Group',
      cell: ({ row }) => {
        const mapping = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[120px] justify-start text-gray-700">
                {mapping.group_name || 'Select Group'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-200 shadow-md rounded-md">
              <DropdownMenuLabel className="text-sm font-medium text-gray-700">Select Group</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-300" />
              {groups.map((group) => (
                <DropdownMenuItem
                  key={group}
                  onClick={async () => {
                    const { error } = await supabase
                      .from('mappings')
                      .update({ group_name: group })
                      .eq('id', mapping.id)
                    if (!error) onUpdate()
                  }}
                  className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                >
                  {group}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-gray-300" />
              {mapping.group_name && (
                <>
                  <DropdownMenuSeparator className="bg-gray-300" />
                  <DropdownMenuItem
                    onClick={() => handleDeleteGroup(mapping.group_name)}
                    className="text-red-500 hover:bg-red-50 focus:bg-red-50"
                  >
                    Delete Group
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setSelectedQR(row.original)}>
            View QR
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: mappings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: columnSearch,
    },
    onGlobalFilterChange: setColumnSearch,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={groupFilter} onValueChange={(value) => {
          setGroupFilter(value)
          table.setGlobalFilter(value === 'all' ? "" : value)
        }}>
          <SelectTrigger className="w-[200px] text-gray-700 border border-gray-300 bg-white">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
            <SelectItem value="all" className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group} value={group} className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100">
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={columnSearch}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          placeholder="Search links..."
          className="w-[300px]"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
              <div className="flex mt-2 space-x-2">
                <Button size="sm" onClick={() => downloadQRCode(selectedQR)}>
                  Download PNG
                </Button>
                <Button size="sm" onClick={() => downloadQRCodePDF(selectedQR)}>
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}