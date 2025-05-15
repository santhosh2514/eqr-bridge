'use client'

import { CreateQRModal } from '@/components/CreateQRModal'
import FolderView from '@/components/FolderView'
import MappingTable from '@/components/MappingTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [mappings, setMappings] = useState([])
  const [groups, setGroups] = useState(['General', 'Marketing', 'Products'])
  const [activeView, setActiveView] = useState('folder')

  useEffect(() => {
    fetchMappings()
  }, [])

  const fetchMappings = async () => {
    const { data, error } = await supabase
      .from('mappings')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMappings(data)
    }
  }

  const handleMappingSubmit = async (websiteLink, randomLink, groupName) => {
    const { error } = await supabase
      .from('mappings')
      .insert([{
        random_link: randomLink,
        website_link: websiteLink,
        group_name: groupName
      }])

    if (!error) {
      fetchMappings()
    }
  }

  const handleGroupCreate = (newGroup) => {
    if (newGroup && !groups.includes(newGroup)) {
      setGroups([...groups, newGroup]);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">e-QR Bridge Admin Panel</h1>
        <CreateQRModal onSubmit={handleMappingSubmit} groups={groups} onCreateGroup={handleGroupCreate} />
      </div>      <Tabs defaultValue="folder" className="space-y-4">
        <TabsList className="bg-white border-0 p-1 shadow-sm rounded-lg">
          <TabsTrigger 
            value="folder" 
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-blue-50 data-[state=active]:shadow px-6 rounded-md transition-all duration-200"
          >
            Folder View
          </TabsTrigger>
          <TabsTrigger 
            value="table" 
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-blue-50 data-[state=active]:shadow px-6 rounded-md transition-all duration-200"
          >
            Table View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-0">
          <MappingTable mappings={mappings} onUpdate={fetchMappings} groups={groups} setGroups={setGroups} />
        </TabsContent>
        <TabsContent value="folder" className="mt-0">
          <FolderView mappings={mappings} groups={groups} onUpdate={fetchMappings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}