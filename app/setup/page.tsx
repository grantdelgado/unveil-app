'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserProfile } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/supabase/types';
import {
  PageWrapper,
  CardContainer,
  PageTitle,
  SubTitle,
  FieldLabel,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  MicroCopy,
  LoadingSpinner,
  DevModeBox
} from '@/components/ui';

export default function AccountSetupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: profile, error } = await getCurrentUserProfile();

        if (error || !profile) {
          console.error('Failed to load user profile:', error);
          router.push('/login');
          return;
        }

        setUserProfile(profile);

        // Pre-fill form if user already has some data
        if (
          profile.full_name &&
          profile.full_name !== `User ${profile.phone?.slice(-4)}`
        ) {
          setFullName(profile.full_name);
        }
        if (profile.email) {
          setEmail(profile.email);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        router.push('/login');
      }
    };

    loadUserProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      if (!userProfile?.id) {
        setError('User profile not found. Please try logging in again.');
        return;
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          email: email.trim() || null,
        })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        setError('Failed to save your information. Please try again.');
        return;
      }

      console.log('✅ Profile setup completed');

      // Redirect to select-event page
      router.push('/select-event');
    } catch (err) {
      console.error('Setup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow users to skip setup and go directly to events
    router.push('/select-event');
  };

  if (!userProfile) {
    return (
      <PageWrapper>
        <LoadingSpinner size="lg" text="Loading your account..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <CardContainer>
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">👋</div>
            <PageTitle>Welcome to Unveil!</PageTitle>
            <SubTitle>Let&apos;s set up your account to get started</SubTitle>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <FieldLabel htmlFor="fullName" required>
                Full Name
              </FieldLabel>
              <TextInput
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="email">
                Email Address (Optional)
              </FieldLabel>
              <TextInput
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <PrimaryButton
                type="submit"
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </PrimaryButton>

              <SecondaryButton
                type="button"
                onClick={handleSkip}
                disabled={loading}
              >
                Skip for now
              </SecondaryButton>
            </div>
          </form>

          <div className="text-center space-y-1">
            <MicroCopy>Phone: {userProfile.phone}</MicroCopy>
            <MicroCopy>
              You can update this information later in your profile
            </MicroCopy>
          </div>
        </div>

        <DevModeBox>
          <p><strong>Account Setup State:</strong></p>
          <p>User ID: {userProfile?.id || 'N/A'}</p>
          <p>Phone: {userProfile?.phone || 'N/A'}</p>
          <p>Current Full Name: {userProfile?.full_name || '(empty)'}</p>
          <p>Form Full Name: {fullName || '(empty)'}</p>
          <p>Form Email: {email || '(empty)'}</p>
          <p>Loading: {loading ? 'true' : 'false'}</p>
          {error && <p className="text-red-600">Error: {error}</p>}
        </DevModeBox>
      </CardContainer>
    </PageWrapper>
  );
}
