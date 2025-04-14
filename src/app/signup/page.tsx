import AuthForm from '@/components/AuthForm';
import AuthRedirect from '@/components/AuthRedirect';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* すでにログインしている場合は /summary にリダイレクト */}
        <AuthRedirect requiredAuth={false} redirectTo="/summary" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">アカウント作成</h1>
          <p className="mt-2 text-sm text-gray-600">
            新しいアカウントを作成して始めましょう
          </p>
        </div>
        
        <AuthForm type="signup" />
      </div>
    </div>
  );
}
