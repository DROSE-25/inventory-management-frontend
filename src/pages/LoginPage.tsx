import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Loader2 } from 'lucide-react';
 
export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
 
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin1234!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
 
    try {
      const response = await authApi.login({ username, password });
      login(response.accessToken, response.username, response.role);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.status === 401
        ? 'Неправильний логін або пароль'
        : 'Помилка з\'єднання з сервером';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-12 w-12 text-slate-700" />
          </div>
          <CardTitle className="text-2xl">Управління запасами</CardTitle>
          <CardDescription>Вхід до системи</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логін</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Увійти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
