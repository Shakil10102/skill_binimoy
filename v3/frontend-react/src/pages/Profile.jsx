import React, { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/profileService'
import { Camera, Edit2, Plus, Star, GraduationCap, BookOpen } from 'lucide-react'

export function Profile() {
  const { user, refreshProfile, updateUserData } = useAuth()
  const [profile, setProfile] = useState(user || {})
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState(user?.full_name || '')
  const [editBio, setEditBio] = useState(user?.bio || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Add Skill Modal
  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillType, setNewSkillType] = useState('teach') // 'teach' | 'learn'
  const [savingSkill, setSavingSkill] = useState(false)

  const loadData = async () => {
    try {
      const data = await profileService.getProfile()
      if (data.user) {
        setProfile(data.user)
        setEditName(data.user.full_name || '')
        setEditBio(data.user.bio || '')

        // Fetch reviews
        if (data.user.id) {
          const revRes = await profileService.getReviews(data.user.id).catch(() => ({}))
          setReviews(revRes.reviews || [])
        }
      }
    } catch (err) {
      console.error('Load profile error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle Cover Photo Upload
  const handleCoverUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 800000) {
      alert('Cover photo too large. Maximum 800KB allowed.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const coverBase64 = reader.result
        await profileService.updateProfile({
          full_name: profile.full_name,
          bio: profile.bio,
          cover_image: coverBase64
        })
        setProfile((prev) => ({ ...prev, cover_image: coverBase64 }))
        updateUserData({ cover_image: coverBase64 })
      } catch {
        alert('Failed to update cover photo.')
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Avatar Upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500000) {
      alert('Avatar too large. Maximum 500KB allowed.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const avatarBase64 = reader.result
        await profileService.updateProfile({
          full_name: profile.full_name,
          bio: profile.bio,
          profile_image: avatarBase64
        })
        setProfile((prev) => ({ ...prev, profile_image: avatarBase64 }))
        updateUserData({ profile_image: avatarBase64 })
      } catch {
        alert('Failed to update avatar photo.')
      }
    }
    reader.readAsDataURL(file)
  }

  // Save Profile Info (Name & Bio)
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await profileService.updateProfile({
        full_name: editName,
        bio: editBio
      })
      setProfile((prev) => ({ ...prev, full_name: editName, bio: editBio }))
      updateUserData({ full_name: editName, bio: editBio })
      setEditModalOpen(false)
    } catch {
      alert('Failed to save profile changes.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Add Skill
  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!newSkillName.trim()) return

    setSavingSkill(true)
    try {
      await profileService.addSkill(newSkillName, newSkillType)
      await loadData()
      setSkillModalOpen(false)
      setNewSkillName('')
    } catch {
      alert('Failed to add skill.')
    } finally {
      setSavingSkill(false)
    }
  }

  // Delete Skill
  const handleDeleteSkill = async (skillId) => {
    if (!confirm('Are you sure you want to remove this skill?')) return
    try {
      await profileService.deleteSkill(skillId)
      await loadData()
    } catch {
      alert('Failed to delete skill.')
    }
  }

  const teachSkills = profile.skills_teach || []
  const learnSkills = profile.skills_learn || []

  return (
    <MainLayout>
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        {/* Profile Card with Cover & Avatar */}
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-700/80">
          {/* Cover Photo */}
          <div className="h-44 sm:h-56 bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] relative overflow-hidden group">
            {profile.cover_image && (
              <img
                src={profile.cover_image}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <label
              htmlFor="coverUploadInput"
              className="absolute top-4 right-4 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Camera className="w-4 h-4" />
              <span>Change Cover</span>
            </label>
            <input
              id="coverUploadInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>

          {/* Profile Header Info */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              {/* Avatar */}
              <div className="relative inline-block">
                <Avatar
                  src={profile.profile_image}
                  name={profile.full_name}
                  size="2xl"
                  className="border-4 border-[#1E293B] shadow-2xl"
                />
                <label
                  htmlFor="avatarUploadInput"
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#6C63FF] hover:bg-[#5a52e0] text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110"
                  title="Change avatar"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="avatarUploadInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Edit Profile Button */}
              <Button
                variant="secondary"
                size="sm"
                className="self-start sm:self-auto font-semibold"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Button>
            </div>

            {/* Name & Bio */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {profile.full_name || 'Member'}
              </h2>
              <p className="text-sm text-[#00C2FF] font-medium">{profile.email}</p>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                {profile.bio || 'No bio added yet. Click Edit Profile to tell partners about your expertise!'}
              </p>
            </div>
          </div>
        </div>

        {/* Skills Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills I Teach */}
          <Card className="p-6 border-[#6C63FF]/30">
            <CardHeader className="mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#6C63FF]" />
                <CardTitle>Skills I Can Teach</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewSkillType('teach')
                  setSkillModalOpen(true)
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </Button>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teachSkills.length > 0 ? (
                  teachSkills.map((s) => (
                    <Badge
                      key={s.id || s}
                      variant="teach"
                      onRemove={() => s.id && handleDeleteSkill(s.id)}
                    >
                      {typeof s === 'object' ? s.skill_name : s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    No teaching skills listed yet. Add what you are passionate about sharing!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills I Want to Learn */}
          <Card className="p-6 border-[#00C2FF]/30">
            <CardHeader className="mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#00C2FF]" />
                <CardTitle>Skills I Want to Learn</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewSkillType('learn')
                  setSkillModalOpen(true)
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </Button>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2">
                {learnSkills.length > 0 ? (
                  learnSkills.map((s) => (
                    <Badge
                      key={s.id || s}
                      variant="learn"
                      onRemove={() => s.id && handleDeleteSkill(s.id)}
                    >
                      {typeof s === 'object' ? s.skill_name : s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    No learning goals listed yet. Add topics you want peers to teach you!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <Card className="p-6 sm:p-8">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <CardTitle>Peer Reviews & Testimonials</CardTitle>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {reviews.length} total reviews
            </span>
          </CardHeader>

          <CardContent>
            {reviews.length > 0 ? (
              <div className="space-y-3.5">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">
                        {rev.reviewer_name || 'Exchange Partner'}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No reviews yet. Complete your first skill exchange session to receive feedback!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile Information"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Biography
            </label>
            <textarea
              rows={4}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell other members what you do, your background, and learning goals..."
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 resize-none"
            />
          </div>
          <div className="pt-3 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingProfile}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Skill Modal */}
      <Modal
        isOpen={skillModalOpen}
        onClose={() => setSkillModalOpen(false)}
        title={`Add Skill (${newSkillType === 'teach' ? 'Can Teach' : 'Want to Learn'})`}
      >
        <form onSubmit={handleAddSkill} className="space-y-4 text-left">
          <Input
            label="Skill Name"
            placeholder="e.g. Next.js, Figma, Photography, Spanish"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            required
            autoFocus
          />

          <div className="pt-3 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setSkillModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingSkill}>
              Add Skill
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  )
}
