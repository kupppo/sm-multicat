'use client'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { X as CloseIcon } from 'lucide-react'

export default function UserSelect({ users = [] }: { users: any[] }) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [state, setState] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const handleSubmit = async (userId: string) => {
    setState('submitting')
    try {
      // TODO: use server action to send discord dm to user
      setState('success')
    } catch (error) {
      setState('error')
    }
  }

  if (selectedUser) {
    const userData = users.find((user) => user.id === selectedUser)
    return (
      <div className="flex flex-col gap-y-8">
        <div className="flex items-center gap-4">
          <div className="text-xl">{userData.name}</div>
          <Button
            variant="outline"
            className="leading-none w-2 h-2 opacity-40"
            size="icon"
            onClick={() => setSelectedUser(null)}
          >
            <CloseIcon />
          </Button>
        </div>
        <div>
          <Button onClick={() => handleSubmit(selectedUser)}>Send login link</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[350px] flex flex-col">
      <Command className="rounded-lg border shadow-md md:min-w-[450px]">
        <CommandInput placeholder="Enter your user..." />
        <CommandList>
          <CommandEmpty>No user found.</CommandEmpty>
          <CommandGroup>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.id}
                onSelect={() => {
                  setSelectedUser(user.id)
                }}
              >
                {user.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
