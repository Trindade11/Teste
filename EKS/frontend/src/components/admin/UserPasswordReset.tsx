import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Shield, User, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationType: string;
  company: string;
  createdAt: string;
}

export const UserPasswordReset: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/admin/users/${selectedUser.id}/reset-password`, {
        newPassword
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: `Password reset successfully for ${selectedUser.email}` });
        setNewPassword('');
        setConfirmPassword('');
        setSelectedUser(null);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to reset password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">User Password Reset</h2>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              All Users
            </CardTitle>
            <CardDescription>
              Select a user to reset their password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.company}</div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Password Reset Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Password
            </CardTitle>
            <CardDescription>
              {selectedUser 
                ? `Reset password for ${selectedUser.name} (${selectedUser.email})`
                : 'Select a user to reset their password'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium">Selected User</div>
                  <div className="text-sm text-gray-600">{selectedUser.name}</div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  <div className="text-sm text-gray-500">
                    {selectedUser.company} • {selectedUser.organizationType}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={handleResetPassword}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This action will immediately reset the user's password. 
                    The user will need to use the new password on their next login.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a user from the list to reset their password</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
