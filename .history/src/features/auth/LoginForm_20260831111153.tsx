import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface AuthFormData {
  name: string;
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>();

  const { login, registerPatient } = useAuth();
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setAuthError(null);
    reset();
  };

  const onSubmit = async (data: AuthFormData) => {
    // ---> LOG ADDED HERE <---
    console.log("1. FORM SUBMITTED - Raw Data:", data);

    setAuthError(null);
    try {
      if (isLoginMode) {
        await login(data.email, data.password);
      } else {
        await registerPatient(data.name, data.email, data.password);
      }

      // Navigate based on the newly saved user in local storage
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === "staff") {
          navigate("/staff");
        } else {
          navigate("/patient");
        }
      }
    } catch (error: any) {
      setAuthError(error.message || "Authentication failed. Please try again.");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg border border-slate-100">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">
          {isLoginMode ? "Welcome Back" : "Create an Account"}
        </h2>
        <p className="text-slate-500 mt-2">
          {isLoginMode
            ? "Sign in to access your dashboard"
            : "Register as a patient to book appointments"}
        </p>
      </div>

      {authError && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isLoginMode && (
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            {...register("name", {
              required: !isLoginMode ? "Name is required" : false,
            })}
            error={errors.name?.message}
          />
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Please enter a valid email address",
            },
          })}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
          error={errors.password?.message}
        />

        <div className="pt-2">
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {isLoginMode ? "Sign In" : "Register"}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={toggleMode}
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          {isLoginMode ? "Sign up here" : "Sign in here"}
        </button>
      </div>
    </div>
  );
};
