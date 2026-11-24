import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Lock, Mail, User, ArrowRight, Briefcase, GraduationCap } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardBody } from '../components/common/Card';
import { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      error('Validation Error', 'Please complete all required fields.');
      return;
    }

    if (password.length < 8) {
      error('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.register({
        email,
        password,
        full_name: fullName,
        role,
      });

      // Automatically authenticate after successful registration
      const tokens = await api.auth.login({ email, password });
      login(tokens);
      success('Account Created', `Welcome to CALYX, ${fullName}!`);

      if (role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    } catch (err: any) {
      error('Registration Failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your Account</h2>
          <p className="text-xs text-surface-400">Join CALYX to experience autonomous AI talent screening</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selector radio cards */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-2">
                  Select Your Account Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                      role === 'candidate'
                        ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                        : 'border-surface-800 bg-surface-950 text-surface-400 hover:border-surface-700'
                    }`}
                  >
                    <GraduationCap className={`w-5 h-5 mb-1.5 ${role === 'candidate' ? 'text-brand-400' : ''}`} />
                    <span className="text-xs font-semibold">Job Candidate</span>
                    <span className="text-[10px] text-surface-400 mt-0.5">Apply & View Scores</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                      role === 'recruiter'
                        ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                        : 'border-surface-800 bg-surface-950 text-surface-400 hover:border-surface-700'
                    }`}
                  >
                    <Briefcase className={`w-5 h-5 mb-1.5 ${role === 'recruiter' ? 'text-brand-400' : ''}`} />
                    <span className="text-xs font-semibold">Hiring Recruiter</span>
                    <span className="text-[10px] text-surface-400 mt-0.5">Post Jobs & Review</span>
                  </button>
                </div>
              </div>

              <Input
                label="Full Legal Name"
                type="text"
                placeholder="Ada Lovelace"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="candidate@calyx.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters (1 letter, 1 number)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                helperText="Must contain at least 8 characters with numbers and letters"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full mt-4"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="text-center text-xs text-surface-400">
          Already registered?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
