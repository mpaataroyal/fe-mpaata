"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Button, Space, Typography, Spin, message } from 'antd';
import { SafetyCertificateOutlined, ThunderboltOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export default function LoginPage() {
  const { user, googleLogin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    try {
      await googleLogin();
      message.success("Login successful!");
      // Navigation will happen via useEffect when user state updates
    } catch (error) {
      console.error("Login failed:", error);
      message.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  // Don't render login page if user is already logged in
  if (user) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: 1200, 
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 48,
          alignItems: 'center'
        }}>
          {/* Left side - Branding */}
          <div style={{ color: 'white', padding: '20px' }}>
            <Title level={1} style={{ color: 'white', fontSize: 48, marginBottom: 24, fontWeight: 700 }}>
              Welcome Back
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.95)', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
              Sign in to access your personalized dashboard and manage your account with ease.
            </Paragraph>
            
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <SafetyCertificateOutlined style={{ fontSize: 28, marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Secure Authentication</div>
                  <div style={{ opacity: 0.9, lineHeight: 1.5 }}>Your data is protected with industry-standard security</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <ThunderboltOutlined style={{ fontSize: 28, marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Fast & Reliable</div>
                  <div style={{ opacity: 0.9, lineHeight: 1.5 }}>Lightning-fast performance for the best experience</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <GlobalOutlined style={{ fontSize: 28, marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Access Anywhere</div>
                  <div style={{ opacity: 0.9, lineHeight: 1.5 }}>Seamlessly sync across all your devices</div>
                </div>
              </div>
            </Space>
          </div>

          {/* Right side - Login Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Card
              style={{
                width: '100%',
                maxWidth: 440,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                borderRadius: 20,
                overflow: 'hidden',
                border: 'none'
              }}
              bodyStyle={{ padding: '48px 40px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                {/* Logo/Icon */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                
                <Title level={2} style={{ marginBottom: 8, fontSize: 28, fontWeight: 600 }}>
                  Sign In
                </Title>
                <Paragraph style={{ color: '#666', fontSize: 16, margin: 0 }}>
                  Use your Google account to continue
                </Paragraph>
              </div>

              <Spin spinning={loginLoading}>
                <Button
                  size="large"
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  style={{
                    width: '100%',
                    height: 56,
                    fontSize: 16,
                    fontWeight: 500,
                    border: '2px solid #e8e8e8',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    transition: 'all 0.3s ease',
                    background: 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (!loginLoading) {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              </Spin>

              <div style={{ 
                marginTop: 40,
                paddingTop: 32,
                borderTop: '1px solid #f0f0f0',
                textAlign: 'center'
              }}>
                <Paragraph style={{ color: '#999', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  By signing in, you agree to our{' '}
                  <a href="#" style={{ color: '#667eea', fontWeight: 500 }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: '#667eea', fontWeight: 500 }}>Privacy Policy</a>
                </Paragraph>
              </div>
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
