"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import styles from "./AuthForm.module.css";
import googleLogo from "@/assets/google_logo.svg";
import Image from "next/image";
import CustomTextInput from "@/components/inputs/CustomTextInput";
import { getIdToken } from "firebase/auth";
import type { User } from "firebase/auth";

interface SigninProps {
  isPopup?: boolean;
  onClose?: () => void;
  onOpenLogin?: () => void;
}

interface SigninForm {
  Email: string;
  Password: string;
  ConfirmPassword: string;
}

const Signin: React.FC<SigninProps> = ({
  isPopup = false,
  onClose,
  onOpenLogin,
}) => {
  const auth = useAuth();
  const router = useRouter();

  if (!auth) {
    throw new Error("Signin must be used inside AuthContextProvider");
  }

  const { googleSignIn, emailSignUp } = auth;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SigninForm>({
    defaultValues: {
      Email: "",
      Password: "",
      ConfirmPassword: "",
    },
  });

  const passwordValue = watch("Password");

  const syncUserWithBackend = async (firebaseUser: User) => {
    const token = await getIdToken(firebaseUser);

    console.log("🔥 Firebase UID:", firebaseUser.uid);
    console.log("🔥 Token:", token.slice(0, 20), "...");

    const res = await fetch("/api/auth/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("🔥 Sync status:", res.status);

    const data = await res.json();
    console.log("🔥 Sync response:", data);

    if (!res.ok) throw new Error("Failed to sync user");
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");

      const result = await googleSignIn();
      await syncUserWithBackend(result.user);

      onClose?.();
      router.push("/interactives");
    } catch (err) {
      console.error(err);
      setError("Google sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SigninForm) => {
    if (data.Password !== data.ConfirmPassword) {
      setError("Passwords must match.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const result = await emailSignUp(data.Email, data.Password);
      await syncUserWithBackend(result.user);

      onClose?.();
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const Content = (
    <div className={styles["Auth-modal-container"]}>
      {isLoading && (
        <div className={styles["Auth-modal-loading"]}>Loading...</div>
      )}

      <div className={styles["Auth-modal-header"]}>
        <p className={styles["Auth-modal-logo"]}>HOLOGRAMA</p>
        <h2 className={styles["Auth-modal-title"]}>Create your account</h2>
      </div>

      {error && <div className={styles["Auth-modal-error"]}>{error}</div>}

      <form
        className={styles["Auth-modal-form"]}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className={styles["Auth-modal-inputs"]}>
          <CustomTextInput
            name="Email"
            register={register}
            label="Email"
            placeholder="Enter your email"
            error={errors.Email}
            type="email"
          />

          <CustomTextInput
            name="Password"
            register={register}
            label="Password"
            placeholder="Enter your password"
            error={errors.Password}
            type="password"
          />

          <CustomTextInput
            name="ConfirmPassword"
            register={register}
            label="Confirm password"
            placeholder="Confirm your password"
            error={errors.ConfirmPassword}
            type="password"
          />
        </div>

        <div className={styles["Auth-modal-auth-buttons"]}>
          <button type="submit" className={styles["Auth-modal-btn-primary"]}>
            Sign up
          </button>

          <div className={styles["Auth-modal-divider"]}>OR</div>

          <button
            type="button"
            className={styles["Auth-modal-btn-google"]}
            onClick={handleGoogleSignIn}
          >
            <Image src={googleLogo} alt="Google" />
            Continue with Google
          </button>

          <p className={styles["Auth-modal-signup-text"]}>
            Already have an account?{" "}
            <a
              href="#"
              className={styles["Auth-modal-link"]}
              onClick={(e) => {
                e.preventDefault();
                onOpenLogin?.();
              }}
            >
              Log in
            </a>
          </p>
        </div>
      </form>
    </div>
  );

  return isPopup ? (
    Content
  ) : (
    <div className={styles["Auth-modal-overlay"]}>{Content}</div>
  );
};

export default Signin;
