import React from 'react';
import { Layout } from '../components/Layout.tsx';

interface Merchant {
  id: string;
  name: string;
}

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'REGIONAL_ADMIN' | 'MERCHANT' | 'MERCHANT_EMPLOYEE';
  merchantName: string | null;
  mappedMerchantsCount: number;
}

import { MerchantContext } from '../middleware/auth.ts';

interface UsersPageProps {
  users: UserListItem[];
  merchants: Merchant[];
  currentUser: any;
  activeMerchant?: MerchantContext | null;
  accessibleMerchants?: MerchantContext[];
}

export function UsersPage({ users, merchants, currentUser, activeMerchant, accessibleMerchants }: UsersPageProps) {
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    REGIONAL_ADMIN: 'Regional Admin',
    MERCHANT: 'Merchant Owner',
    MERCHANT_EMPLOYEE: 'Employee'
  };

  return (
    <Layout activePath="/users" user={currentUser} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            User & Role Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage administrative members, regional managers, merchants, and checkout cashiers.
          </p>
        </div>
        <button 
          id="btn-add-user"
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Create New User
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 mb-6 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            id="user-filter-search" 
            placeholder="Search user name or email..." 
            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select id="user-filter-role" className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 outline-none cursor-pointer">
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Operations Admin</option>
            <option value="REGIONAL_ADMIN">Regional Admin</option>
            <option value="MERCHANT">Merchant Owner</option>
            <option value="MERCHANT_EMPLOYEE">Cashier / Staff</option>
          </select>
        </div>
      </div>

      {/* Empty Search Result */}
      <div id="user-empty-search" className="hidden flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-center shadow-sm mb-6">
        <span className="text-2xl mb-2">🔍</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No matching users found</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Try changing your search terms or clearing the role filter.</p>
      </div>

      {/* ========================================================================= */}
      {/* 3. USERS DIRECTORY TABLE (DESKTOP) & STACKED LIST (MOBILE) */}
      {/* ========================================================================= */}
      
      {/* Mobile Card list */}
      <div id="mobile-user-list" className="block sm:hidden space-y-4">
        {users.map(u => (
          <div 
            key={u.id} 
            className="user-card bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-3"
            data-name={u.name.toLowerCase()}
            data-email={u.email.toLowerCase()}
            data-role={u.role}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">{u.name}</span>
                <span className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 border border-red-300 dark:border-red-800' :
                u.role === 'ADMIN' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-400 border border-orange-300 dark:border-orange-800' :
                u.role === 'REGIONAL_ADMIN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-400 border border-sky-300 dark:border-sky-800'
              }`}>
                {roleLabels[u.role]}
              </span>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800/60 pt-2.5 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Authorized Scope</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200 mt-0.5">
                  {u.role === 'REGIONAL_ADMIN' ? `${u.mappedMerchantsCount} Stores Assigned` :
                   u.merchantName ? u.merchantName : 'All / Platform Access'}
                </span>
              </div>
              <button 
                className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline btn-delete-user"
                data-id={u.id}
                data-name={u.name}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Spreadsheet-style Table */}
      <div id="desktop-user-table-container" className="hidden sm:block bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">System Role</th>
                <th className="py-3.5 px-4">Mapped Scope</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs text-slate-700 dark:text-zinc-300">
              {users.map(u => (
                <tr 
                  key={u.id} 
                  className="user-row hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  data-name={u.name.toLowerCase()}
                  data-email={u.email.toLowerCase()}
                  data-role={u.role}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center uppercase">
                        {u.name.slice(0, 2)}
                      </div>
                      <span className="font-bold text-slate-950 dark:text-zinc-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{u.email}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold leading-normal ${
                      u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 border border-red-200/60 dark:border-red-900/60' :
                      u.role === 'ADMIN' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/60' :
                      u.role === 'REGIONAL_ADMIN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60' :
                      'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/60'
                    }`}>
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-zinc-200 font-medium">
                    {u.role === 'REGIONAL_ADMIN' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{u.mappedMerchantsCount} Managed Stores</span>
                    ) : u.merchantName ? (
                      u.merchantName
                    ) : (
                      <span className="text-slate-400 dark:text-zinc-500">Platform Access (All)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button 
                      className="text-red-600 dark:text-red-400 font-bold hover:underline btn-delete-user"
                      data-id={u.id}
                      data-name={u.name}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div id="users-pagination-bar" className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select id="users-page-size" className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-zinc-200 outline-none cursor-pointer">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>users per page</span>
          </div>
          <div className="flex items-center gap-3">
            <span id="users-pagination-info" className="text-xs">Showing 1 to {Math.min(10, users.length)} of {users.length} users</span>
            <div className="inline-flex items-center gap-1">
              <button id="users-btn-prev" className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition-colors">Prev</button>
              <div id="users-page-numbers" className="inline-flex items-center gap-1"></div>
              <button id="users-btn-next" className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS & DIALOGS */}
      {/* ========================================================================= */}
      
      {/* CREATE NEW USER DIALOG */}
      <div id="modal-add-user" className="fixed inset-0 z-50 flex items-center justify-center hidden" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm modal-close-trigger"></div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-10 transition-all duration-300 scale-95 opacity-0 modal-content">
          <div className="flex items-center justify-between mb-5">
            <h3 id="add-user-title" className="font-bold text-xl text-slate-900 dark:text-zinc-50">Create New QBiz User</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 modal-close-trigger" aria-label="Close dialog">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form action="/api/v1/users" method="POST" className="space-y-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="user-name" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <input 
                type="text" 
                id="user-name" 
                name="name" 
                required 
                placeholder="e.g. John Doe"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="user-email" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <input 
                type="email" 
                id="user-email" 
                name="email" 
                required 
                placeholder="e.g. name@qbiz.com"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="user-password" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Temporary Password
              </label>
              <input 
                type="password" 
                id="user-password" 
                name="password" 
                required 
                placeholder="password123"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all"
              />
            </div>

            {/* Role Select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="user-role" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                System Authorization Role
              </label>
              <select 
                id="user-role"
                name="role"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all cursor-pointer"
              >
                {currentUser.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin (Global Root)</option>}
                {currentUser.role === 'SUPER_ADMIN' && <option value="ADMIN">Admin (Full Control)</option>}
                {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && <option value="REGIONAL_ADMIN">Regional Admin (Membawahi Toko)</option>}
                {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'REGIONAL_ADMIN') && <option value="MERCHANT">Merchant Owner (Single Store)</option>}
                <option value="MERCHANT_EMPLOYEE">Karyawan Merchant (Cashier)</option>
              </select>
            </div>

            {/* Merchant Select (conditionally visible in script based on Role selection) */}
            <div id="associated-merchant-block" className="flex flex-col gap-1.5 hidden">
              <label htmlFor="user-merchant" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Associated Merchant Store
              </label>
              <select 
                id="user-merchant"
                name="merchantId"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-transparent outline-none transition-all cursor-pointer"
              >
                {currentUser.role === 'MERCHANT' ? (
                  <option value={currentUser.merchantId || ''}>Selected Merchant</option>
                ) : (
                  <>
                    <option value="">Select Associated Store...</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button 
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CLIENT SCRIPT */}
      {/* ========================================================================= */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Modal visibility
            function openModal(modalId) {
              const modal = document.getElementById(modalId);
              if (!modal) return;
              modal.classList.remove('hidden');
              setTimeout(() => {
                const content = modal.querySelector('.modal-content');
                if (content) {
                  content.classList.remove('scale-95', 'opacity-0');
                  content.classList.add('scale-100', 'opacity-100');
                }
              }, 10);
            }

            function closeModal(modalId) {
              const modal = document.getElementById(modalId);
              if (!modal) return;
              const content = modal.querySelector('.modal-content');
              if (content) {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
              }
              setTimeout(() => {
                modal.classList.add('hidden');
              }, 300);
            }

            document.querySelectorAll('.modal-close-trigger').forEach(el => {
              el.addEventListener('click', function(e) {
                const modal = e.target.closest('[role="dialog"]');
                if (modal) closeModal(modal.id);
              });
            });

            // Open invite user modal
            const addBtn = document.getElementById('btn-add-user');
            if (addBtn) addBtn.addEventListener('click', () => openModal('modal-add-user'));

            // Toggle Merchant dropdown block based on Role selection
            const roleSelect = document.getElementById('user-role');
            const merchantBlock = document.getElementById('associated-merchant-block');
            
            if (roleSelect && merchantBlock) {
              const checkRole = () => {
                const val = roleSelect.value;
                if (val === 'MERCHANT' || val === 'MERCHANT_EMPLOYEE') {
                  merchantBlock.classList.remove('hidden');
                } else {
                  merchantBlock.classList.add('hidden');
                }
              };
              roleSelect.addEventListener('change', checkRole);
              checkRole();
            }

            // Bind Delete Account triggers
            document.querySelectorAll('.btn-delete-user').forEach(btn => {
              btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                if (confirm('Are you sure you want to delete user account "' + name + '"? This action is irreversible.')) {
                  fetch('/api/v1/users/' + id + '/delete', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        window.location.reload();
                      } else {
                        alert('Delete failed: ' + (data.error || 'Unknown error'));
                      }
                    });
                }
              });
            });

            // =========================================================================
            // USERS SEARCH & PAGINATION CONTROLLER
            // =========================================================================
            const userSearchInput = document.getElementById('user-filter-search');
            const userRoleSelect = document.getElementById('user-filter-role');
            const userEmptySearch = document.getElementById('user-empty-search');
            const userPageSizeSelect = document.getElementById('users-page-size');
            const userPaginationInfo = document.getElementById('users-pagination-info');
            const userBtnPrev = document.getElementById('users-btn-prev');
            const userBtnNext = document.getElementById('users-btn-next');
            const userPageNumbers = document.getElementById('users-page-numbers');

            let uCurrentPage = 1;
            let uPageSize = 10;
            let uFilteredItems = [];

            function updateUserPagination() {
              const total = uFilteredItems.length;
              const totalPages = Math.max(1, Math.ceil(total / uPageSize));
              if (uCurrentPage > totalPages) uCurrentPage = totalPages;
              if (uCurrentPage < 1) uCurrentPage = 1;

              const startIdx = (uCurrentPage - 1) * uPageSize;
              const endIdx = Math.min(startIdx + uPageSize, total);

              uFilteredItems.forEach((item, index) => {
                if (index >= startIdx && index < endIdx) {
                  if (item.row) item.row.classList.remove('hidden');
                  if (item.card) item.card.classList.remove('hidden');
                } else {
                  if (item.row) item.row.classList.add('hidden');
                  if (item.card) item.card.classList.add('hidden');
                }
              });

              if (userPaginationInfo) {
                if (total === 0) {
                  userPaginationInfo.textContent = 'Showing 0 users';
                } else {
                  userPaginationInfo.textContent = 'Showing ' + (startIdx + 1) + ' to ' + endIdx + ' of ' + total + ' users';
                }
              }

              if (userBtnPrev) userBtnPrev.disabled = uCurrentPage <= 1;
              if (userBtnNext) userBtnNext.disabled = uCurrentPage >= totalPages;

              if (userPageNumbers) {
                userPageNumbers.innerHTML = '';
                for (let p = 1; p <= totalPages; p++) {
                  const pBtn = document.createElement('button');
                  pBtn.className = 'px-2.5 py-1 rounded text-xs font-semibold transition-colors ' + 
                    (p === uCurrentPage ? 'bg-sky-600 text-white' : 'border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800');
                  pBtn.textContent = p;
                  pBtn.addEventListener('click', () => {
                    uCurrentPage = p;
                    updateUserPagination();
                  });
                  userPageNumbers.appendChild(pBtn);
                }
              }
            }

            function filterUsers() {
              const query = (userSearchInput ? userSearchInput.value : '').toLowerCase().trim();
              const role = userRoleSelect ? userRoleSelect.value : 'ALL';

              const allRows = Array.from(document.querySelectorAll('.user-row'));
              const allCards = Array.from(document.querySelectorAll('.user-card'));

              allRows.forEach(r => r.classList.add('hidden'));
              allCards.forEach(c => c.classList.add('hidden'));

              uFilteredItems = [];
              const count = Math.max(allRows.length, allCards.length);

              for (let i = 0; i < count; i++) {
                const row = allRows[i];
                const card = allCards[i];
                const el = row || card;
                if (!el) continue;

                const name = (el.getAttribute('data-name') || '').toLowerCase();
                const email = (el.getAttribute('data-email') || '').toLowerCase();
                const userRole = el.getAttribute('data-role');

                const matchesQuery = name.includes(query) || email.includes(query);
                const matchesRole = role === 'ALL' || userRole === role;

                if (matchesQuery && matchesRole) {
                  uFilteredItems.push({ row, card });
                }
              }

              if (uFilteredItems.length === 0 && count > 0) {
                if (userEmptySearch) userEmptySearch.classList.remove('hidden');
              } else {
                if (userEmptySearch) userEmptySearch.classList.add('hidden');
              }

              uCurrentPage = 1;
              updateUserPagination();
            }

            if (userSearchInput) userSearchInput.addEventListener('input', filterUsers);
            if (userRoleSelect) userRoleSelect.addEventListener('change', filterUsers);
            if (userPageSizeSelect) {
              userPageSizeSelect.addEventListener('change', function() {
                uPageSize = parseInt(this.value, 10) || 10;
                uCurrentPage = 1;
                updateUserPagination();
              });
            }
            if (userBtnPrev) {
              userBtnPrev.addEventListener('click', function() {
                if (uCurrentPage > 1) {
                  uCurrentPage--;
                  updateUserPagination();
                }
              });
            }
            if (userBtnNext) {
              userBtnNext.addEventListener('click', function() {
                uCurrentPage++;
                updateUserPagination();
              });
            }

            filterUsers();

          })();
        `
      }} />

    </Layout>
  );
}
