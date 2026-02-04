'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { User, Mail, Save, Loader2, Camera, Shield, Award, MapPin, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

  // State untuk Data Form
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nik: '',
    bio: ''
  })

  // State untuk File (Hanya Client-Side Preview)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (error) throw error

        setUser(profile)
        // Set data awal
        setFormData({
          username: profile.username || '',
          email: profile.email || authUser.email || '',
          nik: profile.nik || '', // Kalau kolom nik blm ada di DB, ini akan kosong (aman)
          bio: 'Pengajar aktif di EchoArena.'
        })
        setAvatarPreview(profile.avatar_url || '')

      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [])

  // Handle Pilih Foto Profil
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Buat URL lokal untuk preview instan
      const objectUrl = URL.createObjectURL(file)
      setAvatarPreview(objectUrl)
    }
  }

  // Handle Simpan (Simulasi Upload)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Simulasi delay upload biar terlihat real
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      // Kita hanya simpan Username ke DB (karena kolom lain mungkin blm ada)
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          // avatar_url: avatarPreview // Kita tidak simpan blob URL ke DB krn akan expired, ini demo only
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Profil dan Dokumen berhasil dikirim untuk verifikasi!')
      router.refresh()
      
    } catch (error) {
      alert('Gagal memperbarui profil.')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Memuat profil...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="text-indigo-500" /> Profil Pengajar
          </h1>
          <p className="text-slate-400 mt-2">
            Lengkapi data diri dan dokumen untuk mendapatkan centang verifikasi.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded text-yellow-500 text-xs font-bold animate-pulse">
          <AlertCircle className="w-4 h-4" /> Status: Menunggu Verifikasi Dokumen
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: PREVIEW KARTU ID (VISUAL KEREN) */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold text-white">ID Card Preview</h2>
           
           {/* Kartu ID */}
           <div className="relative group perspective">
             <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-2xl border border-indigo-500/50 overflow-hidden">
                
                {/* Hiasan Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Avatar Circle */}
                  <div className="w-28 h-28 rounded-full border-4 border-indigo-500/30 bg-slate-800 flex items-center justify-center mb-4 shadow-lg overflow-hidden relative group-hover:border-indigo-400 transition-colors">
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-12 h-12 text-slate-500" />
                    )}
                    {/* Badge Verified (Palsu) */}
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-slate-900">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-1">{formData.username || 'Nama Pengajar'}</h3>
                  <p className="text-indigo-300 text-sm mb-4">{formData.email}</p>

                  <div className="w-full border-t border-slate-700/50 my-4"></div>

                  <div className="grid grid-cols-2 gap-4 w-full text-left">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Nomor Induk (NIK)</p>
                      <p className="text-sm font-mono text-slate-300">{formData.nik || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Level</p>
                      <p className="text-sm font-bold text-yellow-400">Level {user?.level || 1}</p>
                    </div>
                  </div>
                </div>
             </div>
           </div>

           {/* Info Tambahan */}
           <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/50 flex gap-3">
             <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
             <div>
               <h4 className="text-sm font-bold text-blue-300">Mengapa Verifikasi?</h4>
               <p className="text-xs text-blue-200/70 mt-1">
                 Dokumen KTP dan Sertifikat dibutuhkan untuk mendapatkan badge "Verified Teacher" agar dipercaya oleh siswa.
               </p>
             </div>
           </div>
        </div>

        {/* KOLOM KANAN: FORM UPLOAD (DRAG & DROP) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdate}>
            
            {/* 1. INFORMASI DASAR */}
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Informasi Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Upload Foto (Custom UI) */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Foto Profil</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    {avatarPreview ? (
                      <div className="flex items-center gap-4">
                        <img src={avatarPreview} className="w-16 h-16 rounded-full object-cover border border-slate-600" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">Foto terpilih</p>
                          <p className="text-xs text-green-400">Klik untuk ganti foto</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6 text-indigo-400" />
                        </div>
                        <p className="text-sm text-slate-300 font-medium">Klik untuk upload foto</p>
                        <p className="text-xs text-slate-500">JPG, PNG (Max 2MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nama Lengkap (Sesuai KTP)</Label>
                    <Input 
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">NIK (Nomor Induk Kependudukan)</Label>
                    <Input 
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                      placeholder="16 Digit NIK"
                      className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Bio Singkat</Label>
                  <Input 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Ceritakan sedikit tentang pengalaman mengajar Anda..."
                    className="bg-slate-950 border-slate-700 text-white focus:border-indigo-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. DOKUMEN PENDUKUNG (DROP ZONE) */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                   <FileText className="w-5 h-5 text-indigo-400" /> Dokumen Verifikasi
                </CardTitle>
                <CardDescription>Upload dokumen dalam format PDF atau JPG.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Upload KTP */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Scan KTP</Label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="ktp-upload" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
                    />
                    <div className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-4 transition-colors ${ktpFile ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ktpFile ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                        {ktpFile ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${ktpFile ? 'text-green-400' : 'text-slate-300'}`}>
                          {ktpFile ? ktpFile.name : 'Drag & Drop file KTP di sini'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ktpFile ? `${(ktpFile.size / 1024).toFixed(1)} KB` : 'atau klik untuk browsing file'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Sertifikat */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Sertifikat Pendidik (Opsional)</Label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="cert-upload" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    />
                    <div className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-4 transition-colors ${certFile ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${certFile ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                        {certFile ? <CheckCircle2 className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${certFile ? 'text-green-400' : 'text-slate-300'}`}>
                          {certFile ? certFile.name : 'Drag & Drop Sertifikat di sini'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {certFile ? `${(certFile.size / 1024).toFixed(1)} KB` : 'Mendukung PDF/JPG'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Simpan */}
                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px] shadow-lg shadow-indigo-500/20"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengupload...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Simpan & Verifikasi
                      </>
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </form>
        </div>

      </div>
    </div>
  )
}