'use client'

import { CreateQRModal } from '@/components/CreateQRModal'
import { CreateGroupModal } from '@/components/CreateGroupModal'
import FolderView from '@/components/FolderView'
import MappingTable from '@/components/MappingTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [mappings, setMappings] = useState([])
  const [groups, setGroups] = useState([])
  const [activeView, setActiveView] = useState('folder')

  useEffect(() => {
    fetchMappings()
    fetchGroups()
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

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true })

    if (!error && data) {
      setGroups(data.map(group => group.name))
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

  const handleGroupCreate = async (groupName, imageUrl) => {
    const { error } = await supabase
      .from('groups')
      .insert([{
        name: groupName,
        image_url: imageUrl
      }])

    if (!error) {
      fetchGroups()
    }
  }

  const handleGroupDelete = async (groupName) => {
    // First delete all mappings in the group
    const { error: mappingsError } = await supabase
      .from('mappings')
      .delete()
      .eq('group_name', groupName)

    if (mappingsError) {
      console.error('Error deleting mappings:', mappingsError)
      return
    }

    // Then delete the group
    const { error: groupError } = await supabase
      .from('groups')
      .delete()
      .eq('name', groupName)

    if (!groupError) {
      fetchGroups()
      fetchMappings()
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">e-QR Bridge Admin Panel</h1>
        <div className="flex items-center gap-4">
          <CreateGroupModal onSubmit={handleGroupCreate} />
          <CreateQRModal onSubmit={handleMappingSubmit} groups={groups} onCreateGroup={handleGroupCreate} />
        </div>
      </div>
      <Tabs defaultValue="folder" className="space-y-4">
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
          <MappingTable 
            mappings={mappings} 
            onUpdate={fetchMappings} 
            groups={groups} 
            setGroups={setGroups}
            onDeleteGroup={handleGroupDelete}
          />
        </TabsContent>
        <TabsContent value="folder" className="mt-0">
          <FolderView 
            mappings={mappings} 
            groups={groups} 
            onUpdate={fetchMappings}
            onDeleteGroup={handleGroupDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}