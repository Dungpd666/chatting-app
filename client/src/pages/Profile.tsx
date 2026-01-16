import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { usersAPI, API_URL } from '../services/api';
import { useTheme } from '../hooks/useTheme';

// Appearance Settings Component
const AppearanceSettings: React.FC = () => {
  const { isDark, toggleTheme, setLightMode, setDarkMode } = useTheme();

  return (
    <div className="mt-8 pt-6 border-t border-tg-border">
      <h3 className="tg-section-title mb-4">Appearance</h3>
      <div className="space-y-3">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-tg-panel2/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
              {isDark ? (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-tg-text">Theme</span>
              <p className="text-xs text-tg-muted">{isDark ? 'Dark mode' : 'Light mode'}</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-tg-accent focus:ring-offset-2 focus:ring-offset-tg-bg ${
              isDark ? 'bg-tg-accent' : 'bg-tg-border'
            }`}
            aria-label="Toggle theme"
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {isDark ? (
                <svg className="w-3.5 h-3.5 text-tg-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </span>
          </button>
        </div>

        {/* Quick Theme Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={setLightMode}
            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
              !isDark 
                ? 'border-tg-accent bg-tg-accent/10' 
                : 'border-tg-border hover:border-tg-accent/50 bg-tg-panel2/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className={`text-sm font-medium ${!isDark ? 'text-tg-accent' : 'text-tg-text'}`}>Light</span>
          </button>

          <button
            onClick={setDarkMode}
            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
              isDark 
                ? 'border-tg-accent bg-tg-accent/10' 
                : 'border-tg-border hover:border-tg-accent/50 bg-tg-panel2/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-tg-accent' : 'text-tg-text'}`}>Dark</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pending avatar - chỉ preview, chưa upload
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getAvatarUrl = (avatar?: string | null): string | undefined => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    return `${API_URL}${avatar}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleAvatarClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setRemoveAvatar(false);

    // Chỉ tạo preview, chưa upload
    setPendingAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarPreview(previewUrl);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatarClick = () => {
    setPendingAvatarFile(null);
    if (pendingAvatarPreview) {
      URL.revokeObjectURL(pendingAvatarPreview);
      setPendingAvatarPreview(null);
    }
    setRemoveAvatar(true);
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate password match if changing password
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }

      let updatedUser = user;

      // Upload avatar if there's a pending file
      if (pendingAvatarFile) {
        const avatarResponse = await usersAPI.uploadAvatar(pendingAvatarFile);
        updatedUser = avatarResponse.user;
      }

      // Delete avatar if marked for removal
      if (removeAvatar && user?.avatar && !pendingAvatarFile) {
        const deleteResponse = await usersAPI.deleteAvatar();
        updatedUser = deleteResponse.user;
      }

      const updateData: any = {
        username: formData.username,
        email: formData.email,
      };

      // Only include password fields if user is changing password
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await api.put('/users/profile', updateData);

      // Update user in context and localStorage
      updatedUser = { ...updatedUser, ...response.data.user, ...response.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      // Clear pending avatar states
      setPendingAvatarFile(null);
      if (pendingAvatarPreview) {
        URL.revokeObjectURL(pendingAvatarPreview);
        setPendingAvatarPreview(null);
      }
      setRemoveAvatar(false);

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    // Clear pending avatar states
    setPendingAvatarFile(null);
    if (pendingAvatarPreview) {
      URL.revokeObjectURL(pendingAvatarPreview);
      setPendingAvatarPreview(null);
    }
    setRemoveAvatar(false);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // Determine what avatar to display
  const displayAvatarUrl = pendingAvatarPreview
    ? pendingAvatarPreview
    : (removeAvatar ? undefined : getAvatarUrl(user?.avatar));

  return (
    <div className="min-h-screen bg-tg-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-tg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-tg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="tg-card w-full max-w-2xl animate-fade-in-up relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tg-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="tg-icon-btn"
              title="Back to chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-tg-text">Profile Settings</h1>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="tg-btn-primary tg-btn-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />

          {/* Profile Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-tg-lg ring-4 ring-tg-panel overflow-hidden ${
                  loading ? 'opacity-50' : ''
                } ${displayAvatarUrl ? '' : 'bg-gradient-to-br from-tg-accent to-tg-bubbleOut'}`}
              >
                {loading ? (
                  <div className="tg-spinner w-8 h-8" />
                ) : displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt={user?.username || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.username?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              {/* Avatar action button */}
              <button
                onClick={handleAvatarClick}
                disabled={loading}
                className="absolute bottom-0 right-0 w-9 h-9 bg-tg-accent hover:bg-tg-accentHover rounded-full flex items-center justify-center text-white shadow-tg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                title="Change avatar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Pending avatar indicator */}
            {(pendingAvatarFile || removeAvatar) && (
              <div className="mt-2 text-xs text-tg-accent animate-pulse">
                {pendingAvatarFile ? 'New avatar selected - click Save to apply' : 'Avatar will be removed - click Save to apply'}
              </div>
            )}

            {/* Remove avatar button */}
            {(displayAvatarUrl || user?.avatar) && !loading && !removeAvatar && (
              <button
                onClick={handleRemoveAvatarClick}
                className="mt-3 text-sm text-tg-muted hover:text-tg-danger transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove photo
              </button>
            )}

            <p className="mt-2 text-xs text-tg-muted">Click to upload a new avatar</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-tg-danger/10 border border-tg-danger/20 text-tg-danger rounded-xl text-sm animate-fade-in flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-tg-success/10 border border-tg-success/20 text-tg-success rounded-xl text-sm animate-fade-in flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* Username */}
            <div className="tg-form-group">
              <label className="tg-label">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`tg-input ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                required
              />
            </div>

            {/* Email */}
            <div className="tg-form-group">
              <label className="tg-label">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`tg-input ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                required
              />
            </div>

            {/* Password Change Section */}
            {isEditing && (
              <div className="animate-fade-in-up">
                <div className="border-t border-tg-border pt-6 mt-6">
                  <h3 className="text-base font-semibold text-tg-text mb-2">Change Password</h3>
                  <p className="text-sm text-tg-muted mb-4">Leave blank if you don't want to change your password</p>
                </div>

                {/* Current Password */}
                <div className="tg-form-group mt-4">
                  <label className="tg-label">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="tg-input"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>

                {/* New Password */}
                <div className="tg-form-group mt-4">
                  <label className="tg-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="tg-input"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>

                {/* Confirm Password */}
                <div className="tg-form-group mt-4">
                  <label className="tg-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="tg-input"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-6 animate-fade-in">
                <button
                  type="submit"
                  disabled={loading}
                  className="tg-btn-primary flex-1"
                >
                  {loading ? (
                    <>
                      <span className="tg-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="tg-btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>

          {/* Account Info */}
          <div className="mt-8 pt-6 border-t border-tg-border">
            <h3 className="tg-section-title mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-tg-panel2/50">
                <span className="text-sm text-tg-muted">User ID</span>
                <span className="text-sm text-tg-text font-mono">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-tg-panel2/50">
                <span className="text-sm text-tg-muted">Member since</span>
                <span className="text-sm text-tg-text">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <AppearanceSettings />
        </div>
      </div>
    </div>
  );
};

export default Profile;
