import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface LoginFormData {
  name: string;
  role: 'patient' | 'staff';
}
 
export const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    defaultValues: { role: 'patient' }
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.role, data.name);
      if (data.role === 'patient') {
        navigate('/patient');
      } else {
        navigate('/staff');
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-md border border-slate-200">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
        <p className="text-slate-600 mt-1">Please sign in to continue</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. John Doe"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Role</label>
          <select 
            {...register('role')} 
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="patient">Patient</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        
        <div className="pt-2">
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign In
          </Button>
        </div>
      </form>
      
      <div className="mt-6 text-sm text-slate-500 text-center bg-slate-50 p-3 rounded">
        <strong>Demo Note:</strong> Use any name. Selecting Patient or Staff routes you to different portals.
      </div>
    </div>
  );
};
