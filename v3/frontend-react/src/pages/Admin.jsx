import React, { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { marketplaceService } from '../services/marketplaceService'
import {
  ShieldCheck,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react'

export function Admin() {
  const [users, setUsers] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, trendingRes] = await Promise.allSettled([
          marketplaceService.getAllUsers(),
          marketplaceService.getTrendingSkills()
        ])

        if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
          setUsers(usersRes.value.users)
        }
        if (trendingRes.status === 'fulfilled' && trendingRes.value?.trending) {
          setTrending(trendingRes.value.trending)
        }
      } catch (err) {
        console.error('Admin fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalTeach = trending.reduce((acc, curr) => acc + curr.teach_count, 0)
  const totalLearn = trending.reduce((acc, curr) => acc + curr.learn_count, 0)

  return (
    <MainLayout>
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Admin & Analytics Panel</span>
              <ShieldCheck className="w-6 h-6 text-[#00C2FF]" />
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time platform metrics, member activity, and skill exchange health.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card hover className="p-6 bg-gradient-to-br from-[#6C63FF]/20 to-[#6C63FF]/5 border-[#6C63FF]/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Registered Users
              </span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{users.length + 1}</div>
            <div className="text-xs text-slate-400 mt-1">100% verified Gmail accounts</div>
          </Card>

          <Card hover className="p-6 bg-gradient-to-br from-[#00C2FF]/20 to-[#00C2FF]/5 border-[#00C2FF]/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Skills Cataloged
              </span>
              <Award className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{trending.length}</div>
            <div className="text-xs text-slate-400 mt-1">Unique platform skills</div>
          </Card>

          <Card hover className="p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Teaching Offers
              </span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{totalTeach}</div>
            <div className="text-xs text-slate-400 mt-1">Available mentor spots</div>
          </Card>

          <Card hover className="p-6 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Learning Requests
              </span>
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{totalLearn}</div>
            <div className="text-xs text-slate-400 mt-1">Desired skills listed</div>
          </Card>
        </div>

        {/* Member Directory Table */}
        <Card className="p-6">
          <CardHeader className="mb-4">
            <CardTitle>Member Directory</CardTitle>
            <span className="text-xs text-slate-400">{users.length} peer members</span>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Can Teach</th>
                    <th className="py-3 px-4">Wants to Learn</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <Avatar src={u.profile_image} name={u.full_name} size="sm" />
                        <span className="font-semibold text-white">{u.full_name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-xs">{u.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(u.skills_teach || []).slice(0, 2).map((s, i) => (
                            <Badge key={i} variant="teach">
                              {typeof s === 'object' ? s.skill_name : s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(u.skills_learn || []).slice(0, 2).map((s, i) => (
                            <Badge key={i} variant="learn">
                              {typeof s === 'object' ? s.skill_name : s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
