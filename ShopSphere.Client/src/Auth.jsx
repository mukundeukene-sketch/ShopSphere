import { useState } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5293/api";

function Auth({ onLogin, onClose }) {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        console.log("Attempting login...");

        const response = await axios.post(
          `${API_URL}/Auth/login`,
          {
            email: formData.email.trim(),
            password: formData.password,
          }
        );

        console.log("Login response:", response.data);

        const user = response.data;

        localStorage.setItem(
          "shopsphere_user",
          JSON.stringify(user)
        );

        setSuccess(`Welcome, ${user.fullName}!`);

        setTimeout(() => {
          onLogin(user);
        }, 800);
      } else {
        console.log("Attempting registration...");

        const response = await axios.post(
          `${API_URL}/Auth/register`,
          {
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }
        );

        console.log("Register response:", response.data);

        setSuccess(
          "Account created successfully! Please login."
        );

        setFormData({
          fullName: "",
          email: formData.email,
          password: "",
        });

        setTimeout(() => {
          setIsLogin(true);
          setSuccess("");
        }, 1200);
      }
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">

        <button
          type="button"
          className="auth-close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="auth-header">

          <div className="auth-logo">
            {isLogin ? (
              <LogIn size={24} />
            ) : (
              <UserPlus size={24} />
            )}
          </div>

          <h2>
            {isLogin
              ? "Welcome Back"
              : "Create Account"}
          </h2>

          <p>
            {isLogin
              ? "Login to continue shopping with ShopSphere."
              : "Join ShopSphere and start shopping today."}
          </p>

        </div>

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-message auth-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <div className="auth-input-group">
              <User size={19} />

              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <Mail size={19} />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-input-group">
            <Lock size={19} />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>

        </form>

        <div className="auth-switch">

          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
          >
            {isLogin
              ? "Create Account"
              : "Login"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default Auth;