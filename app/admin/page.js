'use client'

import { CreateQRModal } from '@/components/CreateQRModal'
import MappingTable from '@/components/MappingTable'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [mappings, setMappings] = useState([])
  const [groups, setGroups] = useState(['General', 'Marketing', 'Products'])

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
        <h1 className="text-2xl font-bold text-gray-800">QR Code Admin Panel</h1>
        <CreateQRModal onSubmit={handleMappingSubmit} groups={groups} onCreateGroup={handleGroupCreate} />
      </div>
      <MappingTable mappings={mappings} onUpdate={fetchMappings} groups={groups} setGroups={setGroups} />
    </div>
  )
}