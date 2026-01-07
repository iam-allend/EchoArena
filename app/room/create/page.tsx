'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function CreateRoomPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [creating, setCreating] = useState(false)
  const [maxStages, setMaxStages] = useState(10)

  async function handleCreateRoom() {
    setCreating(true)

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxStages }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      // Redirect to room lobby
      router.push(`/room/${data.room.id}`)
    } catch (error: any) {
      console.error('Create room error:', error)
      alert(error.message || 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create Room</CardTitle>
            <CardDescription>
              Set up a new game room and invite your friends!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Room Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stages">Number of Stages</Label>
                <div className="flex gap-4">
                  {[5, 10, 15].map((num) => (
                    <Button
                      key={num}
                      variant={maxStages === num ? 'default' : 'outline'}
                      onClick={() => setMaxStages(num)}
                      className="flex-1"
                    >
                      {num} Stages
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Each stage = all players answer 1 question
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Room Info:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Max players: 8</li>
                  <li>• Each player starts with 3 lives ❤️❤️❤️</li>
                  <li>• Turn-based: players take turns answering</li>
                  <li>• Voice chat enabled automatically</li>
                </ul>
              </div>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Room...
                </>
              ) : (
                <>
                  🎮 Create Room
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}