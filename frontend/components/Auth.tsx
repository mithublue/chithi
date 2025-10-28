import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

type AuthView = 'login' | 'register';

interface AuthProps {
    initialView?: AuthView;
}

const Auth: React.FC<AuthProps> = ({ initialView = 'login' }) => {
    const navigate = useNavigate();
    const [view, setView] = useState<AuthView>(initialView);

    useEffect(() => {
        setView(initialView);
    }, [initialView]);

    const handleSwitch = (target: AuthView) => {
        setView(target);
        navigate(target === 'login' ? '/login' : '/register', { replace: true });
    };

    return (
        <div className="container">
            <header>
                <h1>Welcome to Mom's Safe Haven</h1>
                <p>A private space for mothers to connect anonymously.</p>
            </header>
            <main>
                {view === 'login' ? (
                    <Login onSwitch={() => handleSwitch('register')} />
                ) : (
                    <Register onSwitch={() => handleSwitch('login')} />
                )}
            </main>
        </div>
    );
};

interface LoginProps {
    onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        aria-label="Email Address"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="********"
                        aria-label="Password"
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging In...' : 'Login'}
                </button>
            </form>
            <p className="toggle-view">
                Don't have an account?{' '}
                <button type="button" onClick={onSwitch}>Register here</button>
            </p>
        </div>
    );
};

interface RegisterProps {
    onSwitch: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await register(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Create Account</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="register-email">Email</label>
                    <input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        aria-label="Email Address"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="register-password">Password</label>
                    <input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                        placeholder="At least 8 characters"
                        aria-label="Password"
                    />
                </div>
                <button type="submit" disabled={loading}>
                     {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>
            <p className="toggle-view">
                Already have an account?{' '}
                <button type="button" onClick={onSwitch}>Login here</button>
            </p>
        </div>
    );
};

export default Auth;
