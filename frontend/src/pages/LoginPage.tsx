import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bot, Lock, Mail, ArrowRight, UserCheck, Briefcase } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardBody } from '../components/common/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Validation Error', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const tokens = await api.auth.login({ email, password });
      login(tokens);
      success('Welcome back!', `Signed in as ${tokens.user.full_name} (${tokens.user.role})`);

      if (tokens.user.role === 'recruiter') {
        navigate(from === '/' ? '/recruiter/dashboard' : from, { replace: true });
      } else {
        navigate(from === '/' ? '/candidate/dashboard' : from, { replace: true });
      }
    } catch (err: any) {
      error('Authentication Failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo credential autofill helpers
  const fillCandidate = () => {
    setEmail('candidate@calyx.ai');
    setPassword('SecurePass123!');
  };

  const fillRecruiter = () => {
    setEmail('recruiter@calyx.ai');
    setPassword('SecurePass123!');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to CALYX</h2>
          <p className="text-xs text-surface-400">
            Autonomous Agentic AI Smart Hiring & Talent Intelligence Platform
          </p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            {/* Quick-fill helper for convenience */}
            <div className="mt-6 pt-5 border-t border-surface-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 block mb-2.5 text-center">
                Quick Demo Credentials
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={fillCandidate}
                  leftIcon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                >
                  Candidate Demo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={fillRecruiter}
                  leftIcon={<Briefcase className="w-3.5 h-3.5 text-brand-400" />}
                >
                  Recruiter Demo
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <p className="text-center text-xs text-surface-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
            Register new account
          </Link>
        </p>
      </div>
    </div>
  );
};
