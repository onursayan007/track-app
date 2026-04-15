<template>
  <aside class="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800 z-50">
    <div class="p-6 flex items-center gap-3">
      <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      </div>
      <h1 class="text-xl font-bold tracking-tight">Shuttle<span class="text-orange-500">Admin</span></h1>
    </div>
    
    <nav class="mt-6 px-2 space-y-1">
      <router-link to="/super-admin/dashboard" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
        Dashboard
      </router-link>
      
      <router-link to="/super-admin/tenants" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        Firmalar (Tenants)
      </router-link>

      <router-link to="/super-admin/vehicles" active-class="bg-orange-500/10 text-orange-500" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
        Araç Yönetimi
      </router-link>

      <router-link to="/super-admin/m2m" active-class="bg-orange-500/10 text-orange-500" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        M2M Hat Yönetimi
      </router-link>

      <router-link to="/super-admin/billing" active-class="bg-orange-500/10 text-orange-500" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"></path></svg>
        Faturalandırma
      </router-link>

      <router-link to="/super-admin/pricing" active-class="bg-orange-500/10 text-orange-500" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Planlar ve Ücretler
      </router-link>

      <router-link to="/super-admin/users" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        Kullanıcılar
      </router-link>

      <router-link to="/super-admin/settings" class="flex items-center px-4 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
        <svg class="w-5 h-5 mr-3 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        Ayarlar
      </router-link>
    </nav>
  </aside>
</template>