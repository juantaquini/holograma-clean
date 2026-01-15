"use client";

import { FieldError, UseFormRegister } from "react-hook-form";
import styles from "./InputStyles.module.css";

type Props = {
  name: string;
  register: UseFormRegister<any>;
  label?: string;
  placeholder?: string;
  error?: FieldError;
  type?: string;
};

const CustomTextInput = ({
  name,
  register,
  label,
  placeholder,
  error,
  type = "text",
}: Props) => {
  return (
    <div className={styles["custom-input-container"]}>
      {label && (
        <div>
          <p className={styles["custom-input-label"]}>{label}</p>
        </div>
      )}

      <input
        type={type}
        placeholder={placeholder}
        className={`${styles["custom-text-input"]} ${
          error ? styles["custom-error-input"] : ""
        }`}
        {...register(name, {
          required: "This field is required",
          pattern:
            type === "email"
              ? {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                }
              : undefined,
        })}
      />

      {error && (
        <p className={styles["custom-error-message"]}>{error.message}</p>
      )}
    </div>
  );
};

export default CustomTextInput;
