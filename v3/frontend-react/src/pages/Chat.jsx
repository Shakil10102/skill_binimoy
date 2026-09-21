import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { GroupChatModal } from '../components/chat/GroupChatModal'
import { useAuth } from '../context/AuthContext'
import { useCall } from '../context/CallContext'
import { chatService } from '../services/chatService'
import { formatTimeAgo } from '../lib/dateUtils'
import {
  MessageSquare,
  Users,
  Send,
  Phone,
  Video,
  Plus,
  Sparkles
} from 'lucide-react'
import { cn } from '../lib/utils'

export function Chat() {
  const { user } = useAuth()
  const { startCall } = useCall()

  const [tab, setTab] = useState('direct') // 'direct' | 'groups'
  const [friends, setFriends] = useState([])
  const [groups, setGroups] = useState([])
  const [activeChat, setActiveChat] = useState(null) // { mode: 'direct'|'group', id, name, image }
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [groupModalOpen, setGroupModalOpen] = useState(false)

  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  // Load friends & groups on mount
  const loadSidebarData = async () => {
    try {
      const [friendsRes, groupsRes] = await Promise.allSettled([
        chatService.getFriends(),
        chatService.getGroups()
      ])

      if (friendsRes.status === 'fulfilled' && friendsRes.value?.friends) {
        setFriends(friendsRes.value.friends)
      }
      if (groupsRes.status === 'fulfilled' && groupsRes.value?.groups) {
        setGroups(groupsRes.value.groups)
      }
    } catch (err) {
      console.error('Failed to load chat contacts:', err)
    }
  }

  useEffect(() => {
    loadSidebarData()
  }, [])

  // Load messages for the currently selected chat
  const loadActiveMessages = async () => {
    if (!activeChat) return
    try {
      if (activeChat.mode === 'direct') {
        const res = await chatService.getMessages(activeChat.id)
        setMessages(res.messages || [])
      } else {
        const res = await chatService.getGroupMessages(activeChat.id)
        setMessages(res.messages || [])
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  // Poll active chat messages every 3 seconds
  useEffect(() => {
    if (!activeChat) return

    setLoadingMessages(true)
    loadActiveMessages().finally(() => setLoadingMessages(false))

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    pollIntervalRef.current = setInterval(loadActiveMessages, 3000)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [activeChat])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeChat) return

    const textToSend = inputText.trim()
    setInputText('')

    try {
      if (activeChat.mode === 'direct') {
        await chatService.sendMessage(activeChat.id, textToSend)
      } else {
        await chatService.sendGroupMessage(activeChat.id, textToSend)
      }
      loadActiveMessages()
    } catch {
      alert('Failed to send message.')
    }
  }

  const handleStartCall = (callType) => {
    if (!activeChat) return
    if (activeChat.mode === 'direct') {
      startCall({
        type: 'direct',
        callType,
        targetId: activeChat.id,
        title: `${callType === 'video' ? 'Video' : 'Audio'} Call with ${activeChat.name}`,
        partnerName: activeChat.name,
        partnerImage: activeChat.image
      })
    } else {
      startCall({
        type: 'group',
        targetId: activeChat.id,
        title: `Group Call: ${activeChat.name}`
      })
    }
  }

  return (
    <MainLayout>
      <div className="h-[calc(100vh-140px)] min-h-[500px] glass-card rounded-3xl border border-slate-800 flex overflow-hidden text-left">
        {/* Left Sidebar (Contacts & Groups) */}
        <div className="w-full sm:w-80 md:w-96 border-r border-slate-800 flex flex-col bg-slate-900/60">
          {/* Tabs header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl flex-1">
              <button
                onClick={() => setTab('direct')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                  tab === 'direct'
                    ? 'bg-[#6C63FF] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                💬 Direct
              </button>
              <button
                onClick={() => setTab('groups')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                  tab === 'groups'
                    ? 'bg-[#6C63FF] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                👥 Groups
              </button>
            </div>

            {tab === 'groups' && (
              <Button
                variant="outline"
                size="sm"
                className="px-2.5 py-1.5 rounded-xl"
                onClick={() => setGroupModalOpen(true)}
                title="Create Group"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {tab === 'direct' ? (
              friends.length > 0 ? (
                friends.map((f) => {
                  const isActive = activeChat?.mode === 'direct' && activeChat?.id === f.id
                  return (
                    <div
                      key={f.id}
                      onClick={() =>
                        setActiveChat({
                          mode: 'direct',
                          id: f.id,
                          name: f.full_name,
                          image: f.profile_image
                        })
                      }
                      className={cn(
                        'p-4 flex items-center gap-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors',
                        isActive && 'bg-[#6C63FF]/15 border-l-4 border-[#6C63FF]'
                      )}
                    >
                      <Avatar src={f.profile_image} name={f.full_name} size="md" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-white truncate">{f.full_name}</h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          Skill Exchange Partner
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No partners yet. Accept exchange requests to message directly!
                </div>
              )
            ) : groups.length > 0 ? (
              groups.map((g) => {
                const isActive = activeChat?.mode === 'group' && activeChat?.id === g.id
                return (
                  <div
                    key={g.id}
                    onClick={() =>
                      setActiveChat({
                        mode: 'group',
                        id: g.id,
                        name: g.name || g.group_name
                      })
                    }
                    className={cn(
                      'p-4 flex items-center gap-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors',
                      isActive && 'bg-[#00C2FF]/15 border-l-4 border-[#00C2FF]'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow">
                      {(g.name || g.group_name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-white truncate">
                        {g.name || g.group_name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {g.member_count ? `${g.member_count} members` : 'Group Discussion'}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No groups created yet. Click + to start a group chat.
              </div>
            )}
          </div>
        </div>

        {/* Right Active Message Thread Area */}
        <div className="flex-1 flex flex-col bg-slate-950/40">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-6 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <Avatar src={activeChat.image} name={activeChat.name} size="sm" />
                  <div>
                    <h3 className="font-bold text-sm text-white">{activeChat.name}</h3>
                    <p className="text-xs text-slate-400">
                      {activeChat.mode === 'direct' ? 'Direct Message' : 'Group Conversation'}
                    </p>
                  </div>
                </div>

                {/* Calling Buttons */}
                <div className="flex items-center gap-2">
                  {activeChat.mode === 'direct' ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStartCall('audio')}
                        className="rounded-xl"
                        title="Start Audio Call"
                      >
                        <Phone className="w-4 h-4 text-[#00C2FF]" />
                        <span className="hidden sm:inline">Audio</span>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartCall('video')}
                        className="rounded-xl"
                        title="Start Video Call"
                      >
                        <Video className="w-4 h-4" />
                        <span className="hidden sm:inline">Video</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartCall('video')}
                      className="rounded-xl"
                    >
                      <Video className="w-4 h-4" />
                      <span>Group Call</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3.5">
                {messages.length > 0 ? (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id
                    return (
                      <div
                        key={m.id}
                        className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
                      >
                        {!isMe && m.sender_name && (
                          <span className="text-[10px] text-slate-400 mb-1 ml-2">
                            {m.sender_name}
                          </span>
                        )}
                        <div
                          className={cn(
                            'max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words',
                            isMe
                              ? 'bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none'
                          )}
                        >
                          {m.message}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 px-2">
                          {formatTimeAgo(m.created_at)}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    <p>No messages yet in this conversation.</p>
                    <p className="text-xs">Say hello and start sharing ideas!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#6C63FF]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputText.trim()}
                  className="rounded-2xl px-5"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-800 shadow-inner">
                <MessageSquare className="w-8 h-8 text-[#6C63FF] opacity-60" />
              </div>
              <h3 className="text-base font-bold text-slate-300">Your Messages</h3>
              <p className="text-xs text-slate-500 max-w-xs text-center">
                Select a direct exchange partner or a group on the left to begin messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Group Creation Modal */}
      <GroupChatModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        friends={friends}
        onSuccess={() => {
          loadSidebarData()
        }}
      />
    </MainLayout>
  )
}
